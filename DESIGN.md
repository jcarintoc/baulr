---
name: Baulr
description: Local-First Unified Cloud Vault & Offloader
colors:
  primary: "oklch(0.448 0.119 151.328)"
  primary-foreground: "oklch(0.982 0.018 155.826)"
  neutral-bg: "oklch(0.153 0.006 107.1)"
  surface: "oklch(0.228 0.013 107.4)"
  muted: "oklch(0.286 0.016 107.4)"
  text: "oklch(0.988 0.003 106.5)"
  text-muted: "oklch(0.737 0.021 106.9)"
  border: "oklch(1 0 0 / 10%)"
  status-active: "oklch(0.627 0.194 149.214)"
  status-accent: "oklch(0.65 0.18 230)"
  destructive: "oklch(0.704 0.191 22.216)"
typography:
  display:
    fontFamily: "Manrope Variable, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Manrope Variable, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Manrope Variable, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "normal"
  body:
    fontFamily: "Manrope Variable, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "Manrope Variable, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.05em"
rounded:
  sm: "8px"
  md: "11px"
  lg: "14px"
  xl: "20px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
  button-primary-hover:
    backgroundColor: "{colors.status-active}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.text}"
    rounded: "{rounded.sm}"
    padding: "6px 12px"
  card-surface:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.lg}"
    padding: "16px"
---

# Design System: Baulr

## Overview

**Creative North Star: "The Obsidian Vault"**

Baulr is a high-precision personal storage instrument. Designed for non-technical users who care deeply about their family media, archives, and documents, it speaks the aesthetic language of a secure, solid physical vault rather than an ephemeral SaaS web app. Every element projects calm, permanence, and non-destructive safety.

The interface is built around high-clarity telemetry: bold storage meters, distinct cloud account statuses, and luminous signal indicators that clearly communicate health without visual noise. Surfaces feel machined and intentional, utilizing warm earthen dark tones that prevent eye fatigue while commanding immediate trust.

**Key Characteristics:**
- **Zero-Shadow Tonal Depth:** Strictly flat surfaces layered through charcoal tonality and ghost hairline borders.
- **Telemetry-Led Precision:** Progress bars and capacity gauges act as visual anchors, making storage status unmistakable at a glance.
- **Physical Reassurance:** Soft pill badges, tactile feedback, and explicit non-destructive safety confirmations.

## Colors

## Colors & Themes

Baulr provides 3 pre-made themes that unify all primary accents under a single coherent chromatic temperature. Instead of conflicting simultaneous hues (e.g. blue and green clashing), all accents, telemetry meters, and active signals adapt dynamically to the user's selected theme via CSS variable tokens defined in `src/App.css`.

### Available Themes
1. **Obsidian (Default):** Emerald accent (`oklch(0.627 0.194 149.2)`). The signature vault aesthetic—grounded, organic, and calm.
2. **Titanium:** Arctic Cyan accent (`oklch(0.65 0.18 230)`). Precision graphite and cool telemetry, ideal for clean industrial workflows.
3. **Bronze:** Warm Amber accent (`oklch(0.72 0.18 65)`). Archival darks with warm amber highlights, reminiscent of antique vault machinery.

### Semantic CSS Tokens (`src/App.css`)
- `--vault-accent`: Core vibrant highlight for buttons, gauges, and active states.
- `--vault-accent-hover`: Slightly deeper tone for hover states.
- `--vault-accent-muted`: 12% alpha fill for pills, callouts, and secondary indicators.
- `--vault-accent-border`: 25% alpha stroke for accent containers.
- `--vault-accent-text`: High-legibility text tone for badges, labels, and telemetry text.

### Neutral Foundations
- **Obsidian Ground** (`oklch(0.153 0.006 107.1)`): Base background canvas for the entire application window.
- **Smoked Charcoal** (`oklch(0.228 0.013 107.4)`): Elevated surface fill for cards, pool containers, and account cards.
- **Muted Ghost** (`oklch(0.286 0.016 107.4)`): Secondary container backgrounds and inactive gauge rails.
- **Ghost Border** (`oklch(1 0 0 / 10%)`): 1px translucent stroke defining surface geometry and division.
- **Alabaster Text** (`oklch(0.988 0.003 106.5)`): High-contrast primary headings and metric values.
- **Muted Slate Text** (`oklch(0.737 0.021 106.9)`): Secondary descriptive labels, byte metrics, and subtexts.

### Status Signals
- **Status Accent** (`var(--vault-accent)`): Verified transfers, healthy daemon, and active cloud remotes match the current theme palette.
- **Warning Amber** (`oklch(0.75 0.18 70)`): Indicates initializing background processes or transient sync states.
- **Hazard Coral** (`oklch(0.704 0.191 22.216)`): Indicates disconnected remotes or critical errors.

### Named Rules
**The Single-Accent Harmonization Rule.** Never pair clashing accent families (e.g. bright sky-blue alongside emerald-green). All accent-level visual signals route through `--vault-accent` tokens so the entire interface shifts seamlessly between Obsidian, Titanium, and Bronze.

**The Zero-Shadow Rule.** Surfaces stay strictly flat at rest. Depth is established purely through tonal background contrast and 1px ghost borders (`oklch(1 0 0 / 10%)`). Drop shadows are banned.

**The Semantic Signal Rule.** Saturated accent colors are reserved exclusively for status metrics and telemetry; decorative illustration gradients must not mimic system status indicators.

## Typography

**Display & Body Font:** `Manrope Variable` (with `sans-serif` fallback)

**Character:** Modern geometric sans-serif with humanist warmth, open counters, and high legibility at dense data-scale sizes.

