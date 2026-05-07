# Design System — Spotify Minimalism

> Single source of truth for visual language. Tokens, components, and rules. Read alongside `frontend.md` (process / aesthetic philosophy) and `requirements_ai.md` (architectural code rules).

---

## 1. Philosophy

**Restraint, not absence.** Spotify's UI is minimal, but every element is *deliberate*: a 4-pixel difference in card padding, a 2% opacity shift on hover, a 200ms ease on a button — they all matter. The aesthetic comes from precision, not flourish.

Three guiding rules:

1. **Content first.** Album covers, artist photos, track lists. The chrome is whisper-quiet so the content sings.
2. **Black is the canvas.** Surfaces are layered shades of near-black. Color is rationed: green is the brand, white is the text, everything else fades.
3. **Hover reveals.** Buttons appear on hover, secondary actions hide until needed, the cursor is rewarded with subtle motion.

---

## 2. Color tokens (CSS variables, defined in `colors.scss`)

All colors are defined once, themed via `data-theme="dark|light"`. Default theme is dark. **Never hard-code a hex in a `.module.scss` file** — always reference a token.

### Dark theme (default)

| Token | Value | Use |
|---|---|---|
| `--bg` | `#000000` | Body background, edges of the app |
| `--surface` | `#121212` | Sidebar, top-nav, bottom player |
| `--surface-elevated` | `#1A1A1A` | Cards, modals, dropdowns |
| `--surface-highlight` | `#282828` | Hover state on cards / list rows |
| `--surface-press` | `#3E3E3E` | Active / pressed state |
| `--accent` | `#1DB954` | The single brand-green. CTAs, current-playing indicator, progress fill |
| `--accent-hover` | `#1ED760` | Hover state on accent-colored elements |
| `--accent-press` | `#169C46` | Active state on accent-colored elements |
| `--text` | `#FFFFFF` | Titles, primary text |
| `--text-secondary` | `#B3B3B3` | Subtitles, metadata, helper text |
| `--text-tertiary` | `#7A7A7A` | Disabled, placeholder, low-priority |
| `--border` | `rgba(255,255,255,0.06)` | Hairline dividers |
| `--overlay` | `rgba(0,0,0,0.6)` | Modal backdrop |
| `--shadow` | `0 12px 40px rgba(0,0,0,0.45)` | Elevation shadow on cards/dropdowns |
| `--danger` | `#E22134` | Destructive actions |
| `--success` | `#1DB954` | Same as accent — Spotify uses one green |

### Light theme

| Token | Value |
|---|---|
| `--bg` | `#F4F4F4` (page background — slightly off-white so cards lift) |
| `--surface` | `#FFFFFF` (sidebar + topnav + bottom-player — bright white) |
| `--surface-elevated` | `#FFFFFF` (cards — paired with `--elevation-1` for visual lift) |
| `--surface-highlight` | `#ECECEC` (hover states on cards / list rows) |
| `--surface-press` | `#D6D6D6` (active / pressed) |
| `--accent` | `#1DB954` (unchanged — the brand green) |
| `--accent-hover` | `#169C46` |
| `--accent-press` | `#0F7A37` |
| `--text` | `#121212` |
| `--text-secondary` | `#5A5A5A` |
| `--text-tertiary` | `#7A7A7A` |
| `--border` | `rgba(0,0,0,0.10)` (visible against white surfaces) |
| `--border-strong` | `rgba(0,0,0,0.18)` (focus rings, dividers) |
| `--overlay` | `rgba(0,0,0,0.32)` |
| `--shadow` | `0 12px 40px rgba(0,0,0,0.10)` |

### Hard rule

A `.module.scss` file may **only** contain color *tokens*, never literal hex/rgb. The exceptions are utility helpers (e.g. semi-transparent overlays in keyframes) — and even those should use `color-mix()` against a token.

---

## 3. Typography

### Font

- **Primary:** `Manrope` — variable weight, geometric, neutral. Already shipped in `assets/fonts/manrope/`.
- **Fallback stack:** `-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif`.
- We *do not* use Spotify's proprietary "Spotify Circular" — Manrope is a close, free alternative.

### Scale

Base 16px. All sizing through `functions.rem()`.

