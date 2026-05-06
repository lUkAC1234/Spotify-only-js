# Spotify — Project Documentation

## Project Overview

**Spotify** is a music-streaming web application — a Spotify-style player layered on top of a free, legally-redistributable catalog (Jamendo + Audius). It is a class-based React 19 + MobX SPA against a Django 5.2 + DRF + Postgres backend, with a Spotify-minimalism UI (dark theme, green accent, content-first layout).

**Status:** Phases 1–3 complete. Catalog models migrated, Jamendo + Audius `Provider` clients live, `/api/v1/catalog/*` and `/api/v1/stream/<id>/` (HTTP Range) endpoints serve real audio. Real session-based auth — `/api/v1/auth/{register,login,logout,me,csrf,me/avatar,me/password}/` with DRF throttling (5/h register, 20/h login), 401-aware exception handler, custom `User` model with email login + display name + avatar (auto-WebP). Frontend has a CSRF-aware API client, full `AuthService` (login / register / logout / fetchMe / updateProfile / avatar upload+delete / changePassword), real `<Login>` / `<Register>` / `<Settings>` pages with form validation, an `AuthLayout` (centered card) and `Shell` for the rest. Phases 4–10 still pending.

**Current home page:** Spotify-style Shell with greeting and four placeholder feature rows ("Recently played", "Made for you", "New releases", "Featured playlists"). Real data lands in Phase 5.

**Operator setup needed for streaming:** the dev `.env` ships with `JAMENDO_CLIENT_ID=eb2fcdef` (Enzora's app). Replace with your own at <https://devportal.jamendo.com/> for production.

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
    │   ├── catalog/                  # artists, albums, tracks, genres
    │   │   ├── apps.py / models.py / admin.py
    │   │   ├── services.py / selectors.py
    │   │   ├── providers/            # base.py, jamendo.py, audius.py
    │   │   ├── api/                  # urls.py (app_name=catalog)
    │   │   ├── migrations/
    │   │   └── tests/
    │   ├── playback/                 # streaming proxy + state
    │   │   ├── apps.py / models.py / admin.py
    │   │   ├── services.py / selectors.py
    │   │   ├── api/                  # urls.py (app_name=playback)
    │   │   ├── migrations/
    │   │   └── tests/
    │   ├── library/                  # saved-*, history, playlists
    │   │   ├── apps.py / models.py / admin.py
    │   │   ├── services.py / selectors.py
    │   │   ├── api/                  # urls.py (app_name=library)
    │   │   ├── migrations/
    │   │   └── tests/
    │   └── social/                   # follows, feed, recap
    │       ├── apps.py / models.py / admin.py
    │       ├── services.py / selectors.py
    │       ├── api/                  # urls.py (app_name=social)
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
| 5 | Home & discovery — recently played, made-for-you, new releases, featured, trending |
| 6 | Search — Postgres FTS over `tsvector`, debounced UI, recent searches, categorised results |
| 7 | Library + playlists — saved tracks/albums/artists, playlist CRUD, reorder, collaborators, auto-mosaic covers |
| 8 | Artist & album pages — hero + top tracks + discography + related |
| 9 | Social — user follows, public profiles, friends-activity rail, yearly recap |
| 10 | Polish + deploy — i18n parity, responsive, PWA, a11y, observability, security audit, one-command VPS deploy |

## Design

The visual language is **Spotify-minimalism**, codified in [`DESIGN.md`](./DESIGN.md) — colour tokens (dark-first, `#1DB954` accent), Manrope typography scale, 8-pt spacing, motion timing (`200ms cubic-bezier(0.3,0,0,1)`), component specs (cards, list rows, bottom player, modals), accessibility rules.
