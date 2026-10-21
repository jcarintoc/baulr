# Baulr

> **Local-First Unified Cloud Vault & Offloader**

Baulr pools your cloud storage accounts (Google Drive, Microsoft OneDrive, and more) into a single virtual vault on your desktop. Offload local files safely to reclaim drive space without worrying about which cloud provider has room.

---

## Features

- **Unified Cloud Pool:** Combines multiple cloud accounts into a single storage quota using an intelligent union allocation policy.
- **Data Safety First:** Verification before local deletion; files are moved to the OS Trash, never permanently destroyed.
- **Mobile LAN Transfer:** Upload photos and videos directly from your phone over your local Wi-Fi by scanning a dynamic QR code—no mobile app required.
- **Cloud Media Streaming:** Browse remote documents and stream media directly on localhost without downloading entire files first.
- **Bandwidth Control:** Built-in network throttler to cap upload and download speeds.
- **Privacy & Security:** Runs 100% locally on your device; OAuth tokens and credentials never leave your machine.

---

## Tech Stack

- **Desktop Framework:** [Tauri v2](https://tauri.app/) (Rust Backend BFF)
- **Engine:** [Rclone](https://rclone.org/) sidecar daemon (`rclone rcd`) over loopback JSON-RPC
- **Frontend:** [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Tailwind CSS v4](https://tailwindcss.com/), [Zustand](https://zustand.docs.pmnd.rs/)
- **UI Components:** [shadcn/ui](https://ui.shadcn.com/) with Base UI primitives

---

## Getting Started

### Prerequisites

1. **Node.js** (v20+ recommended) and **pnpm** (v10+):
   ```bash
   corepack enable
   corepack prepare pnpm@latest --activate
   ```
2. **Rust Toolchain:**
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```
3. **Rclone Sidecar Binary:**
   Baulr expects an `rclone` executable in `src-tauri/binaries/` named for your target platform:
   - macOS (Apple Silicon): `src-tauri/binaries/rclone-aarch64-apple-darwin`
   - Windows (x64): `src-tauri/binaries/rclone-x86_64-pc-windows-msvc.exe`

   *(See [CONTRIBUTING.md](CONTRIBUTING.md) for download helpers).*

### Running in Development

```bash
# 1. Install frontend dependencies
pnpm install

# 2. Launch the desktop app in development mode
pnpm tauri dev
```

### Running Tests

```bash
# Run frontend unit tests
pnpm test

# Run Rust backend tests
cargo test --manifest-path src-tauri/Cargo.toml
```

---

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) before getting started.

---

## Security

Please report security vulnerabilities according to our [Security Policy](SECURITY.md).

---

## License

[MIT](LICENSE) © 2026 jcarintoc