| Token / Use | Size | Weight | Line-height |
|---|---|---|---|
| `--type-display` (page hero, e.g. artist name) | `clamp(2rem, 6vw, 5rem)` | 900 | 1.1 |
| `--type-title-1` (section header) | `2rem` (32px) | 700 | 1.2 |
| `--type-title-2` (sub-section, card title) | `1.5rem` (24px) | 700 | 1.3 |
| `--type-title-3` (list-row title, modal heading) | `1rem` (16px) | 700 | 1.4 |
| `--type-body` (default body) | `0.875rem` (14px) | 400 | 1.5 |
| `--type-body-strong` | `0.875rem` (14px) | 700 | 1.5 |
| `--type-caption` (metadata, helper) | `0.75rem` (12px) | 500 | 1.4 |
| `--type-overline` (tab labels, all-caps) | `0.6875rem` (11px) | 700 / `letter-spacing: 0.08em` / `text-transform: uppercase` | 1.3 |

Define these as CSS custom properties in `_typography.scss`. Use them by token, never re-declare a font-size in a component file unless the component genuinely needs a one-off.

---

## 4. Spacing

8-point grid. Multiples of 4 only — no 5px, no 13px.

| Token | Value | Use |
|---|---|---|
| `--space-0` | `0` | — |
| `--space-1` | `0.25rem` (4px) | tightest gap |
| `--space-2` | `0.5rem` (8px) | tight gap, icon-text spacing |
| `--space-3` | `0.75rem` (12px) | within-component padding |
| `--space-4` | `1rem` (16px) | default padding |
| `--space-5` | `1.5rem` (24px) | between sections inside a card |
| `--space-6` | `2rem` (32px) | between page sections |
| `--space-7` | `3rem` (48px) | hero padding, generous breathing room |
| `--space-8` | `4rem` (64px) | between major page regions |

---

## 5. Radius

| Token | Value | Use |
|---|---|---|
| `--radius-sm` | `4px` | Inputs, small buttons |
| `--radius-md` | `8px` | Cards, modals, dropdowns |
| `--radius-lg` | `12px` | Hero cards, large surfaces |
| `--radius-circle` | `50%` | Avatars, artist circles, play button |
| `--radius-pill` | `9999px` | Pill buttons, tags |

**Album covers:** `--radius-sm` (Spotify uses subtly rounded squares — 4px feels right at all sizes).
**Artist images:** `--radius-circle`.
**Playlist covers:** `--radius-sm`.

---

## 6. Shadows & elevation

| Token | Value | Use |
|---|---|---|
| `--elevation-0` | `none` | Flat surfaces (sidebar, top-nav) |
| `--elevation-1` | `0 4px 12px rgba(0,0,0,0.15)` | Cards on hover |
| `--elevation-2` | `0 12px 40px rgba(0,0,0,0.45)` | Modals, dropdowns |
| `--elevation-player` | `0 -2px 16px rgba(0,0,0,0.4)` | Bottom player (shadow projects upward) |

Light-theme shadows use the same offsets but with `rgba(0,0,0,0.06–0.12)`.

---

## 7. Motion

- **Default duration:** `200ms`.
- **Easing:** `cubic-bezier(0.3, 0, 0, 1)` — Spotify's signature ease (fast start, gentle settle).
- **Respect `prefers-reduced-motion: reduce`** — disable all transitions globally in that case.

| Token | Value | Use |
|---|---|---|
| `--motion-fast` | `120ms` | Hover color shifts, focus rings |
| `--motion-base` | `200ms` | Most state transitions |
| `--motion-slow` | `320ms` | Modal enter/exit, drawer slide |
| `--motion-ease` | `cubic-bezier(0.3, 0, 0, 1)` | Default |
| `--motion-ease-out` | `cubic-bezier(0, 0, 0, 1)` | Things settling into place |
| `--motion-ease-in` | `cubic-bezier(0.4, 0, 1, 1)` | Things leaving |

**Hover lift** on cards: `transform: translateY(-2px)` + elevation-1 over `--motion-fast`. Subtle.

---

## 8. Layout

### Breakpoints

| Token | Value | Behavior |
|---|---|---|
| `mobile` | `≤ 640px` | sidebar collapses to drawer; bottom player compacts to mini-bar |
| `tablet` | `641–1024px` | sidebar shows icons only; bottom player full |
| `desktop` | `1025–1599px` | full sidebar (~240px), full player |
| `wide` | `≥ 1600px` | full sidebar + right-rail (friends activity) |

