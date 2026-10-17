---
description: Semantic versioning standards (SemVer 2.0), triple-file version sync (package.json, tauri.conf.json, Cargo.toml), Git release tagging, and GitHub Actions desktop packaging workflow.
trigger: model_decision
---

# Release, Versioning & Desktop Packaging Rules

**File:** `.agents/rules/release-versioning.md`  
**Scope:** Applied when bumping versions, creating releases, tagging, or editing desktop packaging workflows  
**Audience:** AI agents and human contributors managing Baulr releases

---

## 1. Semantic Versioning Protocol (SemVer 2.0)

All versions follow the standard `MAJOR.MINOR.PATCH` pattern:

```
v 0 . 2 . 0
  │   │   └── PATCH : Bug fixes, style polish, performance tweaks (zero new features)
  │   └────── MINOR : New features, new capabilities (e.g. Share Links, LAN QR upload)
  └────────── MAJOR : Breaking vault changes, or graduation to v1.0.0 (General Availability)
```

### The 0.x.x Initial Development Rules

1. **Never hesitate to bump MINOR directly:** You do NOT need to cycle through patch versions (`0.1.1`, `0.1.2`) before bumping minor (`0.2.0`). If new user-facing features or capabilities were added since the last release, jump directly to the next minor version.
2. **Patch resets:** When bumping MINOR, always reset PATCH to `0` (e.g., `0.1.0` ➔ `0.2.0`).
3. **Pre-release conventions:**
   - Tag format: `vX.Y.Z` (e.g., `v0.2.0`) or `vX.Y.Z-beta.N` (e.g., `v0.2.0-beta.1`).
   - During `0.x.x` active beta development, keep the GitHub Release marked with the **"Set as a pre-release"** checkbox.
4. **Graduation to v1.0.0:** Only upgrade to `1.0.0` when all MVP milestones are battle-tested, data-safety guarantees are proven, and the app is ready for general public use.

---

## 2. The 3-File Version Invariant

In Tauri v2 desktop apps, version numbers **must always remain strictly in sync** across 3 configuration files. Never update one without updating the other two:

| File                                                           | Target Key          | Example              |
| :------------------------------------------------------------- | :------------------ | :------------------- |
| [`package.json`](../../package.json)                           | `"version"`         | `"version": "0.2.0"` |
| [`src-tauri/tauri.conf.json`](../../src-tauri/tauri.conf.json) | `"version"`         | `"version": "0.2.0"` |
| [`src-tauri/Cargo.toml`](../../src-tauri/Cargo.toml)           | `[package] version` | `version = "0.2.0"`  |

After updating `Cargo.toml`, always run `cargo check` inside `src-tauri` so that `src-tauri/Cargo.lock` updates automatically to match.

---

## 3. Step-by-Step Release Workflow

Follow this exact sequence whenever releasing a new build:

### Step 1: Pre-Flight Verification

Never release unverified code. Ensure frontend tests, build, and backend checks pass cleanly:

```bash
pnpm test
pnpm build
cd src-tauri && cargo check && cd ..
```

### Step 2: Bump Version Across the 3 Files

Edit the version string in `package.json`, `src-tauri/tauri.conf.json`, and `src-tauri/Cargo.toml`.

### Step 3: Update Rust Lockfile

Run a quick check to update `Cargo.lock`:

```bash
cargo check --manifest-path src-tauri/Cargo.toml
```

### Step 4: Record in Project Memory

Append a 3-line entry to [`docs/PROJECT_LOGS.md`](../../docs/PROJECT_LOGS.md) following `.agents/skills/project-logs/SKILL.md`.

### Step 5: Commit on Main

```bash
git add package.json src-tauri/tauri.conf.json src-tauri/Cargo.toml src-tauri/Cargo.lock docs/PROJECT_LOGS.md
git commit -m "chore(release): bump version to X.Y.Z"
```

### Step 6: Create Annotated Git Tag

Always use an **annotated tag** (`-a`) prefixed with `v`:

```bash
git tag -a vX.Y.Z -m "Release vX.Y.Z"
```

### Step 7: Push Commits & Tags to Origin

```bash
git push origin main vX.Y.Z
```

---

## 4. GitHub Actions Desktop Packaging

Pushing any tag matching `v*` automatically triggers [`.github/workflows/release.yml`](../../.github/workflows/release.yml):

- **macOS Runner (`macos-latest`):** Bundles Apple Silicon ARM64 (`.dmg` and `.app`).
- **Windows Runner (`windows-latest`):** Bundles Windows installer (`.exe` / `.msi`).
- **Automated Draft:** `tauri-action` creates a **Draft Release** on GitHub with binaries attached.

### Post-CI Release Checklist

1. Open GitHub repository ➔ **Releases**.
2. Find the drafted release for `vX.Y.Z`.
3. Add release summary notes detailing user-facing features or fixes.
4. If the build is still in beta testing, ensure **"Set as a pre-release"** is checked.
5. Click **Publish release**.
