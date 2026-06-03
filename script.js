const form = document.getElementById("download-form");
const urlInput = document.getElementById("file-url");
const nameInput = document.getElementById("file-name");
const formatInput = document.getElementById("download-format");
const clearButton = document.getElementById("clear-button");
const downloadButton = document.getElementById("download-button");
const statusCard = document.getElementById("status-card");
const shareHint = document.getElementById("share-hint");
const shareLinks = document.getElementById("share-links");

function setStatus(title, message, tone = "ok") {
  statusCard.classList.remove("is-warn", "is-error");

  if (tone === "warn") {
    statusCard.classList.add("is-warn");
  }

  if (tone === "error") {
    statusCard.classList.add("is-error");
  }

  statusCard.innerHTML = `<strong>${title}</strong><p>${message}</p>`;
}

function sanitizeFileName(value) {
  return value.replace(/[<>:"/\\\\|?*\u0000-\u001F]/g, "_").trim();
}

function guessFileName(url, userFileName) {
  const manualName = sanitizeFileName(userFileName || "");
  if (manualName) {
    return manualName;
  }

  try {
    const parsed = new URL(url);
    const lastSegment = decodeURIComponent(parsed.pathname.split("/").filter(Boolean).pop() || "");
    const safeName = sanitizeFileName(lastSegment);
    return safeName || "downloaded-file";
  } catch {
    return "downloaded-file";
  }
}

function triggerBrowserDownload(url, fileName) {
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.target = "_blank";
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function renderShareInfo(info) {
  if (!info || !Array.isArray(info.accessLinks)) {
    shareHint.textContent = "暂时没有拿到共享地址，你仍然可以先在本机使用。";
    shareLinks.innerHTML = "";
    return;
  }

  shareHint.textContent = info.shareHint || "把下面的地址发给同一网络下的人。";
  shareLinks.innerHTML = "";

  info.accessLinks.forEach((item) => {
    const shareItem = document.createElement("div");
    shareItem.className = "share-item";

    const labelClass = item.label.includes("公开") || item.label.includes("发给")
      ? "share-label strong"
      : "share-label";

    shareItem.innerHTML = `<span class="${labelClass}">${item.label}</span><a href="${item.url}" target="_blank" rel="noopener">${item.url}</a>`;
    shareLinks.appendChild(shareItem);
  });
}

async function loadShareInfo() {
  try {
    const response = await fetch("/api/server-info");
    const info = await response.json();
    renderShareInfo(info);
  } catch (error) {
    shareHint.textContent = "共享地址读取失败，但本机下载功能不受影响。";
    shareLinks.innerHTML = "";
    console.error(error);
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const rawUrl = urlInput.value.trim();
  const rawName = nameInput.value.trim();
  const rawFormat = formatInput.value;

  if (!rawUrl) {
    setStatus("缺少链接", "先粘贴一个文件链接，再开始下载。", "error");
    return;
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(rawUrl);
  } catch {
    setStatus("链接格式不对", "请输入完整的 http 或 https 链接。", "error");
    return;
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    setStatus("链接类型暂不支持", "目前只支持 http 或 https 文件链接。", "error");
    return;
  }

  downloadButton.disabled = true;
  setStatus("正在处理", "本地下载器正在接管链接并生成可直接保存的文件。");

  try {
    const response = await fetch("/api/download", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: parsedUrl.toString(),
        fileName: rawName || guessFileName(parsedUrl.toString(), rawName),
        format: rawFormat,
      }),
    });

    if (!response.ok) {
      const errorPayload = await response.json().catch(() => null);
      throw new Error(errorPayload?.message || "下载失败，请稍后再试。");
    }

    const blob = await response.blob();
    const message = response.headers.get("X-Yuncang-Message") || "文件已准备好。";
    const disposition = response.headers.get("Content-Disposition") || "";
    const matchedName = disposition.match(/filename\*=UTF-8''([^;]+)|filename="?([^"]+)"?/i);
    const downloadedName = decodeURIComponent(matchedName?.[1] || matchedName?.[2] || guessFileName(parsedUrl.toString(), rawName));
    const objectUrl = URL.createObjectURL(blob);

    try {
      triggerBrowserDownload(objectUrl, downloadedName);
    } finally {
      setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
    }

    setStatus(
      "下载已准备好",
      `${message} 当前会直接下载到浏览器保存位置：${downloadedName}。`
    );
  } catch (error) {
    setStatus(
      "处理失败",
      error.message || "本地下载器暂时没能完成处理，请检查链接后重试。",
      "error"
    );
    console.error(error);
  } finally {
    downloadButton.disabled = false;
  }
});

clearButton.addEventListener("click", () => {
  form.reset();
  formatInput.value = "auto";
  urlInput.focus();
  setStatus("已清空", "你可以重新粘贴新的文件链接。");
});

urlInput.addEventListener("paste", () => {
  setTimeout(() => {
    if (!nameInput.value.trim()) {
      nameInput.value = guessFileName(urlInput.value.trim(), "");
    }
  }, 0);
});

urlInput.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
    form.requestSubmit();
  }
});

loadShareInfo();
