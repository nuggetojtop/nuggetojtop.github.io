(function() {
  const CHINESE_FONT_NAME = "WenKaiLite";
  const CHINESE_FONT_FILE = "WenKaiLite-Regular.ttf";
  const CHINESE_FONT_URL = "https://cdn.jsdelivr.net/npm/lxgw-wenkai-lite-webfont@1.7.0/LXGWWenKaiLite-Regular.ttf";
  const BASE64_CHUNK_SIZE = 32768; // 32KB chunks to avoid call stack limits during base64 conversion
  const MAX_FONT_RETRY = 3;
  let chineseFontPromise = null;
  let chineseFontBase64 = "";
  let chineseFontAttempts = 0;

  function bufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    const chunks = [];
    for (let i = 0; i < bytes.length; i += BASE64_CHUNK_SIZE) {
      const chars = [];
      const end = Math.min(i + BASE64_CHUNK_SIZE, bytes.length);
      for (let j = i; j < end; j++) {
        chars.push(String.fromCharCode(bytes[j]));
      }
      chunks.push(chars.join(''));
    }
    return btoa(chunks.join(''));
  }

  async function ensureChineseFont(doc) {
    if (!doc || !doc.getFontList || !doc.addFileToVFS || !doc.addFont || !doc.setFont) {
      console.warn("缺少必要的 jsPDF 字体方法，已跳过字体加载 / Missing required jsPDF font APIs, font load skipped.");
      return;
    }

    const isFontAvailable = (fontList) => {
      if (!fontList) return false;
      const lowerName = CHINESE_FONT_NAME.toLowerCase();
      return Boolean(
        fontList[CHINESE_FONT_NAME] ||
        (fontList.fonts && fontList.fonts[CHINESE_FONT_NAME]) ||
        fontList[lowerName] ||
        (fontList.fonts && fontList.fonts[lowerName])
      );
    };

    const initialFonts = doc.getFontList ? doc.getFontList() : null;
    if (isFontAvailable(initialFonts)) {
      doc.setFont(CHINESE_FONT_NAME, "normal");
      return;
    }

    if (!chineseFontPromise) {
      chineseFontPromise = (async () => {
        chineseFontAttempts++;
        const res = await fetch(CHINESE_FONT_URL);
        if (!res.ok) {
          throw new Error(`字体下载失败 / Font download failed (status ${res.status})`);
        }
        const buffer = await res.arrayBuffer();
        chineseFontBase64 = bufferToBase64(buffer);
        return chineseFontBase64;
      })().catch(err => {
        if (chineseFontAttempts < MAX_FONT_RETRY) {
          chineseFontPromise = null; // allow retry on next invocation while under retry limit
        } else {
          chineseFontAttempts = 0; // reset counter after hitting retry cap to allow future attempts
          chineseFontPromise = null;
        }
        console.error("字体下载失败，将在下次调用时重试 / Font download failed, will retry on next attempt.", err);
        throw err;
      });
    }

    try {
      await chineseFontPromise;
      const currentFonts = doc.getFontList ? doc.getFontList() : null;
      if (!isFontAvailable(currentFonts)) {
        if (chineseFontBase64) {
          doc.addFileToVFS(CHINESE_FONT_FILE, chineseFontBase64);
          doc.addFont(CHINESE_FONT_FILE, CHINESE_FONT_NAME, "normal");
        } else {
          throw new Error("未获取到中文字体数据 / Missing Chinese font data");
        }
      }
      doc.setFont(CHINESE_FONT_NAME, "normal");
      chineseFontAttempts = 0;
    } catch (err) {
      console.warn("中文字体加载失败，已回退为默认字体 / Font load failed, fallback to default.", err);
      doc.setFont("helvetica", "normal");
    }
  }

  function showErrorMessage(targetEl, message, append = false) {
    if (!targetEl) return;
    const errorNode = document.createElement('div');
    errorNode.className = 'error';
    errorNode.textContent = message;
    if (append) {
      targetEl.appendChild(errorNode);
    } else {
      while (targetEl.firstChild) {
        targetEl.removeChild(targetEl.firstChild);
      }
      targetEl.appendChild(errorNode);
    }
  }

  window.ensureChineseFont = ensureChineseFont;
  window.showErrorMessage = showErrorMessage;
})();
