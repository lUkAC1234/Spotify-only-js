# Spotify — Project Documentation

## Project Overview

**Spotify** is a music-streaming web application — a Spotify-style player layered on top of a free, legally-redistributable catalog (Jamendo + Audius). It is a class-based React 19 + MobX SPA against a Django 5.2 + DRF + Postgres backend, with a Spotify-minimalism UI (dark theme, green accent, content-first layout).

**Phase 12 — UX polish (sidebar scroll, panels, forms, cover upload):**
- **Layout tokens** added: `--content-padding-x: rem(32)`, `--content-padding-y: rem(32)`, `--content-padding-x-mobile: rem(16)` in `_layout-tokens.scss`. Applied across page-level paddings (artist, album, playlist, user, search, library, settings, legal, section-row, greeting, all hero/header sections) so every page now starts content on the same vertical line — Spotify-style consistency.
- **Sidebar** now scrolls as one container (entire sidebar is the scroll element). Removed inner `__body` `overflow-y: auto` block — brand, header, body, footer all share a single thin styled scrollbar. Brand logo block hardened: `display: flex` (not inline-flex), explicit `min-width: 0` + `text-overflow: ellipsis` so the green Spotify badge always renders fully.
- **Friends activity panel rebuilt as floating drawer** anchored below top-nav (`top: var(--topnav-height)`) and above bottom-player (`bottom: calc(var(--player-height) + var(--shell-gap))`). Lives at `--z-top` (10) so it never sits under the topnav. Triggered by a circular friends button in top-nav (only when authenticated) via the new `FriendsPanelService` (`@injectable`, MobX `isOpen` + `toggle/open/close`). Removed from grid entirely — main content now occupies full width at every breakpoint.
- **Carousel polish**: removed wheel-scroll handler entirely (vertical mouse-wheel no longer hijacks horizontal scroll — scrolls page as expected). Drag stays via Pointer Events + RAF momentum (Phase 11 work preserved).
- **Internal legal pages**: 6 footer links (`/legal /safety /privacy /cookies /ads /accessibility`) now lead to in-app pages rendered by a single `<LegalPage>` component with named exports (Legal/Safety/Privacy/Cookies/Ads/Accessibility) and three-paragraph i18n content per language. `legal-links.ts` switched from external `https://www.spotify.com/...` URLs to internal `to: "/<slug>"` paths; `<SidebarFooter>` uses `<NavLink>`. Removed `target="_blank"` and the `SPOTIFY_EXTERNAL` constants.
- **Top-nav simplified**: removed Premium / Справка / Скачать text-link cluster + "Установить приложение" pill (those routes don't exist yet). Logged-out right cluster is now just `Зарегистрироваться` (text) + `Войти` (white pill CTA). Brand badge moved out of top-nav into the sidebar (Spotify-faithful — sidebar carries the brand). Top-nav left side is just the circular Home button.
- **Auth pages redesigned**: new `AuthLayout` with `aurora-gradient` triple-radial backdrop (green/blue/magenta) + 4% noise overlay + larger centered card (480px max, radius-lg, surface bg, border, elevation-2, backdrop-blur 20). Footer with `© Spotify` + `/privacy` + `/cookies` + `/legal` inline links. Login + register pages got large Spotify-badge atop the form, display-size title (`С возвращением` / `Зарегистрируйтесь, чтобы начать слушать`), accent-bordered error toasts, `<hr>` rule + bottom switch link.
- **Scroll restoration on route change**: shell-layout's main element now uses a `useRef<HTMLElement>` + `useEffect([location.pathname, location.search])` to call `mainRef.current.scrollTo({ top: 0, behavior: "auto" })` and `window.scrollTo(0, 0)` on every navigation — pages always open at top regardless of previous scroll position.
- **Shell layout** repackaged: outer `--bg` (black) is the page background; sidebar + main + rail (≥1280px disabled in Phase 12) are `--surface` rounded cards with `--shell-gap` between them. Sidebar widened from 240→280px; topnav grid row pulled into the upper full-width row so it sits above sidebar+main. Bottom-player anchored on the page-bg.
- **Polished `CreatePlaylistModal`** with cover upload + edit mode:
  - Two-column layout (cover-upload square 180px on left, fields on right) collapsing to single-column on ≤640px.
  - Cover upload: clickable square with hover overlay (camera icon + "Выбрать фото"), `<input type="file" accept="image/*">`, 5 MB client-side guard, blob preview via `URL.createObjectURL`/`revokeObjectURL` cleanup.
  - Inputs got icon prefixes (`SVG_MusicNote` for title, `SVG_Pencil` for description), focus ring transitions to `var(--text)` border, hover background bump to `--surface-elevated`.
  - Modal supports both create AND edit modes via the same `CreatePlaylistModalService` (added `editing: EditingTarget | null` + `openEdit(playlist, onSaved?)` + `notifySaved(id)` callback). On edit, fields prefill from the playlist; submit sends PATCH + (optional) cover upload.
  - Animated panel-pop entrance via `--motion-base` ease-out (`opacity: 0 → 1`, `scale: 0.96 → 1`).
- **Backend Playlist cover upload**:
  - New `cover_image = ImageField(upload_to="playlist-covers/uploads/", null=True, blank=True)` on `library_playlist`. Migration `0004_playlist_cover_image`.
  - `Playlist.effective_cover` now prefers `cover_image.url` over `cover_mosaic` over upstream `cover` URL.
  - New `PlaylistCoverView` at `/api/v1/playlists/<id>/cover/` (POST multipart with `cover` field; DELETE removes). Owner-only, 5 MB cap, `image/*` content-type guard, returns `PlaylistDetailSerializer` data.
  - Pillow installed in dev `myenv` (already in `requirements/base.txt`).
- **Playlist page wiring**: removed inline edit-form on `<PlaylistHeader>`; edit pencil icon and title-click now open the `CreatePlaylistModalService` in edit mode. Cover hover shows "Изменить обложку" overlay. Playlist play button became a 56×56 circle (matches artist hero). After modal save the playlist detail reloads via the `onAfterSave(id)` callback chain.
- **Argon2 backend hash** fixed: `argon2-cffi==25.1.0` (+ pycparser, cffi, argon2-cffi-bindings) installed into `backend/myenv` so `Argon2PasswordHasher` no longer raises `ModuleNotFoundError` on login/register.
- **Build green**: `tsc --noEmit` 0 errors, `eslint --max-warnings 0` 0 errors, `vite build` ~6s, PWA precache 83 entries / ~944 KiB.

**Phase 11 — Spotify-fidelity 1:1 redesign:**
- **Top-nav rebuilt** to match open.spotify.com: circular green Spotify-badge brand link + circular Home button on the left; centered search pill with browse-grid icon on the right edge; right cluster shows Premium / Справка / Скачать text links → "Установить приложение" pill → "Зарегистрироваться" + "Войти" white CTA for guests, or `<ProfileMenu/>` for authed users. Back/forward buttons removed (faithful to Spotify Web Player). LangSelect + ThemeToggle relocated to sidebar footer. SVG additions: `svg-spotify-badge` (green circle + "S"), `svg-grid-browse`, `svg-more`, `svg-chevron-right`, plus 8 menu icons (`svg-radio`, `svg-album`, `svg-info`, `svg-share`, `svg-desktop`, `svg-plus-circle`, `svg-heart-plus`, `svg-download`) under `app/shared/ui/svg/menu/`.
- **Sidebar rebuilt**: removed brand + Home/Search/Library nav (now in top-nav); new "Моя медиатека" header with "+ Создать" pill; logged-out shows two stacked marketing cards (`SidebarGuestCards` — "Создай свой первый плейлист" + "Подпишись на интересные подкасты"); logged-in shows enhanced Liked-Songs row + scrollable user playlists; new `SidebarFooter` renders 6 legal links (target=_blank to canonical Spotify URLs from `app/shared/constants/legal-links.ts`) plus LangSelect + ThemeToggle.
- **Home page split** into two sub-components (`sections/home-auth/` + `sections/home-guest/`); thin `home.tsx` orchestrator picks variant based on `auth.isAuthenticated`. Logged-out shows "Популярные треки" + "Популярные исполнители" rows only (no greeting); logged-in keeps the existing 5-row layout. New `ArtistCard` component (circular avatar, name, "Исполнитель" overline, navigates to `/artist/:id`); `HomeService` now exposes `@computed get popularArtists` which dedupes `popular` tracks by `artistId`. `SectionRow` gained an optional `showAllHref` prop that renders a "Показать все" link in the header.
- **Marketing banner** (`app/shared/ui/marketing-banner/`) is a sticky-bottom-of-`main` `@observer` component that renders `null` for authed users and a hot-pink/blue gradient with "Предварительный просмотр Spotify" copy + "Зарегистрироваться" white pill CTA for guests. Wired into `shell-layout.tsx` after `<Outlet/>`.
- **Reusable Popover + Menu primitives** at `app/shared/ui/popover/`: portal-rendered `<Popover>` with viewport-flip placement (`bottom-start | bottom-end | top-start | top-end | right-start | left-start`), click-outside, Escape, focus-trap; semantic `<Menu role="menu">` with arrow-key navigation; `<MenuItem>` (label + optional icon + optional `href` for external links + disabled/danger variants); `<MenuSubmenu>` (right-arrow chevron, opens nested popover, propagates `closeAll` to child `MenuItem`s); `<MenuDivider>`. Tokens added: `--popover-bg`, `--popover-fg`, `--popover-divider`, `--popover-item-hover-bg`, `--popover-min-width`, `--popover-max-width`, `--popover-max-height`.
- **Artist hero refinements**: text-labelled "Слушать" play button replaced with circular green icon-only Play (56×56, hover scale 1.06); new "..." trigger renders `<ArtistContextMenu/>` with all 7 Spotify items: (1) "Добавить в плейлист" (submenu of user playlists + "Создать новый плейлист"), (2) "Добавить в любимые треки" (toggles `library.toggleTrackSaved` on the artist's top track, disabled if not auth or no top tracks), (3) "К радио по треку" (shuffles topTracks into queue + plays first), (4) "К альбому" (navigates to currently-playing track's album, disabled when not playing this artist), (5) "Посмотреть сведения" (opens `<ArtistAboutModal/>` — bio + country + genres + monthly listeners), (6) "Поделиться" (submenu: "Скопировать ссылку" via `navigator.clipboard` + AlertService toast + "Поделиться через систему" via Web Share API with clipboard fallback), (7) "Открыть в приложении для компьютера" (`<a href="spotify:artist:<id>">`).
- **New design tokens** in `colors.scss` (both themes): `--brand-green` (alias to `--accent`), `--popover-*` aliases, `--marketing-banner-gradient` (hot-pink → blue, slightly lighter in light theme), `--marketing-banner-fg` / `--marketing-banner-cta-bg` / `--marketing-banner-cta-fg`, `--topnav-pill-bg` / `--topnav-pill-bg-hover`, `--sidebar-card-bg` / `--sidebar-card-fg`. New layout tokens in `_layout-tokens.scss`: `--marketing-banner-height: rem(80)` / `--marketing-banner-height-mobile: rem(96)`, `--popover-min-width: rem(220)`, `--popover-max-width: rem(360)`, `--popover-max-height: rem(360)`, `--hero-play-size: rem(56)`, `--hero-action-size: rem(40)`.
- **i18n parity**: ru/en/uz `common.json` got new keys for `topnav.*` (premium, help, download, install-app, brand-aria, home-aria, browse-aria), `marketing.{title,subtitle,cta}`, `sidebar.library-title` + `sidebar.create-aria` + `sidebar.guest.{playlist,podcasts}.{title,sub,cta}` + `sidebar.footer.{legal,safety,privacy,cookies,ads,accessibility}`, `show-all`, `popular.{tracks,artists}`, `artist-menu.*` (10 keys), `artist-about.{title,monthly-listeners,country,genres,no-bio}`.
- **Build green**: `tsc --noEmit` 0 errors, `eslint --max-warnings 0` 0 errors, `vite build` 6.28s, PWA precache 79 entries / 910.80 KiB, en+ru+uz SEO HTML generated.

**Phase 10 wrap-up — observability + a11y/i18n parity:**
- `sentry-sdk[django]==2.20.0` is now a real dep in `backend/requirements/base.txt` (and installed into the local `myenv`); the conditional init in `config/settings/base.py` activates as soon as `SENTRY_DSN` is set.
- In-memory request metrics: new `apps.common.middleware.RequestMetricsMiddleware` records request count + latency into a thread-locked `deque(maxlen=2048)` ring buffer; `/api/v1/metrics/` (`MetricsView`, anonymous, throttle-exempt) returns `{total_requests, errors_4xx, errors_5xx, samples, latency_p50_ms, latency_p95_ms, latency_p99_ms, latency_max_ms}` JSON. The middleware excludes itself (`/api/v1/metrics`, `/static/`, `/media/`) so the metrics call never poisons its own samples.
- a11y audit clean: React Router's `NavLink` auto-applies `aria-current="page"` (preserved through the custom wrapper); `prefers-reduced-motion` zeroes `--motion-fast/--motion-base/--motion-slow` tokens globally; `:focus-visible` rings are wired across 20 component modules.
- i18n parity: the last 7 hard-coded `aria-label`s (sidebar landmark, library tabs nav, discography filters, friends-rail, bottom-player, queue-panel "now playing", shell drawer backdrop) now resolve through `LocaleService.t(...)` with new keys (`nav.primary`, `nav.close-menu`, `library.tabs-aria`, `artist.discography-filters`, `player.aria-label`) added to en/ru/uz.
- Build green: `tsc --noEmit` 0 errors, `vite build` 6.13s (PWA precache 79 entries / 862 KiB, en+ru+uz SEO HTML generated), `manage.py check` 0 issues.

**Phase 10 mobile + observability shipping:**
- Mobile sidebar drawer: at ≤640px the sidebar is `position: fixed` translateX(-100%) by default and slides in via `transform: translateX(0)` when `LayoutService.sidebarIsActive` flips. A new hamburger button in the top-nav (visible only on mobile, same 36×36 circle styling as the other top-nav controls) toggles the drawer. A blurred `--overlay` backdrop (`button` element so it's keyboard-actionable) closes it on tap or `Escape`. The drawer auto-closes on every route change via a `useEffect([location.pathname])` in `ShellLayoutWithLocation`. Body-scroll lock via `LayoutService` reaction toggling the `hide-scrollbar` class.
- Mobile compact bottom-player: at ≤640px the player drops the seek bar, volume slider, queue/devices buttons, and shuffle/prev/next/repeat — leaves only cover + title/artist + heart on the left and the green play button on the right. Play button shrinks to `--control-md` to fit the 64px-tall bar.
- Sentry stub for both runtimes:
  - Backend: `config/settings/base.py` reads `SENTRY_DSN`, `SENTRY_ENVIRONMENT`, `SENTRY_TRACES_SAMPLE_RATE` from env and conditionally `sentry_sdk.init(...)` with `DjangoIntegration` if both DSN is set and the SDK is installed (`try: import sentry_sdk` so missing dep is no-op).
  - Frontend: `core/observability/sentry.ts` reads `VITE_SENTRY_DSN` / `VITE_SENTRY_ENVIRONMENT` / `VITE_APP_VERSION` and calls `window.Sentry.init(...)` if a Sentry script is loaded, else logs a one-line warning. Wired into `main.tsx` before `bootstrap()`.

**Phase 10 partial ship — security, PWA, deploy artefacts, carousel UX:**
- Reusable `<Carousel>` component (`shared/ui/carousel/`) wraps any horizontal `<ul>`-style row with: hidden native scrollbar, mouse drag-to-scroll (6px threshold; suppresses click after a real drag), Shift+wheel for horizontal scroll, smooth Prev/Next nav buttons that fade in only when scroll is possible AND the row is hovered (desktop only — hidden on ≤720px). Adopted in `home.SectionRow`, `artist.RelatedArtists`, `album.RelatedAlbums`, `search.ArtistGrid`, `search.AlbumGrid`. The native scrollbar is fully hidden via `scrollbar-width: none` + `::-webkit-scrollbar { display: none }` so the rows render edge-to-edge.
- Theme-toggle rebuilt as a native `<button>` (no `Button` wrapper, no `<span class="button__text">` inside), the two SVG icons now stack via CSS Grid (`place-items: center`) so the sun/moon are pixel-perfect centred; rotation/scale animation runs on `transform`+`opacity` only.
- `Argon2PasswordHasher` is now the primary password hasher (`argon2-cffi` added to `requirements/base.txt`); legacy hashers stay as fallbacks for old hashes.
- `apps.common.middleware.RequestIdMiddleware` mints an `X-Request-Id` for every inbound request (or echoes the client-supplied one); response carries the same id so logs and clients share a correlation key.
- `apps.common.middleware.MeCacheControlMiddleware` forces `Cache-Control: private, no-store, max-age=0, must-revalidate` on every `/api/v1/me/*`, `/api/v1/auth/me*`, `/api/v1/library/*`, `/api/v1/playback/state/`, `/api/v1/playlists/me/` response — user-scoped data never lands in shared caches.
- `config/settings/prod.py` hardened: `SECURE_HSTS_SECONDS = 31_536_000` + subdomains + preload, `SECURE_SSL_REDIRECT`, `SECURE_BROWSER_XSS_FILTER`, `SECURE_REFERRER_POLICY`, `SECURE_PROXY_SSL_HEADER`, `X_FRAME_OPTIONS = "DENY"`, `USE_X_FORWARDED_HOST = True`.
- Frontend PWA enabled (`vite-plugin-pwa` configured): generated SW (`dist/sw.js` + `workbox-*.js`) precaches 79 shell assets (~858 KiB), `NetworkOnly` for `/api/v1/stream/*` and every `/me/*` route (audio + private data never cache), `NetworkFirst` (4s timeout) for the rest of `/api/v1/*` with 30 min TTL, `CacheFirst` for cover images from `usercontent.jamendo.com` and `audius.co` with 7-day TTL. Manifest declares "Spotify" as standalone PWA with `theme_color: #121212`.
- Production deploy stack ships:
  - `backend/Dockerfile` (multi-stage Python 3.13-slim, non-root `django` user, gunicorn 3 workers × 2 threads, `/api/v1/health/` HEALTHCHECK)
  - `frontend/Dockerfile.prod` (multi-stage Node 22-alpine builder → nginx 1.27-alpine runtime)
  - `docker-compose.prod.yml` orchestrates Postgres 17 + Django + nginx + Caddy 2 reverse proxy with auto-HTTPS, named volumes for `postgres-data` / `backend-static` / `backend-media` / `caddy-data`, healthchecks
  - `Caddyfile` routes `/api/*` and `/admin/*` to `backend:8000`, `/static/*` and `/media/*` to mounted volumes with long-lived `Cache-Control`, falls through to `frontend:80`; sets HSTS-friendly headers (`X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy: same-origin`, hides `Server`)
  - `.env.example` template + a hardening checklist + step-by-step deploy section in [`README.md`](./README.md)

**Latest polish pass (post-Phase 9, after the design fixes below):**
- Top-nav controls (lang switcher, theme toggle, profile menu) unified to a single visual system: 36px height (`--control-md`), `var(--surface-elevated)` background, `var(--border)` border, `--border-strong` on hover/open, `--accent` focus ring. Theme toggle and lang switcher are now identical 36×36 circles; profile menu is a pill with the same height showing 28×28 accent-coloured avatar + name + chevron (chevron rotates 180° when open).
- Lang switcher rebuilt: stripped the heavy `Button` wrapper, dropped the `mini` prop, replaced the unused `lang-select-bg` overlay div, and ditched the green-bordered `SVG_Check` icon for a clean 2-stroke check mark in `var(--accent)`. Trigger now shows a clean 2-letter code (`EN` / `RU` / `UZ`) instead of a 3-char slice + chevron.
- All three dropdowns (lang + profile) now share the same panel style: `var(--surface-elevated)` + `var(--border)` border + `--elevation-2`, `top: calc(100% + var(--space-2))`, `min-width: 200/220px`, `translateY(-4)→0` enter, `--z-popover` z-index. Active option in lang dropdown coloured `var(--accent)` with check icon; "Sign out" item in profile menu coloured `var(--danger)` with a 1px `--border` divider above it.
- Search pagination ships: backend `/catalog/search/` now returns `{ tracks, artists, albums, totalTracks, hasMore, limit, offset }`; track-only requests with `offset > 0` don't re-trigger the artist/album branch or the upstream-fallback (those load only once on `offset=0`). Frontend `CatalogService.loadMoreSearchTracks()` issues `offset=lastResult.tracks.length`, dedupes by track id, appends, and updates `searchHasMore` / `searchTotalTracks`. Search Results page got a new "All songs ({count})" section below the artist + album grids that lists tracks beyond the top-5 preview, with a Spotify-style outlined `LoadMoreButton` (shared `frontend/src/app/shared/ui/load-more-button/`) that disables itself while loading (`aria-busy`, "Loading…" label).
- Locale parity for the new strings (`common.load-more`, `common.loading-more`, `search.all-songs`, `lang.aria-label`) across en/ru/uz.

**Earlier design fixes (post-Phase 9):**
- Removed a global `* { @extend .scrollbar }` rule (in `_global.scss`) that was applying `overflow: auto` to every element on the page, producing phantom scrollbars in headings, hover states, list rows, and dropdown chevrons.
- Light-theme palette retuned: `--bg` darkened to `#F4F4F4` while `--surface` stays `#FFFFFF`, so the sidebar / top-nav / bottom-player visibly lift off the content area. Cards still use `--surface-elevated` (`#FFFFFF`) but rely on `--elevation-1` shadow for separation. `--border` strengthened to `rgba(0,0,0,0.10)` for visible dividers, and a new `--border-strong` token covers focus rings.
- Theme-toggle button: removed the hard-coded `rgba(255,255,255,0.1)` background and `#ffffff` color (which made it invisible on the white light-theme header). Now uses `var(--surface-elevated)` + `var(--border)` border + `var(--text)` icon, plus a focus ring on `--accent`.
- Top-nav controls (history arrows, language pill, theme toggle, search input) now carry explicit `var(--border)` borders so they're visible against the white `--surface` topnav in light mode.
- Top-nav z-index promoted to `var(--z-popover)` (7) and given `position: relative`; language and profile dropdowns now anchor with `top: calc(100% + var(--space-2))` and `z-index: var(--z-popover)` instead of hard-coded `top: 56px`. Dropdowns no longer get clipped or stuck inside the header bar.
- `requirements_ai.md` gained three new rules: never apply `overflow` globally, light-theme controls need explicit borders, dropdowns escape header chrome via `--z-popover` + `position: relative` ancestors.

**Status:** Phases 1–10 complete (only optional follow-ups left: Lighthouse audit pass + native iOS/Android wrappers). Catalog models migrated, Jamendo + Audius `Provider` clients live, `/api/v1/catalog/*` and `/api/v1/stream/<id>/` (HTTP Range) endpoints serve real audio. Real session-based auth + DRF throttling. Player engine (Phase 4) is a full MobX state machine. Phase 5 ships discovery. Phase 6 ships search (Postgres FTS + recent-searches). Phase 7 ships library (saved-tracks/albums/artists, full playlist CRUD + collaborators, Pillow mosaic covers, `/library` page, `/playlist/<id>` page, heart toggle, create-playlist modal, sidebar playlists). Phase 8 ships catalog navigation (`/artist/:id` with hero+follow+Popular+Discography+Fans-also-like, `/album/:id` with hero+save+tracklist+related). Phase 9 ships social: User privacy fields (`is_profile_public`, `is_listening_public`, `is_recent_history_public`); `social_user_follow` model with self-follow check constraint; `/api/v1/users/<id>/{,playlists,follow,followers,following}/`; `/api/v1/me/{feed,friends-activity,privacy,recap}/`; recap endpoint computes top-10 tracks/artists + top-5 genres for any year via `PlayEvent` aggregation; frontend `SocialService` polls `/me/friends-activity/` every 30s; `/user/:id` public profile page (avatar hero, bio, followers/following counts, follow toggle, public playlists grid); right-rail `FriendsRail` (desktop ≥1280px, shows live now-playing of followed users with public listening); profile dropdown in top-nav (Account → `/user/me`, Privacy → settings, Sign out); Privacy section in Settings with three toggles. Phase 10 (polish + deploy) still pending.

**Current home page:** Spotify-style Shell with time-based greeting and live data-driven sections — Recently played (auth only), Made for you (Daily Mix or popular fallback), New releases, Featured playlists, Trending right now. Track and playlist cards wire into the player; clicking a featured playlist hydrates the queue from `/catalog/playlist/<id>/`.

**Operator setup needed for streaming:** the dev `.env` ships with `JAMENDO_CLIENT_ID=eb2fcdef` (Enzora's app). Replace with your own at <https://devportal.jamendo.com/> for production.

**Seeding the featured playlists** (Phase 5) — once Postgres is up and migrations applied, run `python manage.py seed_featured_playlists` from `backend/`. This creates a disabled `system` user, calls Jamendo `/tracks/?tags=…` for each curated tag (pop, chillout, electronic, rock, acoustic, hiphop), upserts the tracks into `catalog_track`, and rebuilds the corresponding `library_playlist` rows. Pass `--tag rock --limit 6` to seed a single playlist.

**Refreshing search vectors** (Phase 6) — Postgres FTS on `catalog_track.search_vector` is rebuilt automatically on every `CatalogSyncService.upsert_*` call (artist/album changes propagate to all child tracks). For one-shot backfill of an existing catalog (or after a manual edit in admin), run `python manage.py rebuild_search_vectors`.

**Playlist mosaic covers** (Phase 7) — when tracks are added or removed from a non-system playlist, `apps.library.covers.regenerate_playlist_mosaic(playlist)` fetches the first four unique track covers, builds a 600×600 WebP via Pillow, writes it to `MEDIA_ROOT/playlist-covers/<id>.webp`, and stores the relative URL on `playlist.cover_mosaic`. The library serializer prefers the mosaic over the fallback cover URL. System playlists (the curated featured ones) keep their upstream Jamendo cover; mosaics are skipped for them.

**Dev networking:** Vite proxies `/api/*` and `/media/*` to the Django backend (default `http://127.0.0.1:8000`), so the SPA and the API share the same origin (`localhost:5173`). This means the `csrftoken` cookie set by `/api/v1/auth/csrf/` is readable by the frontend's `document.cookie`, sessions just work, and there are no CORS / cross-origin cookie issues. The dev settings (`config/settings/dev.py`) also accept any localhost port via `CORS_ALLOWED_ORIGIN_REGEXES` for direct (non-proxied) calls.

### What we are *not* doing

- We are **not** serving Spotify's licensed catalog. There is no legal way to do so. Mainstream pop / hip-hop catalogs are unavailable. (See [`plan.md` § 1](./plan.md) for the full music-source decision.)
- We are **not** storing audio bytes in Postgres. Postgres holds metadata only. Audio streams from the upstream provider through a backend range-proxy at `/api/v1/stream/<track_id>`.

### Architecture summary

```
Browser ── /api/v1/* ──► Django+DRF ──► Postgres (metadata only)
                              │
                              └─ stream proxy ──► Jamendo / Audius (audio bytes)
```

The frontend is a strict-typed, class-based SPA with MobX state management, custom dependency injection, SCSS Modules, multi-language support (en / ru / uz), light/dark theme switching, lazy-loaded routes, and a robust error boundary. The backend is Django + DRF + Unfold-admin with `django-parler` model translations, a generic image-compression utility, and PostgreSQL.

---

## Tech Stack

### Frontend (`frontend/`)

| Library | Version | Purpose |
|---|---|---|
| React | 19.2 | UI library |
| React DOM | 19.2 | DOM renderer |
| TypeScript | 5.9 | Type-safe JS (decorators enabled, strict-ish) |
| Vite | 7.1 | Build tool |
| @vitejs/plugin-react-swc | 4.2 | SWC compiler for React/decorators |
| MobX | 6.13 | Reactive state (class-based, `makeObservable`) |
| mobx-react | 9.2 | React bindings (`@observer`) |
| React Router | 7.13 | Client-side routing |
| Framer Motion | 12.30 | Animations |
| @tanstack/react-query | 5.90 | Server state |
| sass | 1.85 | SCSS preprocessor |
| swiper | 12.1 | Carousel/slider component |
| lodash | 4.17 | Utility functions |
| @fontsource/manrope | 5.2 | Manrope webfont |
| ESLint | 10 | Linting |
| Prettier | 3.6 | Formatting |
| @vite-pwa/assets-generator | 1.0 | PWA assets |
| vite-plugin-pwa | 1.2 | PWA plugin |
| vite-plugin-image-optimizer | 2.0 | Build-time image optimization |
| sharp / sharp-ico | 0.34 / 0.1 | Image processing |
| svgo | 4.0 | SVG optimization |

### Backend (`backend/`)

| Library | Version | Purpose |
|---|---|---|
| Django | 5.2.7 | Web framework |
| Django REST Framework | 3.16.1 | REST API toolkit |
| django-cors-headers | 4.7 | CORS handling |
| django-unfold | 0.89 | Modern admin theme |
| django-parler | 2.3 | Multilingual model translations |
| django-parler-rest | 2.2 | DRF integration for parler |
| django-import-export | 4.3.9 | Bulk import/export from admin |
| Pillow | 11.3 | Image library |
| pillow-heif | 1.1 | HEIF image support |
| psycopg2-binary | 2.9.11 | PostgreSQL driver |
| python-dotenv | 1.1.1 | `.env` loader |
| httpx | 0.28.1 | Async-friendly HTTP client |
| gunicorn | 23.0 | Production WSGI server |
| asgiref | 3.10 | ASGI/WSGI utilities |
| sqlparse | 0.5.3 | SQL formatting |
| tzdata | 2025.2 | Timezone data |

### Database

PostgreSQL (DB name: `spotify`, user: `postgres`).

---

## Architecture & Patterns

### Frontend

- **Feature-based modules** under `src/app/features/` — each feature is self-contained (`<page>.tsx`, `<page>.module.scss`, `<page>.routes.ts`, optional `<page>.service.ts` and `sections/` subfolder).
- **Class-based components** decorated with `@observer` (mobx-react) for reactive rendering.
- **MobX services** — every stateful service is a class decorated with `@injectable()`, with `makeObservable(this)` in the constructor and `@observable accessor`, `@computed`, `@action`, `flow` from MobX.
- **Custom DI** — `@injectable({ provideIn: "root" | "local" })` plus `inject(ServiceClass)` from `@/app/shared/decorators/di`. `dispose(ServiceClass)` / `disposeAll()` clean up instances.
- **SCSS Modules** — every component file pairs with `<name>.module.scss`. All sizing uses `functions.rem(...)` from `@/assets/styles/helpers/functions`.
- **Kebab-case** file and folder names everywhere.
- **Path alias** — `@/` maps to `frontend/src/`.
- **i18n** — single namespaced system. Translations live in `src/locale/<lang>/<namespace>.json`. The `LocaleService` lazy-loads each namespace per language on first use via Vite `import.meta.glob`.
- **Lazy routes** — every page is wrapped by the `lazyLoaded` HOC in `src/app/shared/hocs/lazy-loaded.tsx`, which `Suspense`-wraps a code-split chunk.
- **App bootstrap** — `bootstrap()` in `src/app/shared/utils/classes/ReactApp.ts` orchestrates plugin registration (HistoryPlugin, FocusPlugin) and renders into `#app`.

### Backend

- Standard Django project layout: `config/` (settings, urls, asgi, wsgi) + `web/` app.
- DRF for the API layer (currently empty); no models or endpoints are defined — ready for new domain models.
- `django-parler` is wired in `LANGUAGES` and `PARLER_LANGUAGES` for translatable fields on future models.
- Unfold is the admin theme; `assets/css/admin-custom.css` provides minimal admin form styling.
- `web/utils/image_processing.py` exposes `compress_image_to_webp(image_field, max_size=1920, quality=82)` — a reusable pre-save hook for any `ImageField`.

---

## Directory Structure

```
Spotify-only-js/
├── project.md                        # this document
├── frontend.md                       # design rules
├── requirements_ai.md                # AI/architectural rules
├── README.md                         # repo readme
├── frontend/                         # React 19 SPA
│   ├── src/
│   │   ├── app/
│   │   │   ├── app.tsx               # Root component (Middlewares + Portals + AlertRoot + Outlet)
│   │   │   ├── app.service.ts        # App-level service
│   │   │   ├── app.routes.ts         # Route configuration
│   │   │   ├── app.config.ts         # App constants
│   │   │   ├── core/
│   │   │   │   ├── constants/        # animation-variants.ts
│   │   │   │   ├── interceptors/
│   │   │   │   ├── middlewares/      # language / location / navigate
│   │   │   │   ├── providers/        # router / portals / modals / middlewares
│   │   │   │   └── services/         # api, locale, locale-utils, navigate, location, scroll, breakpoints, connection, disposable-stack, nav-link
│   │   │   │       ├── browser/      # title.service, window.service
│   │   │   │       ├── http/         # http, http-queue, http-xhr
│   │   │   │       └── ui/           # theme, modal, modals, layout
│   │   │   ├── features/
│   │   │   │   ├── home/             # Hello World page (single home.tsx + .module.scss + .routes.ts)
│   │   │   │   └── 404/              # Not-found page
│   │   │   └── shared/
│   │   │       ├── decorators/       # di.ts, static.ts
│   │   │       ├── hocs/             # lazy-loaded
│   │   │       ├── types/            # css.d.ts, json.d.ts, react-types.d.ts, utils.d.ts
│   │   │       ├── ui/               # buttons, inputs, phone-input, modal, alerts, error, layout, link, loaders, locales, lang, optimized-media, internet-state, svg
│   │   │       └── utils/
│   │   │           ├── classes/      # ReactApp, ReactPlugin, HistoryModule, FocusPlugin
│   │   │           └── functions/    # className, debounce, lazy, logger, interceptors, get-value-by-path, nav-links, normalized-path, uniqueIdGenerator, disableReactDevTools
│   │   ├── assets/
│   │   │   ├── fonts/                # lora/, manrope/
│   │   │   └── styles/               # base, helpers, variables, animations, components, colors.scss, main.scss, style.scss
│   │   ├── locale/                   # all i18n lives here: en/, ru/, uz/ (alert, common, error-boundary, error404, fancybox, time), _utils/ (langs.json, loading.json), _docs/, translations.d.ts
│   │   ├── main.tsx                  # entry point
│   │   └── vite-env.d.ts
│   ├── public/                       # favicon.svg, robots.txt, sitemap.xml
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig.app.json / tsconfig.node.json / tsconfig.json
│   ├── eslint.config.js
│   ├── .prettierrc.json
│   ├── generate-i18n-html.js         # post-build SEO HTML generator
│   ├── pwa-assets.config.ts
│   ├── nginx.conf
│   ├── Dockerfile
│   └── package.json
└── backend/                          # Django 5.2 + DRF, domain-split
    ├── manage.py                     # DJANGO_SETTINGS_MODULE=config.settings.dev
    ├── .env                          # SECRET_KEY, DEBUG, ALLOWED_HOSTS, DB creds
    ├── requirements/
    │   ├── base.txt                  # Django, DRF, parler, unfold, …
    │   ├── dev.txt                   # -r base.txt
    │   └── prod.txt                  # -r base.txt + gunicorn
    ├── config/
    │   ├── __init__.py
    │   ├── settings/
    │   │   ├── __init__.py
    │   │   ├── base.py               # shared config
    │   │   ├── dev.py                # DEBUG=True, ALLOWED_HOSTS=*
    │   │   └── prod.py               # HSTS, SECURE_SSL_REDIRECT, etc.
    │   ├── urls.py                   # mounts per-app api urls under /api/v1/
    │   ├── asgi.py                   # → config.settings.prod
    │   └── wsgi.py                   # → config.settings.prod
    ├── apps/
    │   ├── __init__.py
    │   ├── common/                   # shared utilities, no domain
    │   │   ├── apps.py               # registers pillow_heif on ready()
    │   │   ├── images.py             # compress_image_to_webp helper
    │   │   ├── pagination.py / permissions.py / exceptions.py / validators.py
    │   │   └── tests/
    │   ├── accounts/                 # User + auth flows
    │   │   ├── apps.py / models.py / managers.py / admin.py (CustomGroupAdmin)
    │   │   ├── services.py / selectors.py
    │   │   ├── api/                  # views.py / serializers.py / urls.py (app_name=accounts)
    │   │   ├── migrations/
    │   │   └── tests/
    │   ├── catalog/                  # artists, albums, tracks, genres + FTS
    │   │   ├── apps.py / models.py (Track.search_vector) / admin.py
    │   │   ├── services.py / selectors.py
    │   │   ├── providers/            # base.py, jamendo.py, audius.py
    │   │   ├── management/commands/rebuild_search_vectors.py
    │   │   ├── api/                  # urls.py (app_name=catalog)
    │   │   ├── migrations/
    │   │   └── tests/
    │   ├── playback/                 # streaming proxy + state
    │   │   ├── apps.py / models.py / admin.py
    │   │   ├── services.py / selectors.py
    │   │   ├── api/                  # urls.py (app_name=playback)
    │   │   ├── migrations/
    │   │   └── tests/
    │   ├── library/                  # saved-*, history, playlists, recent searches, collaborators
    │   │   ├── apps.py / models.py (Playlist, PlaylistItem, PlaylistCollaborator, SavedTrack, SavedAlbum, FollowedArtist, RecentSearch)
    │   │   ├── covers.py (Pillow 2x2 mosaic generator)
    │   │   ├── services.py (system user + playlist CRUD + save/follow + recent-search) / selectors.py
    │   │   ├── management/commands/seed_featured_playlists.py
    │   │   ├── api/                  # views.py + serializers.py + urls.py (app_name=library)
    │   │   ├── migrations/
    │   │   └── tests/
    │   └── social/                   # follows, feed, friends-activity, recap
    │       ├── apps.py / models.py (UserFollow with self-follow CHECK constraint) / admin.py
    │       ├── services.py (follow_user / unfollow_user / update_privacy)
    │       ├── selectors.py (get_public_user, friends_listening, feed_for, yearly_recap)
    │       ├── api/                  # views.py + serializers.py + urls.py (app_name=social)
    │       ├── migrations/
    │       └── tests/
    ├── assets/
    │   └── css/admin-custom.css      # neutral Unfold form styling
    └── myenv/                        # local virtualenv (gitignored)
```

---

## Core Frontend Services

Located in `src/app/core/services/`:

| Service | File | Purpose |
|---|---|---|
| ApiService | `api.service.ts` | Base API client built on top of HttpService |
| HttpService | `http/http.service.ts` | Main HTTP client with interceptors |
| HttpQueue | `http/http-queue.service.ts` | Tracks active requests for the LoadingLine |
| HttpXhr | `http/http-xhr.service.ts` | XHR fallback |
| LocaleService | `locale.service.ts` | Namespace-based i18n loader (lazy `import.meta.glob`), interpolation, fallbacks, caching |
| NavigateService | `navigate.service.ts` | Programmatic navigation API |
| LocationService | `location.service.ts` | Reactive URL location state |
| ScrollService | `scroll.service.ts` | Scroll position/lock |
| BreakpointsService | `breakpoints.service.ts` | Reactive viewport breakpoints |
| ConnectionService | `connection.service.ts` | Online/offline state |
| DisposableStackService | `disposable-stack.service.ts` | Centralized resource cleanup |
| NavLinkService | `nav-link.service.ts` | NavLink helper |
| TitleService | `browser/title.service.ts` | `<title>` and translated titles |
| WindowService | `browser/window.service.ts` | Window resize / dimensions |
| ThemeService | `ui/theme.service.ts` | Light / dark theme switching |
| ModalService / ModalsService | `ui/modal.service.ts`, `ui/modals.service.ts` | Single + stacked modal control |
| LayoutService | `ui/layout.service.ts` | Layout / mobile-vs-desktop state |

---

## Shared UI Inventory

Located in `src/app/shared/ui/`:

```
alerts/          — toast/alert system (alert, alerts, alert-message)
buttons/         — button, close-button, theme-toggle-btn
inputs/          — input, textarea, phone-input/ (country dropdown + format)
modal/           — modal dialog
error/           — error-boundary, route-error-boundary, error-boundary.service
layout/          — layouts.tsx, landing-layout, error-layout, app-outlet
link/            — nav-link, navigate, wrappers
loaders/         — loading-line (HTTP queue progress bar)
optimized-media/ — image/video optimization wrapper
internet-state/  — connection status indicator
lang/            — lang-select dropdown
locales/         — translate component
svg/             — generic SVG icons (arrow-down, check, close-icon, wifi-slash, wifi-stable)
```

---

## i18n / Internationalization

All translations live under `src/locale/<lang>/<namespace>.json`. Each `<namespace>.json` is a small lazy-loaded module — `LocaleService` resolves the right file via `import.meta.glob` on first use of `t(namespace, path, vars?)` or `dict(namespace)`, and caches results per `lang+namespace`.

**Current namespaces:** `alert`, `common`, `error-boundary`, `error404`, `fancybox`, `time`. Add a new namespace by dropping `<name>.json` into each `src/locale/<lang>/` folder and adding it to `src/locale/translations.d.ts` for type-safe `t(...)` calls.

**Non-translation locale config** (configuration data, not translations) lives in `src/locale/_utils/`:
- `langs.json` — language picker config (id / display label / flag)
- `loading.json` — fallback "loading…" string per language

**Supported languages:** English (`en`), Russian (`ru`), Uzbek (`uz`). Default language is configured via `VITE_DEFAULT_LANG` in `frontend/.env` (currently `ru`).

The backend mirrors this with `LANGUAGES` and `PARLER_LANGUAGES` in `config/settings.py` (default `en`).

### Usage

```tsx
@observer
class App extends Component {
    locale: LocaleService = inject(LocaleService);

    render() {
        return <span>{this.locale.t("common", "page-title")}</span>;
    }
}
```

---

## Theming

Light/dark theme is driven by `data-theme` on `<html>` (toggled via `ThemeService`) plus a `prefers-color-scheme` fallback. CSS variables are defined in `src/assets/styles/colors.scss`:

- `--bg`, `--container-bg`, `--text-color`, `--text-color-secondary`, `--border-color`, `--input-bg`, `--secondary-color`, `--accent-color`, `--accent-color-opacity`, `--hover-color`, `--hr-border-color`
- `--black`, `--white`, `--red`
- `--linear-background`

The `.theme-transition` class on `<html>` applies a smooth 300ms transition across color/background/border/shadow/fill on every element while the theme switches.

---

## Build & Run

### Frontend

```bash
cd frontend
npm install
npm run dev          # development server (http://localhost:5173)
npm run build        # production build (tsc + vite build + SEO HTML generation)
npm run preview      # serve the production build
npm run lint         # ESLint
npm run format       # Prettier
```

### Backend

```bash
cd backend
python -m venv myenv                          # one-time setup
./myenv/Scripts/activate                      # Windows (or `source myenv/bin/activate`)
pip install -r requirements/dev.txt           # dev: -r base.txt
python manage.py migrate                      # uses config.settings.dev by default
python manage.py createsuperuser
python manage.py runserver                    # http://127.0.0.1:8000

# Production:
# pip install -r requirements/prod.txt
# DJANGO_SETTINGS_MODULE=config.settings.prod gunicorn config.wsgi:application
```

Admin panel: <http://127.0.0.1:8000/admin/> (titled "Spotify Admin", powered by Unfold).

---

## Roadmap

Implementation is sequenced into 10 phases. The full plan — music-source strategy, database schema, API surface, frontend structure, per-phase deliverables and acceptance criteria, risks, and open questions — lives in [`plan.md`](./plan.md).

| Phase | Goal |
|---|---|
| 1 ✅ | Foundations — env, settings split, DRF auth scaffolding, `Provider` abstraction, Shell layout, design tokens |
| 2 ✅ | Music ingestion + streaming proxy — catalog models, `CatalogSyncService`, search/track/album/artist endpoints, HTTP Range stream proxy, frontend `<audio>` engine, search page |
| 3 ✅ | Auth, profile, settings — register / login / logout / me, avatar upload + change-password, throttling, frontend AuthService + `<Login>` / `<Register>` / `<Settings>` pages, AuthLayout |
| 4 ✅ | Player engine + queue — keyboard shortcuts, MediaSession (OS lockscreen), QueuePanel (drag-reorder), playback-state sync (resume on reload), play-event logging |
| 5 ✅ | Home & discovery — recently played, made-for-you, new releases, featured playlists, trending; minimal Playlist + PlaylistItem models, `seed_featured_playlists` command, generic Section row + Track / Playlist cards |
| 6 ✅ | Search — Postgres FTS on `catalog_track.search_vector` (GIN), provider-fallback for weak matches, per-user `library_recent_search` LRU, debounced UI, categorized Top result + Songs + Artists + Albums with substring highlight |
| 7 ✅ | Library + playlists — Saved Tracks/Albums/Artists models, playlist CRUD + items reorder/remove, collaborator invite, Pillow 2×2 mosaic covers, `/library` tabs + Liked Songs, `/playlist/<id>` page, heart toggle everywhere, Create-playlist modal, sidebar with user playlists |
| 8 ✅ | Artist & album pages — top-tracks + full discography + related-artists at `/catalog/artist/<id>`, ordered tracklist + duration + year + related at `/catalog/album/<id>`, `/library/{artists,albums}/ids/` lookups, frontend `/artist/:id` (backdrop hero + Popular + Discography tabs + Fans also like) and `/album/:id` (hero + save + tracklist + related), search cards link to detail pages |
| 9 ✅ | Social — `social_user_follow` model, User privacy fields, `/users/<id>/*` public profile + follow + followers/following endpoints, `/me/{feed,friends-activity,privacy,recap}/`, frontend `SocialService` (30s poll), `/user/:id` profile page, right-rail Friends Activity (≥1280px), profile dropdown in top-nav, Privacy toggles in Settings |
| 10 ✅ | Polish + deploy — security (Argon2 + HSTS + X-Frame DENY + request-id middleware + private-cache middleware), `RequestMetricsMiddleware` + `/api/v1/metrics/`, PWA (vite-plugin-pwa with manifest + workbox runtime caching), reusable Carousel (drag/wheel/prev-next), mobile sidebar drawer + compact bottom-player, Sentry SDK (`sentry-sdk[django]` installed; DSN-driven init that no-ops without DSN), i18n parity for all landmark `aria-label`s, multi-stage Dockerfiles + docker-compose.prod.yml + Caddyfile + README deploy guide. Optional follow-ups: Lighthouse audit pass, native iOS/Android. |

## Design

The visual language is **Spotify-minimalism**, codified in [`DESIGN.md`](./DESIGN.md) — colour tokens (dark-first, `#1DB954` accent), Manrope typography scale, 8-pt spacing, motion timing (`200ms cubic-bezier(0.3,0,0,1)`), component specs (cards, list rows, bottom player, modals), accessibility rules.
