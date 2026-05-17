---
name: Parkinson's Helper
description: >
  A warm, encouraging PWA for Parkinson's patients — therapeutic games,
  medication reminders, tremor tracking, and daily-streak motivation.
  Built mobile-first with a soft café-beige palette and frosted-glass
  navigation that feels approachable to older adults while remaining
  modern enough for their caregivers.

colors:
  # ── Page & Surface ──────────────────────────────────────────────
  background:              "#f2dac6"   # warm café beige — entire page wash
  surface:                 "#ffffff"   # card / sheet surfaces
  surface-frosted-nav:     "rgba(255,255,255,0.75)"   # sticky top navbar
  surface-frosted-bottom:  "rgba(255,255,255,0.92)"   # bottom tab bar (mobile)
  surface-overlay:         "rgba(0,0,0,0.38)"         # modal backdrop

  # ── Text ────────────────────────────────────────────────────────
  on-surface:              "#2d2a26"   # primary text — dark warm brown
  on-surface-variant:      "#9e9890"   # secondary / subtext — warm gray

  # ── Border ──────────────────────────────────────────────────────
  outline:                 "rgba(0,0,0,0.07)"   # card & divider borders
  outline-hover:           "rgba(0,0,0,0.09)"

  # ── Primary (Terracotta) ─────────────────────────────────────────
  # Used for nav active state, primary CTA buttons, tremor test button
  primary:                 "#b86840"   # terracotta — all active/accent text
  primary-container:       "#f0c4a0"   # soft peach — nav active bg, button bg
  primary-container-light: "#fdf0e6"   # very light peach — progress ring inner

  # ── Semantic Game / Category Colors ─────────────────────────────
  blue:                    "#a8d4ff"
  blue-light:              "#f0f7ff"
  blue-vivid:              "#5b8def"   # Hand Game accent

  green:                   "#a8e6c8"
  green-light:             "#f0fdf6"
  green-vivid:             "#2a9d6e"   # Jump Game / success states

  yellow:                  "#ffd97d"
  yellow-light:            "#fffbec"
  yellow-vivid:            "#c8950a"   # mission points, star icons

  orange:                  "#ffcba4"
  orange-light:            "#fff7f0"
  orange-vivid:            "#e07a30"   # medicine / time-critical alerts

  purple-lavender:         "#ede8ff"   # icon container backgrounds (nav active)
  purple-vivid:            "#9b6ddf"   # Shadow Game accent

  cyan-vivid:              "#3ab0d8"   # Bird Game accent (coming soon)

  pink:                    "#ffb5c8"
  pink-light:              "#fff0f4"   # hero card gradient stop

  # ── Semantic States ──────────────────────────────────────────────
  success:                 "#34d399"   # green check / streak done
  warning:                 "#fbbf24"   # "soon" medicine badge
  streak-fire:             "#f97316"   # streak flame & counter
  error:                   "#e07a7a"   # delete icon tint
  locked:                  "#aaaaaa"   # locked level indicator

  # ── Bear & Bunny Decorations ─────────────────────────────────────
  deco-bear-body:          "#c4956a"
  deco-bear-muzzle:        "#a87550"
  deco-bunny-body:         "#ede0d0"
  deco-bunny-cheek:        "#d4907a"
  deco-cup:                "#a8c4d4"

