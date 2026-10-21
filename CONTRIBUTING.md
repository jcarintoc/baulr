# Contributing to Baulr

Thank you for your interest in contributing to Baulr!

## Core Principles

1. **Data Safety Invariant:** Baulr handles personal files and photos. We never delete local files until their remote copy passes verification, and local deletions must move files to the OS Trash.
2. **Web-Developer-First Maintainability:** Standard patterns, clear separation of concerns, and components strictly under 150 lines.
3. **Rust BFF:** Thin, safe backend layer. Zero `.unwrap()` or `.expect()` in production paths.
4. **Human-Friendly Copy:** Microcopy must be written strictly from the user's perspective without mechanical jargon.

---

## Setting Up Your Development Environment

### 1. Prerequisites

- **Node.js** (v20+) & **pnpm** (v10+)
- **Rust** (stable toolchain)
- **Tauri Prerequisites:** Check [Tauri Prerequisites](https://tauri.app/start/prerequisites/) for your operating system.

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Setting Up the Rclone Sidecar Binary

Baulr embeds an `rclone` executable in `src-tauri/binaries/`.

#### macOS (Apple Silicon):
```bash
mkdir -p src-tauri/binaries
curl -L -o rclone.zip https://downloads.rclone.org/v1.75.2/rclone-v1.75.2-osx-arm64.zip
unzip -j -q rclone.zip "*/rclone" -d src-tauri/binaries/
mv src-tauri/binaries/rclone src-tauri/binaries/rclone-aarch64-apple-darwin
chmod +x src-tauri/binaries/rclone-aarch64-apple-darwin
rm rclone.zip
```

#### Windows (x64):
```powershell
New-Item -ItemType Directory -Force -Path src-tauri/binaries
Invoke-WebRequest -Uri "https://downloads.rclone.org/v1.75.2/rclone-v1.75.2-windows-amd64.zip" -OutFile "rclone.zip"
Expand-Archive -Path "rclone.zip" -DestinationPath "rclone-extracted" -Force
$rcloneExe = Get-ChildItem -Path "rclone-extracted" -Filter "rclone.exe" -Recurse | Select-Object -First 1
Move-Item -Path $rcloneExe.FullName -Destination "src-tauri/binaries/rclone-x86_64-pc-windows-msvc.exe" -Force
Remove-Item -Recurse -Force "rclone.zip", "rclone-extracted"
```

---

## Development Workflow

1. Fork the repository and create your branch from `main`:
   ```bash
   git checkout -b feat/my-feature
   ```
2. Start the desktop application in dev mode:
   ```bash
   pnpm tauri dev
   ```
3. Run verification tests before submitting changes:
   ```bash
   pnpm test
   cargo test --manifest-path src-tauri/Cargo.toml
   pnpm build
   ```
4. Push your branch and open a Pull Request against `main`.