### Page grid

```
┌─────────┬─────────────────────────────────────────────┬────────┐
│ sidebar │         main / scrollable content           │ rail   │
│  240px  │                                             │ 320px  │
│         │                                             │ (≥wide)│
├─────────┴─────────────────────────────────────────────┴────────┤
│                       bottom player (90px)                     │
└────────────────────────────────────────────────────────────────┘
```

Top-nav lives **inside** main, sticky, with backdrop-blur once scrolled.

---

## 9. Components — visual specs

### Buttons

| Variant | Bg | Text | Border | Radius | Padding |
|---|---|---|---|---|---|
| Primary | `--accent` | `#000000` | none | `--radius-pill` | `0.75rem 2rem` |
| Secondary | transparent | `--text` | `1px solid var(--text-secondary)` | `--radius-pill` | `0.75rem 2rem` |
| Ghost | transparent | `--text-secondary` | none | `--radius-md` | `0.5rem 0.75rem` |
| Icon | transparent | `--text-secondary` | none | `--radius-circle` | `0.5rem` (square) |

**Primary button hover:** scale to `1.04` over `--motion-fast`. No color change. *That's the Spotify move.*
**All buttons:** `:focus-visible` shows a 2px `--accent` outline at 2px offset.

### Play button (the green circle)

The most-clicked button in the app. Fixed treatment:

- 48×48 (default), 56×56 (hero), 32×32 (track-row hover).
- `--accent` background, `#000000` icon.
- `:hover { transform: scale(1.06); }` over `--motion-fast`.
- Icon swaps `play_arrow ↔ pause` with no animation (Spotify is sharp on this).

### Cards

Album / playlist / artist card. Vertical layout: 1:1 cover on top, title below, subtitle below.

- Background: `--surface-elevated`.
- Padding: `--space-4` (16px).
- Radius: `--radius-md`.
- Hover: `background: --surface-highlight`, `transform: translateY(-2px)`, play button fades in over the cover.
- Cover overlay on hover: a green play-circle bottom-right of the cover, fades in with `--motion-base`, slides up `8px` from a starting `translateY(8px)`.

### List rows (track rows in playlists / albums / search)

- Height: 56px.
- Columns (desktop): `[index 32px] [cover+title flex] [album flex] [date 120px] [duration 56px] [actions 80px]`.
- Hover: `background: --surface-highlight`. Index column shows a play icon instead of the number.
- Currently-playing row: title in `--accent`, faint speaker-wave icon in index column.

### Sidebar nav item

- Height: 40px, padding `--space-3`, radius `--radius-sm`.
- Default: `--text-secondary` text + icon.
- Hover: `--text` text. No background change.
- Active route: `--text` text + bold weight.

### Inputs

- Background: `--surface-elevated`.
- Border: 1px solid transparent.
- Focus: border becomes `--text`, no glow. (Spotify focus rings are surprisingly minimal.)
- Radius: `--radius-pill` for search; `--radius-sm` for forms.
- Placeholder: `--text-tertiary`.

### Modals

- Backdrop: `--overlay` + `backdrop-filter: blur(8px)`.
- Container: `--surface-elevated`, radius `--radius-md`, max-width `560px`, padding `--space-7`.
- Enter animation: scale `0.96 → 1` + opacity `0 → 1` over `--motion-slow` with `--motion-ease-out`.

### Bottom player

- Height: `90px` (desktop), `64px` (mobile).
- Background: `--surface` (slightly elevated from page bg).
- Top border: `1px solid --border`.
- Three regions: `[left: cover 56×56 + track meta + heart]` `[center: shuffle + prev + play(green) + next + repeat + seek-bar]` `[right: queue + devices + volume]`.
- Mobile: collapses to single-row mini-bar with cover + title + play. Tap to expand to full-screen Now Playing view.

### Now-Playing (full-screen) — Phase 4+

- Black background (`#000`) with a saturated, slightly blurred extract of the current cover as a subtle ambient gradient behind.
- Cover: 360×360, centered, `--radius-md`.
- Below: title (display type), artist (title-2), album (caption).
- Player controls below in a row.