typography:
  fontFamilies:
    primary: "'Segoe UI', 'Noto Sans Thai', sans-serif"

  scale:
    hero:
      fontSize: "22px"        # mobile
      fontSizeDesktop: "26px"
      fontWeight: 800
      lineHeight: "1.2"

    h2:
      fontSize: "20px"        # mobile
      fontSizeDesktop: "22px"
      fontWeight: 700
      lineHeight: "1.3"

    h3:
      fontSize: "14px"
      fontWeight: 700
      lineHeight: "1.4"

    body-lg:
      fontSize: "14px"
      fontWeight: 400
      lineHeight: "1.5"

    body-md:
      fontSize: "13px"
      fontWeight: 400
      lineHeight: "1.5"

    body-sm:
      fontSize: "12px"
      fontWeight: 400

    label-lg:
      fontSize: "15px"
      fontWeight: 700

    label-md:
      fontSize: "13px"
      fontWeight: 600

    label-sm:
      fontSize: "11px"
      fontWeight: 600

    label-xs:
      fontSize: "10px"
      fontWeight: 500

    nav-label-mobile:
      fontSize: "10px"
      fontWeight: 500   # 700 when active

    badge:
      fontSize: "10px"
      fontWeight: 700

spacing:
  unit:    "4px"
  xs:      "4px"
  sm:      "8px"
  md:      "12px"
  lg:      "16px"
  xl:      "20px"
  "2xl":   "24px"
  "3xl":   "28px"
  "4xl":   "32px"

  card-padding-mobile:   "16px 14px"
  card-padding-desktop:  "22px 22px"
  page-padding-mobile:   "16px 14px"
  page-padding-desktop:  "32px 20px"
  section-gap:           "16px"
  grid-gap-mobile:       "10px"
  grid-gap-desktop:      "14px"
  max-content-width:     "900px"

radii:
  none:      "0"
  xs:        "8px"    # icon containers, small elements
  sm:        "10px"   # nav icon pill, badge
  md:        "12px"   # icon squares, back button
  lg:        "14px"   # medicine row cards, level options
  xl:        "16px"   # game emoji icon container
  "2xl":     "18px"   # game hub cards
  "3xl":     "20px"   # main cards, nav icon, hero card
  modal:     "24px"   # level sheet top corners (mobile)
  pill:      "9999px" # chips, badges, nav desktop buttons

elevation:
  card:
    boxShadow: "0 2px 12px rgba(0,0,0,0.05)"
  card-hover:
    boxShadow: "0 8px 20px rgba(0,0,0,0.08)"
  game-card-hover:
    boxShadow: "0 8px 22px rgba(0,0,0,0.09)"
  modal:
    boxShadow: "0 -8px 40px rgba(0,0,0,0.14)"
  chip:
    boxShadow: "0 1px 6px rgba(0,0,0,0.05)"

motion:
  easing-default:  "ease"
  easing-spring:   "ease-in-out"

  duration-fast:   "150ms"
  duration-base:   "200ms"   # nav button color transitions
  duration-hover:  "150ms"   # card lift on hover
  duration-fade:   "700ms"   # medicine widget fade-out
  duration-modal:  "200ms"   # level sheet slide

  card-hover-lift:        "translateY(-3px)"
  medicine-fade-out:      "translateY(-12px)"

breakpoints:
  mobile:  "768px"    # below → bottom tab bar, compact layout
  wide:    "1160px"   # above → side bear/bunny decorations appear

