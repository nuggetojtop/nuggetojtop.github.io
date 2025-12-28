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
      chunks.push(String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK_SIZE)));
    }
    return btoa(chunks.join(''));
  }

  async function ensureChineseFont(doc) {
    if (!doc || !doc.getFontList || !doc.addFileToVFS || !doc.addFont || !doc.setFont) {
      return;
    }

    const hasFont = () => {
      const fontList = doc.getFontList ? doc.getFontList() : null;
      return fontList && fontList[CHINESE_FONT_NAME];
    };

    if (hasFont()) {
      doc.setFont(CHINESE_FONT_NAME, "normal");
      return;
    }

    if (!chineseFontPromise) {
      chineseFontPromise = fetch(CHINESE_FONT_URL)
        .then(res => {
          if (!res.ok) {
            throw new Error(`字体下载失败（${res.status}）`);
          }
          return res.arrayBuffer();
        })
        .then(buffer => {
          chineseFontBase64 = bufferToBase64(buffer);
        })
        .catch(err => {
          chineseFontPromise = null;
          throw err;
        });
    }

    try {
      await chineseFontPromise;
      if (!hasFont()) {
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