### Hierarchy
- **Display** (Bold 700, 1.5rem / 24px, line-height 1.2, tracking -0.02em): Large storage quota metrics and modal titles.
- **Headline** (SemiBold 600, 1.125rem / 18px, line-height 1.3, tracking -0.01em): Window title and section headings.
- **Title** (SemiBold 600, 0.875rem / 14px, line-height 1.4, tracking normal): Account names, card headers, and button labels.
- **Body** (Regular 400, 0.875rem / 14px, line-height 1.5, tracking normal): Descriptions, instructions, and empty state guides.
- **Label** (Medium 500, 0.75rem / 12px, line-height 1.4, tracking 0.05em, uppercase): Section overlines, transfer speeds, and status badges.

### Named Rules
**The Tabular Number Rule.** All file sizes, transfer speeds, percentages, and time durations must render using tabular figures (`font-variant-numeric: tabular-nums`) to prevent layout jitter during live sync updates.

## Layout

Baulr utilizes a focused, single-column dashboard model tailored for desktop utility windows (800x600 minimum window dimension).

- **Window Canvas:** Max-width 896px (`max-w-4xl`), centered horizontally with generous 24px padding (`p-6`).
- **Vertical Flow:** 24px spacing (`gap-6`) between major functional zones (Storage Pool, Connected Accounts, Offload Dropzone).
- **Dense Grid:** Connected accounts display in a responsive 2-column grid (`grid-cols-1 md:grid-cols-2 gap-4`).
- **Drag Regions:** The header titlebar includes a native drag zone for window dragging, while interactive buttons and inputs strictly exclude drag handlers.

## Elevation & Depth

Baulr employs a strictly planar, tonal elevation model. Depth is created through surface contrast (dark base canvas -> elevated charcoal cards) rather than simulated light-source drop shadows.

### Surface Vocabulary
- **Base Canvas:** `bg-neutral-950` (`oklch(0.153 0.006 107.1)`).
- **Level 1 Container:** `bg-neutral-900/60` with 1px border `border-neutral-800` (`oklch(1 0 0 / 10%)`).
- **Level 2 Interactive Cards:** `bg-neutral-900/40` hovering to `bg-neutral-900/80`.
- **Level 3 Active Modal / Dialog:** `bg-neutral-900` with solid `border-neutral-700`.

### Named Rules
**The Ghost Border Fallback.** Every card and surface separation must carry a 1px border. Never rely on subtle background contrast alone, ensuring crisp separation on uncalibrated or high-brightness monitors.

## Shapes

- **Base Radius:** `0.875rem` (14px).
- **Cards & Containers:** `rounded-2xl` (16px–18px) for comfortable, soft frame geometry.
- **Action Buttons & Inputs:** `rounded-lg` (8px–10px) providing tactile, clickable boundaries.
- **Status Pills:** `rounded-full` (9999px) indicating continuous system states.
- **Dropzone:** 2px dashed border (`border-2 border-dashed border-neutral-800`) transitioning to solid cyan on drag-over.

## Components

### Buttons
- **Shape:** Rounded-lg (8px radius).
- **Primary:** Filled `bg-sky-600` hovering to `bg-sky-500` with white text and 8px 16px padding.
- **Ghost / Sync:** Transparent with 1px border `border-neutral-800` and muted text, brightening to white on hover.
- **Active State:** Click response with subtle scale `active:scale-[0.98]` and smooth 150ms transition.

### Cards / Containers
- **Corner Style:** Rounded-2xl (16px radius).
- **Background:** `bg-neutral-900/60` with backdrop-blur.
- **Border:** 1px `border-neutral-800`.
- **Internal Padding:** 24px (`p-6`) on hero containers, 16px (`p-4`) on account cards.

### Status Badges (Pills)
- **Shape:** Rounded-full (9999px radius).
- **Active:** Emerald fill `bg-emerald-500/10`, text `text-emerald-400`, border `border-emerald-500/20`, featuring a 6px pulsing dot.
- **Initializing:** Amber fill `bg-amber-500/10`, text `text-amber-400`, border `border-amber-500/20`.

### Storage Pool Bar
- **Rail:** Height 14px (`h-3.5`), background `bg-neutral-800`, border `border-neutral-700/40`.
- **Fill:** Gradient fill from Beacon Cyan to Indigo (`from-sky-500 to-indigo-500`), rounded-full with 500ms ease-out width transition.

### Offload Dropzone
- **Style:** 2px dashed border, 40px internal padding (`p-10`), center-aligned icon and copy.
- **Hover / Drag Over:** Border shifts to cyan `hover:border-sky-500/50`, background subtle glow `hover:bg-sky-500/5`.

## Do's and Don'ts

### Do:
- **Do** format all file sizes and transfer speeds consistently using binary units (KB, MB, GB, TB) via `formatBytes`.
- **Do** keep cards and surfaces strictly flat with 1px ghost borders (`oklch(1 0 0 / 10%)`).
- **Do** display reassuring safety language ("Zero-loss cryptographic verify enabled", "Moved to Trash") whenever user files are affected.
- **Do** keep React component files under 150 lines by extracting modular sub-components.

### Don't:
- **Don't** use heavy, multi-layered drop shadows or glow effects on resting surfaces.
- **Don't** use technical jargon (e.g., "MD5 mismatch", "RPC timeout", "CLI exit 1") in user-facing toasts or cards.
- **Don't** apply `data-tauri-drag-region` to clickable buttons, inputs, or interactive controls.
- **Don't** use saturated accent colors decoratively on generic body text or non-interactive borders.