components:
  card:
    background:   "{colors.surface}"
    border:       "1px solid {colors.outline}"
    borderRadius: "{radii.3xl}"
    boxShadow:    "{elevation.card.boxShadow}"

  card-hero:
    background:   "linear-gradient(135deg, #f5f0ff, #fff0f4)"
    borderRadius: "{radii.3xl}"

  card-mission-banner:
    background:   "linear-gradient(135deg, #fffbec, #fff4d6)"
    borderRadius: "{radii.3xl}"

  nav-top:
    background:       "{colors.surface-frosted-nav}"
    backdropFilter:   "blur(12px)"
    border:           "1px solid {colors.outline}"
    height-mobile:    "52px"
    height-desktop:   "56px"

  nav-bottom:
    background:       "{colors.surface-frosted-bottom}"
    backdropFilter:   "blur(16px)"
    border:           "1px solid {colors.outline}"
    height:           "calc(64px + env(safe-area-inset-bottom))"

  nav-button-active:
    color:            "{colors.primary}"
    iconBackground:   "{colors.primary-container}"
    iconBorderRadius: "{radii.sm}"

  nav-button-desktop-active:
    background:   "{colors.primary-container}"
    color:        "{colors.primary}"
    borderRadius: "{radii.pill}"
    padding:      "5px 13px"

  button-primary:
    background:   "{colors.primary-container}"
    color:        "{colors.primary}"
    borderRadius: "{radii.lg}"
    padding:      "12px 32px"
    fontWeight:   700
    border:       "none"

  button-pill-secondary:
    background:   "{colors.orange-light}"
    color:        "{colors.orange-vivid}"
    borderRadius: "{radii.pill}"
    padding:      "4px 12px"
    fontSize:     "12px"
    fontWeight:   600

  chip-mission:
    background:   "{colors.surface}"
    border:       "1px solid {colors.outline}"
    borderRadius: "{radii.pill}"
    padding:      "8px 14px"
    boxShadow:    "{elevation.chip.boxShadow}"

  badge-coming-soon:
    background:   "rgba(0,0,0,0.06)"
    color:        "#999999"
    borderRadius: "{radii.pill}"
    padding:      "2px 8px"
    fontSize:     "10px"
    fontWeight:   700

  badge-daily:
    background:   "{colors.yellow-light}"
    color:        "{colors.yellow-vivid}"
    borderRadius: "{radii.pill}"
    padding:      "2px 8px"
    fontSize:     "10px"
    fontWeight:   700

  game-card:
    background:   "{colors.surface}"
    border:       "1px solid {colors.outline}"
    borderRadius: "{radii.2xl}"
    padding-mobile:   "16px 14px"
    padding-desktop:  "20px 18px"
    boxShadow:    "{elevation.card.boxShadow}"
    cursor:       "pointer"
    transition:   "transform {motion.duration-hover}, box-shadow {motion.duration-hover}"

  game-card-unavailable:
    opacity:  0.58
    cursor:   "default"

  level-modal:
    background:         "{colors.surface}"
    borderRadius-mobile: "24px 24px 0 0"
    borderRadius-desktop: "24px"
    padding:             "24px 20px"
    boxShadow:           "{elevation.modal.boxShadow}"
    width-desktop:       "440px"

  level-option:
    border:       "2px solid {colors.outline}"
    borderRadius: "{radii.lg}"
    padding:      "14px 16px"
    transition:   "all 0.18s"

  level-option-active:
    borderColor:  "{game.color}"   # per-game accent color
    background:   "{game.bg}"

  medicine-row:
    background:       "{colors.surface}"
    border:           "1px solid {colors.outline}"
    borderRadius:     "{radii.lg}"
    padding:          "10px 14px"
    boxShadow:        "{elevation.card.boxShadow}"

  medicine-row-urgent:
    background:       "{colors.orange-light}"
    borderColor:      "{colors.orange}"

  check-button:
    width:        "34px"
    height:       "34px"
    borderRadius: "{radii.pill}"
    background:   "{colors.outline}"

  streak-counter:
    fontSize:     "80px"
    fontWeight:   900
    color:        "{colors.streak-fire}"
    textShadow:   "0 0 40px rgba(249,115,22,0.4)"

  progress-ring:
    size:         "64px"
    innerSize:    "48px"
    innerBackground: "{colors.primary-container-light}"
    trackColor:   "{colors.outline}"
    fillColor:    "{colors.primary}"
---

## Brand & Style

**Parkinson's Helper** is a therapeutic mobile-first PWA built for Parkinson's patients and their caregivers. The design philosophy is **"warm clinical"** — approachable enough for older adults with motor difficulties, rigorous enough that healthcare providers trust it. Every visual decision serves two goals simultaneously: reduce friction for users with tremor or reduced dexterity, and make daily therapy feel like a gentle ritual rather than a medical chore.

