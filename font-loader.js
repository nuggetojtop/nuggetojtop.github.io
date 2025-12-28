(function() {
  const CHINESE_FONT_NAME = "WenKaiLite";
  const CHINESE_FONT_FILE = "WenKaiLite-Regular.ttf";
  const CHINESE_FONT_URL = "https://cdn.jsdelivr.net/npm/lxgw-wenkai-lite-webfont@1.7.0/LXGWWenKaiLite-Regular.ttf";
  const CHUNK_SIZE = 0x8000;
  let chineseFontPromise = null;
  let chineseFontBase64 = "";

  function bufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    const chunks = [];
    for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
      let chunkStr = "";
      const end = Math.min(i + CHUNK_SIZE, bytes.length);
      for (let j = i; j < end; j++) {
        chunkStr += String.fromCharCode(bytes[j]);
      }
      chunks.push(chunkStr);
    }
    return btoa(chunks.join(''));
  }

  async function ensureChineseFont(doc) {
    if (!doc || !doc.getFontList || !doc.addFileToVFS || !doc.addFont || !doc.setFont) {
      return;
    }

    const initialFonts = doc.getFontList ? doc.getFontList() : null;
    if (initialFonts && initialFonts[CHINESE_FONT_NAME]) {
      doc.setFont(CHINESE_FONT_NAME, "normal");
      return;
    }

    if (!chineseFontPromise) {
      chineseFontPromise = (async () => {
        const res = await fetch(CHINESE_FONT_URL);
        if (!res.ok) {
          throw new Error(`字体下载失败（${res.status}）`);
        }
        const buffer = await res.arrayBuffer();
        chineseFontBase64 = bufferToBase64(buffer);
        return chineseFontBase64;
      })().catch(err => {
        chineseFontPromise = null;
        throw err;
      });
    }

    try {
      await chineseFontPromise;
      const currentFonts = doc.getFontList ? doc.getFontList() : null;
      if (!currentFonts || !currentFonts[CHINESE_FONT_NAME]) {
        if (chineseFontBase64) {
          doc.addFileToVFS(CHINESE_FONT_FILE, chineseFontBase64);
          doc.addFont(CHINESE_FONT_FILE, CHINESE_FONT_NAME, "normal");
        } else {
          throw new Error("未获取到中文字体数据");
        }
      }
      doc.setFont(CHINESE_FONT_NAME, "normal");
    } catch (err) {
      console.warn("中文字体加载失败，已回退为默认字体。", err);
      doc.setFont("helvetica", "normal");
    }
  }

  window.ensureChineseFont = ensureChineseFont;
})();