---

## 10. Iconography

- Source: existing `app/shared/ui/svg/` pattern (`PureComponent`, hardcoded `viewBox`, kebab-case file).
- Icon stroke / fill: `currentColor`. Color is set by parent.
- Default size: 20×20. Player: 24×24. Track-row index: 16×16.
- Use **filled** glyphs for active states, **outlined** for inactive (e.g. heart filled when liked, outlined when not).
- Spotify uses a small, tight icon set — don't sprawl. Each new icon must justify its existence.

---

## 11. Imagery

- **Album covers:** always 1:1, never letterboxed. Use `object-fit: cover`. Render at 2× the displayed size for retina via `srcset`.
- **Artist photos:** circular, always 1:1.
- **Hero backdrops** (artist / album page): blurred, saturated, color-extracted from the cover. Implementation: client-side via a `canvas` color sampler on first paint, cached in IndexedDB.
- **Lazy-load** every image off-screen via `loading="lazy"`.
- **Placeholders** while loading: `--surface-highlight` solid, no shimmer (Spotify keeps this dead-quiet).

---

## 12. Empty states & loading

- **Loading:** skeleton blocks with `--surface-highlight`. No spinners except for full-page transitions.
- **Empty:** centered, single-line, `--text-secondary`. Optional small illustration only if it adds clarity. Never apologetic ("Whoops!", "Uh oh!").
- **Errors:** title + one-sentence cause + one action. No stack traces, no error codes in the UI (but include them in `data-*` for support).

---

## 13. Accessibility — non-negotiable rules

- **Contrast:** every text-on-background meets WCAG AA (4.5:1 for body, 3:1 for ≥18pt). Run an audit before each phase ships.
- **Focus rings:** visible on every interactive element. `outline: 2px solid --accent; outline-offset: 2px;` is the default.
- **Keyboard:** every action reachable without a mouse. The bottom player is `role="region" aria-label="Player"`. Sliders use `<input type="range">` (native a11y). Modal traps focus.
- **Screen readers:** every icon-only button has `aria-label`. Every dynamic region (current track, queue) has `aria-live="polite"`.
- **Motion:** `@media (prefers-reduced-motion: reduce)` disables all `transition`/`animation` rules globally.

---

## 14. Light-theme contrast rules

In light theme, `--surface` and `--surface-elevated` are both pure white. Distinguish them by:

- Adding `--elevation-1` (small drop shadow) to elevated cards — gives them a subtle lift on the slightly grey `--bg`.
- Adding a `var(--border-width) solid var(--border)` border to standalone controls in the top-nav (theme-toggle, lang-select, history buttons) so they don't blend into the white header bar.
- Page chrome (sidebar, top-nav, bottom-player) sits on `--surface` (white) with a `--border` divider to the off-white `--bg` content area.

Buttons that float on white surfaces (e.g. theme-toggle, language pill) **must** carry a 1px `--border` border in addition to their background — without it they vanish in the light theme.

`<input>` fields in the top-nav use `--surface-highlight` (light grey) for their background and `--border` for the resting border so they remain distinguishable from the white header.

---

## 15. Hard "no" list (rules that must never be broken)

- ❌ No atomic-CSS class names (`flex-center`, `w-full`, `mb-16`, etc.). Every style ships as SCSS Modules.
- ❌ No `style={{ ... }}` props. Compute classes; let CSS own the visuals.
- ❌ No literal hex / rgb in `.module.scss`. Use a color token.
- ❌ No raw `px` for sizing. Use `functions.rem()`.
- ❌ No emoji in code (UI strings or otherwise). Use SVG icons.
- ❌ No "wow" animations on routine interactions. Hover/click/transition rules are listed above; do not invent your own.
- ❌ No proprietary fonts unless explicitly licensed (Spotify Circular is off-limits — use Manrope).
- ❌ No `!important` except to override third-party styles (Unfold admin), and even then, document why.

---

## 16. How this doc evolves

- Update this file in the same PR that adds a new component or token.
- If a token is added but never used after a phase ships, remove it.
- Conflicts between this doc and `frontend.md` / `requirements_ai.md` are resolved by raising a question, not by guessing — design tokens win for *visual* questions; `requirements_ai.md` wins for *architectural* questions.
