pub const MOBILE_UPLOAD_HTML: &str = r#"<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Baulr — Mobile Upload</title>
  <style>
    :root {
      --bg: #09090b;
      --card: #18181b;
      --border: #27272a;
      --accent: #22c55e;
      --accent-muted: rgba(34, 197, 94, 0.15);
      --text: #fafafa;
      --text-muted: #a1a1aa;
      --danger: #ef4444;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      padding: 1.5rem 1rem 3rem;
      -webkit-font-smoothing: antialiased;
    }
    .header {
      text-align: center;
      margin-bottom: 2rem;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 500;
      background: var(--accent-muted);
      color: var(--accent);
      margin-bottom: 0.75rem;
    }
    .badge::before {
      content: "";
      width: 0.45rem;
      height: 0.45rem;
      border-radius: 50%;
      background: var(--accent);
    }
    h1 {
      font-size: 1.35rem;
      font-weight: 700;
      letter-spacing: -0.02em;
    }
    .subtitle {
      color: var(--text-muted);
      font-size: 0.85rem;
      margin-top: 0.35rem;
    }
    .dropzone {
      background: var(--card);
      border: 2px dashed var(--border);
      border-radius: 1.25rem;
      padding: 2.25rem 1.5rem;
      text-align: center;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
    }
    .dropzone:active, .dropzone.dragover {
      border-color: var(--accent);
      background: rgba(34, 197, 94, 0.05);
    }
    .icon-circle {
      width: 3.25rem;
      height: 3.25rem;
      border-radius: 1rem;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text);
    }
    .btn {
      background: var(--accent);
      color: #052e16;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 0.75rem;
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: 0.25rem;
    }
    .btn:active { transform: scale(0.98); }
    .file-input { display: none; }
    .file-list {
      margin-top: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .file-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 0.85rem;
      padding: 0.85rem 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .file-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.85rem;
    }
    .file-name {
      font-weight: 600;
      max-width: 70%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .file-status {
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    .file-status.done { color: var(--accent); }
    .file-status.error { color: var(--danger); }
    .progress-bar {
      height: 0.35rem;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 9999px;
      overflow: hidden;
    }
    .progress-fill {
      height: 100%;
      background: var(--accent);
      width: 0%;
      transition: width 0.15s ease;
    }
    .footer {
      margin-top: auto;
      text-align: center;
      font-size: 0.75rem;
      color: var(--text-muted);
      padding-top: 2rem;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="badge">Connected to your computer</div>
    <h1>Baulr Mobile Vault</h1>
    <p class="subtitle">Select photos or videos to safely offload to your cloud vault</p>
  </div>

  <label for="file-input" class="dropzone" id="dropzone">
    <div class="icon-circle">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="17 8 12 3 7 8"/>
        <line x1="12" y1="3" x2="12" y2="15"/>
      </svg>
    </div>
    <div style="font-weight:600; font-size: 0.95rem;">Tap to select media</div>
    <div style="font-size: 0.8rem; color: var(--text-muted);">Photos, 4K videos, documents</div>
    <span class="btn">Choose Photos & Videos</span>
  </label>
  <input type="file" id="file-input" class="file-input" multiple accept="image/*,video/*,application/pdf">

  <div class="file-list" id="file-list"></div>

  <div class="footer">
    Files stream directly over your local Wi-Fi to your computer.
  </div>

  <script>
    const token = new URLSearchParams(window.location.search).get("token") || "";
    const fileInput = document.getElementById("file-input");
    const fileList = document.getElementById("file-list");
    const dropzone = document.getElementById("dropzone");

    function formatBytes(bytes) {
      if (bytes === 0) return "0 B";
      const k = 1024;
      const sizes = ["B", "KB", "MB", "GB"];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return (bytes / Math.pow(k, i)).toFixed(1) + " " + sizes[i];
    }

    fileInput.addEventListener("change", (e) => {
      const files = Array.from(e.target.files || []);
      if (files.length === 0) return;
      files.forEach(uploadFile);
      fileInput.value = "";
    });

    function uploadFile(file) {
      const card = document.createElement("div");
      card.className = "file-card";
      card.innerHTML = `
        <div class="file-header">
          <span class="file-name"></span>
          <span class="file-status">Sending (${formatBytes(file.size)})...</span>
        </div>
        <div class="progress-bar"><div class="progress-fill"></div></div>
      `;
      card.querySelector(".file-name").textContent = file.name;
      fileList.prepend(card);

      const status = card.querySelector(".file-status");
      const fill = card.querySelector(".progress-fill");

      const formData = new FormData();
      formData.append("file", file);

      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/upload?token=" + encodeURIComponent(token));

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          fill.style.width = percent + "%";
          status.textContent = percent + "% (" + formatBytes(event.loaded) + " / " + formatBytes(event.total) + ")";
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          fill.style.width = "100%";
          status.className = "file-status done";
          status.textContent = "Saved on computer";
        } else {
          status.className = "file-status error";
          status.textContent = "Upload failed (" + xhr.status + ")";
        }
      };

      xhr.onerror = () => {
        status.className = "file-status error";
        status.textContent = "Connection error";
      };

      xhr.send(formData);
    }
  </script>
</body>
</html>
"#;