The overall aesthetic is **Soft Café Warmth** — a warm beige background the color of milky tea, white floating cards with almost-invisible borders, and a terracotta accent that reads as cozy rather than clinical. Playful SVG mascots (a bear with a coffee cup and a star-gazing bunny) flank the content on wide screens, adding personality without distracting from the core tasks.

## Colors

The palette is built on a single warm neutral base with categorical color pairs (light fill + vivid accent) for each domain.

**Background (`#f2dac6`)** is the soul of the interface — a muted clay-beige that reads "home" rather than "hospital." It is the only surface that uses this color; everything interactive floats above it on pure white cards.

**Terracotta primary (`#b86840` / container `#f0c4a0`)** drives all active states: the nav highlight, primary buttons, and the medicine progress ring. It was deliberately chosen over a typical blue or purple because it is the most legible warm color for older adults with mild color-vision changes and creates a harmonious relationship with the beige background.

**Categorical pairs** are strictly muted in their container form and vivid only as icon/text accents, ensuring they function as semantic labels rather than visual noise:
- 🎮 Games (Hand): Blue `#5b8def` / `#f0f7ff`
- 💊 Medicine: Orange `#e07a30` / `#fff7f0`
- 🌿 Progress/Success: Green `#2a9d6e` / `#f0fdf6`
- ⭐ Missions: Yellow `#c8950a` / `#fffbec`
- 🥊 Shadow Game: Purple `#9b6ddf` / `#f0eaff`
- 🔥 Streak: Fire orange `#f97316`

**Frosted glass** is used exclusively for navigation: the sticky top nav at 75% white opacity and the bottom tab bar at 92% white opacity. Both use `backdrop-filter: blur(12-16px)`. This keeps navigation visually separated from content without adding heavy borders.

## Typography

The font stack is `'Segoe UI', 'Noto Sans Thai', sans-serif` — a pragmatic pairing that works on Windows (Segoe UI), iOS/Android (system sans), and for Thai script (Noto Sans Thai) without any external font loading, keeping the PWA fast on hospital or home WiFi.

Weight usage follows a clear scale: **800** for page heroes (maximum legibility at large sizes), **700** for section headers and card titles, **600** for labels and interactive elements, **500** for secondary nav labels, **400** for body and descriptive text.

Font sizes are clamped between mobile and desktop with a consistent step: the hero heading scales from 22px (mobile) to 26px (desktop). All font sizes are set to `max(16px, 1em)` globally on inputs to prevent iOS auto-zoom on focus, a critical accessibility consideration for Parkinson's patients.

The streak counter breaks the scale at **80px / weight 900** to be the single most prominent data point in the app — the emotional anchor of the daily habit loop.

## Layout & Spacing

The layout follows a **Single Column Fluid Card Stack** model, constrained to 900px max-width and centered. Content never touches screen edges; mobile padding is 16px × 14px, desktop 32px × 20px.

**4px base unit** governs all spacing. Cards stack with a fixed 16px gap. Internal card padding is 14–28px depending on content density. Grid layouts appear in two contexts: the home menu (always 2-column) and the game hub (2-column mobile, 3-column desktop).

**Breakpoints are intentionally generous:**
- Under 768px → bottom tab bar, compact hero, single-column chips
- Over 1160px → side mascot decorations appear (bear left, bunny right), nav buttons expand

Touch targets are generously sized: nav tab buttons are at minimum 48px wide, action buttons 34–36px tall circles for tremor-tolerant tapping.

## Elevation & Depth

The layering system has three levels:

1. **Ground** — the warm beige page background
2. **Float** — white cards with `box-shadow: 0 2px 12px rgba(0,0,0,0.05)` and a barely-visible `1px rgba(0,0,0,0.07)` border. Cards rest at this level by default.
3. **Hover / Active** — cards lift to `0 8px 20px rgba(0,0,0,0.08)` with `translateY(-3px)` on mouse hover. This "lift" is exclusively a desktop affordance; on mobile no hover state is shown to avoid stuck-hover bugs.
4. **Overlay** — modal bottom sheets float above everything with `0 -8px 40px rgba(0,0,0,0.14)`. The backdrop dims to `rgba(0,0,0,0.38)`, dark enough to focus the modal but light enough to preserve context.

