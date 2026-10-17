pub const MOBILE_UPLOAD_HTML: &str = r#"<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <title>Baulr — Mobile Vault</title>
  <style>
    :root {
      --background: #09090b;
      --foreground: #f4f4f5;
      --card: #121215;
      --card-muted: #18181b;
      --border: #27272a;
      --border-subtle: rgba(255, 255, 255, 0.07);
      --primary: #fafafa;
      --primary-foreground: #18181b;
      --muted: #a1a1aa;
      --muted-foreground: #71717a;
      --success: #22c55e;
      --success-muted: rgba(34, 197, 94, 0.12);
      --destructive: #ef4444;
      --destructive-muted: rgba(239, 68, 68, 0.12);
      --radius: 0.75rem;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-tap-highlight-color: transparent;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background-color: var(--background);
      color: var(--foreground);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: max(1.25rem, env(safe-area-inset-top)) 1rem max(1.5rem, env(safe-area-inset-bottom));
      -webkit-font-smoothing: antialiased;
      touch-action: manipulation;
    }

    .container {
      width: 100%;
      max-width: 440px;
      display: flex;
      flex-direction: column;
      flex: 1;
      gap: 1.25rem;
    }

    /* Top App Bar */
    .app-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.25rem 0.25rem 0.5rem;
    }

    .brand {
      display: flex;
      flex-direction: column;
    }

    .brand-title {
      font-size: 1.15rem;
      font-weight: 600;
      letter-spacing: -0.02em;
      color: var(--foreground);
    }

    .brand-sub {
      font-size: 0.75rem;
      color: var(--muted-foreground);
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.25rem 0.65rem;
      border-radius: 9999px;
      font-size: 0.72rem;
      font-weight: 500;
      background: var(--card-muted);
      color: var(--muted);
      border: 1px solid var(--border);
    }

    .status-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--success);
    }

    /* Mobile-first Upload Card */
    .upload-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: var(--card);
      border: 1px dashed var(--border);
      border-radius: var(--radius);
      padding: 2.25rem 1.25rem;
      text-align: center;
      cursor: pointer;
      transition: background-color 0.15s ease, border-color 0.15s ease;
      user-select: none;
    }

    .upload-card:active, .upload-card.dragover {
      background: var(--card-muted);
      border-color: #3f3f46;
    }

    .upload-icon-box {
      width: 3rem;
      height: 3rem;
      border-radius: 50%;
      background: var(--card-muted);
      border: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--foreground);
      margin-bottom: 0.85rem;
    }

    .upload-title {
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--foreground);
      margin-bottom: 0.25rem;
    }

    .upload-desc {
      font-size: 0.78rem;
      color: var(--muted);
      line-height: 1.4;
    }

    .file-input { display: none; }

    /* Batch Overall Progress */
    .batch-card {
      display: none;
      flex-direction: column;
      gap: 0.6rem;
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 0.9rem 1rem;
    }

    .batch-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.8rem;
    }

    .batch-title {
      font-weight: 500;
      color: var(--foreground);
    }

    .batch-stats {
      font-size: 0.75rem;
      color: var(--muted);
      font-variant-numeric: tabular-nums;
    }

    /* Progress Bar (Shadcn style) */
    .progress-bar {
      height: 4px;
      background: var(--border);
      border-radius: 9999px;
      overflow: hidden;
      width: 100%;
    }

    .progress-fill {
      height: 100%;
      background: var(--foreground);
      width: 0%;
      border-radius: 9999px;
      transition: width 0.15s ease;
    }

    /* File List */
    .file-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      flex: 1;
      padding-right: 2px;
    }

    .file-card {
      background: var(--card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius);
      padding: 0.75rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      animation: fadeIn 0.15s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(3px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .file-main {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .file-thumb {
      width: 2.5rem;
      height: 2.5rem;
      border-radius: 0.5rem;
      background: var(--card-muted);
      border: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--muted);
      flex-shrink: 0;
      overflow: hidden;
    }

    .file-thumb img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .file-info {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }

    .file-name {
      font-weight: 500;
      font-size: 0.84rem;
      color: var(--foreground);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .file-meta {
      font-size: 0.72rem;
      color: var(--muted);
      font-variant-numeric: tabular-nums;
    }

    .file-status-wrap {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-shrink: 0;
    }

    .pill {
      font-size: 0.7rem;
      font-weight: 500;
      padding: 0.18rem 0.5rem;
      border-radius: 9999px;
      background: var(--card-muted);
      color: var(--muted);
      border: 1px solid var(--border);
    }

    .pill.done {
      background: var(--success-muted);
      color: var(--success);
      border-color: rgba(34, 197, 94, 0.25);
    }

    .pill.error {
      background: var(--destructive-muted);
      color: var(--destructive);
      border-color: rgba(239, 68, 68, 0.25);
    }

    .retry-btn {
      background: transparent;
      color: var(--foreground);
      border: 1px solid var(--border);
      padding: 0.2rem 0.5rem;
      border-radius: 0.4rem;
      font-size: 0.72rem;
      font-weight: 500;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
    }

    .retry-btn:active {
      background: var(--card-muted);
    }

    .footer {
      margin-top: auto;
      text-align: center;
      font-size: 0.72rem;
      color: var(--muted-foreground);
      padding-top: 1.5rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <header class="app-header">
      <div class="brand">
        <h1 class="brand-title">Baulr</h1>
        <span class="brand-sub">Direct Wi-Fi Transfer</span>
      </div>
      <div class="status-badge" id="header-badge">
        <span class="status-dot"></span>
        <span id="header-status-text">Connected</span>
      </div>
    </header>

    <!-- Upload Card Tap Area -->
    <label for="file-input" class="upload-card" id="dropzone">
      <div class="upload-icon-box">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/>
          <line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
      </div>
      <div class="upload-title">Choose photos & files</div>
      <div class="upload-desc">Tap to browse media or documents</div>
    </label>
    <input type="file" id="file-input" class="file-input" multiple accept="image/*,video/*,application/pdf">

    <!-- Batch Progress Card -->
    <div class="batch-card" id="batch-card">
      <div class="batch-header">
        <span class="batch-title" id="batch-title">Uploading...</span>
        <span class="batch-stats" id="batch-stats">0%</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" id="batch-progress-fill"></div>
      </div>
    </div>

    <!-- Active and Completed Files -->
    <div class="file-list" id="file-list"></div>

    <footer class="footer">
      Files transfer peer-to-peer on your local network.
    </footer>
  </div>

  <script>
    const token = new URLSearchParams(window.location.search).get("token") || "";
    const fileInput = document.getElementById("file-input");
    const fileList = document.getElementById("file-list");
    const dropzone = document.getElementById("dropzone");
    const headerStatusText = document.getElementById("header-status-text");
    const batchCard = document.getElementById("batch-card");
    const batchTitle = document.getElementById("batch-title");
    const batchStats = document.getElementById("batch-stats");
    const batchProgressFill = document.getElementById("batch-progress-fill");

    function formatBytes(bytes) {
      if (!bytes || bytes === 0) return "0 B";
      const k = 1024;
      const sizes = ["B", "KB", "MB", "GB"];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return (bytes / Math.pow(k, i)).toFixed(1) + " " + sizes[i];
    }

    function triggerHaptic(type) {
      if (!window.navigator || !window.navigator.vibrate) return;
      try {
        if (type === "select") navigator.vibrate(12);
        if (type === "done") navigator.vibrate([15, 50, 15]);
      } catch {}
    }

    let wakeLock = null;
    async function acquireWakeLock() {
      if ("wakeLock" in navigator && !wakeLock) {
        try {
          wakeLock = await navigator.wakeLock.request("screen");
        } catch {}
      }
    }

    function releaseWakeLock() {
      if (wakeLock) {
        try { wakeLock.release(); } catch {}
        wakeLock = null;
      }
    }

    const queue = [];
    let isProcessing = false;
    let completedCount = 0;
    let totalBatchCount = 0;
    let totalBatchBytes = 0;
    let uploadedBatchBytes = 0;

    function renderThumb(container, file) {
      if (file.type.startsWith("image/")) {
        const img = document.createElement("img");
        img.src = URL.createObjectURL(file);
        img.onload = () => URL.revokeObjectURL(img.src);
        container.appendChild(img);
        return;
      }

      const ext = (file.name.split(".").pop() || "").toLowerCase();
      let icon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>`;

      if (["mp4", "mov", "m4v", "webm"].includes(ext)) {
        icon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></svg>`;
      }
      container.innerHTML = icon;
    }

    function updateBatchTelemetry() {
      if (totalBatchCount === 0) {
        batchCard.style.display = "none";
        headerStatusText.textContent = "Connected";
        return;
      }

      batchCard.style.display = "flex";

      if (isProcessing) {
        const percent = totalBatchBytes > 0
          ? Math.min(99, Math.round((uploadedBatchBytes / totalBatchBytes) * 100))
          : Math.round((completedCount / totalBatchCount) * 100);
        batchTitle.textContent = `Uploading ${completedCount + 1} of ${totalBatchCount}...`;
        batchStats.textContent = `${percent}%`;
        batchProgressFill.style.width = percent + "%";
        headerStatusText.textContent = `Sending ${completedCount + 1}/${totalBatchCount}`;
      } else if (completedCount >= totalBatchCount && queue.length === 0) {
        batchTitle.textContent = "All files transferred";
        batchStats.textContent = "100%";
        batchProgressFill.style.width = "100%";
        headerStatusText.textContent = `${completedCount} saved`;
        triggerHaptic("done");
      }
    }

    function enqueueFiles(files) {
      if (!files || files.length === 0) return;
      triggerHaptic("select");
      totalBatchCount += files.length;
      files.forEach((file) => {
        totalBatchBytes += file.size;
        const item = createCard(file);
        queue.push(item);
      });
      updateBatchTelemetry();
      processQueue();
    }

    fileInput.addEventListener("change", (e) => {
      enqueueFiles(Array.from(e.target.files || []));
      fileInput.value = "";
    });

    dropzone.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropzone.classList.add("dragover");
    });
    dropzone.addEventListener("dragleave", () => {
      dropzone.classList.remove("dragover");
    });
    dropzone.addEventListener("drop", (e) => {
      e.preventDefault();
      dropzone.classList.remove("dragover");
      enqueueFiles(Array.from(e.dataTransfer.files || []));
    });

    function createCard(file) {
      const card = document.createElement("div");
      card.className = "file-card";
      card.innerHTML = `
        <div class="file-main">
          <div class="file-thumb"></div>
          <div class="file-info">
            <span class="file-name"></span>
            <span class="file-meta">${formatBytes(file.size)}</span>
          </div>
          <div class="file-status-wrap">
            <span class="pill">Waiting</span>
            <button type="button" class="retry-btn" style="display:none;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                <path d="M3 3v5h5"/>
                <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
                <path d="M16 21h5v-5"/>
              </svg>
              Retry
            </button>
          </div>
        </div>
        <div class="progress-bar"><div class="progress-fill"></div></div>
      `;
      card.querySelector(".file-name").textContent = file.name;
      renderThumb(card.querySelector(".file-thumb"), file);
      fileList.prepend(card);

      const pill = card.querySelector(".pill");
      const meta = card.querySelector(".file-meta");
      const fill = card.querySelector(".progress-fill");
      const retryBtn = card.querySelector(".retry-btn");

      const item = { file, card, pill, meta, fill, retryBtn };

      retryBtn.addEventListener("click", () => {
        retryBtn.style.display = "none";
        pill.style.display = "inline-block";
        pill.className = "pill";
        pill.textContent = "Waiting";
        meta.textContent = formatBytes(file.size);
        fill.style.width = "0%";
        queue.push(item);
        processQueue();
      });

      return item;
    }

    async function processQueue() {
      if (isProcessing) return;
      if (queue.length === 0) {
        releaseWakeLock();
        updateBatchTelemetry();
        return;
      }

      isProcessing = true;
      await acquireWakeLock();
      updateBatchTelemetry();

      const item = queue.shift();
      uploadItem(item, () => {
        isProcessing = false;
        processQueue();
      });
    }

    function uploadItem(item, onDone) {
      const { file, pill, meta, fill, retryBtn } = item;
      pill.className = "pill";
      pill.textContent = "0%";
      meta.textContent = `${formatBytes(file.size)} • Sending`;

      const formData = new FormData();
      formData.append("file", file);

      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/upload?token=" + encodeURIComponent(token));

      let lastLoaded = 0;
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const delta = event.loaded - lastLoaded;
          lastLoaded = event.loaded;
          uploadedBatchBytes += delta;

          const percent = Math.round((event.loaded / event.total) * 100);
          fill.style.width = percent + "%";
          pill.textContent = percent + "%";
          meta.textContent = `${formatBytes(file.size)} • ${percent}%`;
          updateBatchTelemetry();
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const remaining = file.size - lastLoaded;
          if (remaining > 0) uploadedBatchBytes += remaining;

          fill.style.width = "100%";
          pill.className = "pill done";
          pill.textContent = "Saved";
          meta.textContent = formatBytes(file.size);
          retryBtn.style.display = "none";
          completedCount += 1;
        } else {
          pill.className = "pill error";
          pill.textContent = "Failed";
          meta.textContent = "Upload failed";
          retryBtn.style.display = "inline-flex";
        }
        updateBatchTelemetry();
        onDone();
      };

      xhr.onerror = () => {
        pill.className = "pill error";
        pill.textContent = "Error";
        meta.textContent = "Connection lost";
        retryBtn.style.display = "inline-flex";
        updateBatchTelemetry();
        onDone();
      };

      xhr.send(formData);
    }
  </script>
</body>
</html>
"#;