Shadows are warm-neutral (pure black at low opacity), never blue or colored, to avoid clashing with the beige background.

## Shapes

The shape language is **consistently round but not bubbly.** It scales with component prominence:

- **Main cards** use 20px radius — substantial rounding that feels soft, not childish
- **Game hub cards** use 18px — slightly tighter to fit more in the grid
- **Inner row cards** (medicine items, level options) use 14px — functional rounding
- **Icon containers** use 10–16px — small squares with moderate rounding
- **Buttons, chips, and badges** are fully pill-shaped (9999px) — clearly tappable, clearly interactive
- **Level modal** corners are 24px on the top two corners only (mobile bottom sheet), full 24px on desktop dialog

There are no sharp corners anywhere in the UI. Even the progress ring inner circle uses a perfectly round shape. This consistently soft geometry reinforces the app's approachable, non-institutional character.

## Components

### Navigation

The top nav logo area uses a small rounded-square icon container (12px radius) filled with the primary container color, housing a Brain icon in terracotta. On desktop, nav links are pill buttons that fill with the primary container on active. On mobile, tab bar buttons show a lavender pill (`#ede8ff`) behind the icon when active, with terracotta icon and label color.

### Cards

The base `Card` component is a pure white rectangle with 20px radius, a barely-visible warm border, and a subtle drop shadow. The hero card swaps the white background for a soft gradient (`#f5f0ff` → `#fff0f4`) to mark it as informational rather than interactive. The mission banner uses a warm yellow gradient (`#fffbec` → `#fff4d6`).

### Game Hub

Game cards carry their own per-game color identity: each has a colored emoji container (bg from game palette) and a tinted CTA label. Available cards hover-lift; unavailable cards drop to 58% opacity with a "เร็วๆ นี้" (Coming Soon) badge. The level selection bottom sheet slides over a dark overlay; level options highlight in the game's own accent color when selected.

### Medicine Widget

The home-screen medicine widget fades out with a combined `opacity 0.7s ease` and `translateY(-12px)` animation after all medicines are marked taken — 5 seconds after the last checkmark. This soft disappearance avoids a jarring layout shift. Row-level urgency is communicated by switching the row background to `#fff7f0` and the border to `#ffcba4` when a medicine time has passed.

### Streak Calendar

Streak days render as orange gradient circles (`#f97316` → `#ef4444`) with a glow shadow. Freeze days render in sky blue. Today's ring uses an indigo border (`#818cf8`) that fills with the streak gradient if today is already logged. The large numeric counter uses a warm text-shadow glow at 40% opacity to reinforce the "fire" metaphor without heavy illustration.

### Side Mascots

The bear (left) and bunny (right) are pure inline SVG, rendered only when viewport exceeds 1160px. They use `pointer-events: none` and `position: fixed` so they never interfere with scrolling or interaction. Opacity is 72% to keep them ambient rather than focal. The bear holds a steam-rising coffee cup; the bunny has decorative sparkle stars. Their warm tan/cream colors (`#c4956a`, `#ede0d0`) echo the beige background, making them feel like they belong to the same material world as the rest of the UI.

## Accessibility Notes

- All inputs are globally set to `font-size: max(16px, 1em)` to suppress iOS keyboard zoom
- `-webkit-tap-highlight-color: transparent` removes the flash on mobile taps
- `overscroll-behavior: none` prevents bounce-scroll that could disorient Parkinson's patients
- Touch targets for action buttons are ≥ 34px diameter circles, ≥ 48px wide for nav tabs
- Text contrast: `#2d2a26` on `#ffffff` achieves approximately 15:1; `#b86840` on `#f0c4a0` achieves approximately 3.5:1 (decorative/active states only, never used for body text)
