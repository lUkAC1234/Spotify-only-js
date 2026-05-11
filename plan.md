# Spotify Clone — Implementation Plan

> Living document. Updated as scope shifts. Source of truth for what we're building, in what order, and why.

---

## 0. Why this document exists

You have:

- A finished React 19 + MobX + Django 5.2 + Postgres scaffold (Hello World home, full DI / routing / i18n / theme / error-boundary infrastructure).
- A working single-file prototype (`/index.html`) that uses the iTunes Search API to find tracks and plays the 30-second `previewUrl`.

You want:

- A real Spotify-style streaming app — **full-length tracks, not 30-second clips**.
- Everything driven by the Django backend, not the browser fetching public APIs directly.
- Postgres holds metadata (tracks / artists / albums / users / playlists / library / history). **No audio bytes in the database.** Audio is streamed through the backend from an upstream provider.
- Spotify-grade minimalist UI: dark theme, green accent, generous whitespace, typography-first.

This document defines the **music source strategy**, the **architecture**, the **database schema**, the **API surface**, and **10 sequenced phases** to take the repo from where it is now to a production-grade clone.

---

## 1. Music source strategy — the most important decision

There is no legal way to serve Spotify's catalog. Spotify has $9B+/year in licensing deals that no clone can replicate. Every API that exposes Drake, Taylor Swift, Bad Bunny, etc. either limits to 30-second previews (Spotify Web API, iTunes Search, Deezer) or requires a paid Premium account on the user's side and the official client to stream.

So the realistic options for **full-length streaming** through a backend are limited to **catalogs that are free to redistribute**:

| Source | Catalog size | License | Auth needed | Streaming format | Mainstream pop? | Verdict |
|---|---|---|---|---|---|---|
| **Jamendo Music** | ~600,000 tracks | Creative Commons (artist-uploaded, opt-in for streaming) | `client_id` (free, instant) | MP3 / OGG, fixed bitrates | ❌ (indie, electronic, classical, world) | ✅ **Primary** — biggest legal full-length catalog with a clean REST API |
| **Audius** | ~300,000+ tracks | Artist-uploaded, decentralized | None for read | HLS (chunked) | ⚠️ partial (electronic / hip-hop indies) | ✅ **Secondary** — adds genres Jamendo is light on |
| **Free Music Archive** | ~150,000 tracks | CC / public domain | None | MP3 | ❌ (very indie) | ⚠️ Optional later — patchy uptime |
| **Internet Archive Audio** | ~14M items (huge but messy) | Public domain / CC | None | varies | ❌ | ❌ Not a clean fit |
| **Spotify Web API** | full Spotify catalog | proprietary | OAuth | 30s preview only | ✅ | ❌ Can't give us full streaming |
| **Apple Music API** | full Apple catalog | proprietary | OAuth + active subscription on device | full only via MusicKit | ✅ | ❌ Won't work without a paying subscriber |
| **YouTube / yt-dlp** | everything | scraping; violates ToS | — | — | ✅ | ❌ Off the table for any public deployment — fingerprinting breaks frequently |
| **Yandex Music (unofficial)** | full popular RU/CIS catalog | proprietary; OAuth-token scraped from web client | personal Yandex Music account token | direct signed MP3 URLs (short TTL) | ✅ (incl. Russian mainstream) | ⚠️ **Personal/educational use only** — see § 1a below |

### Decision

**Primary upstream: Jamendo. Secondary: Audius. Tertiary (opt-in, personal use): Yandex Music (unofficial).**

- Jamendo gives us a single, well-documented REST API (`api.jamendo.com/v3.0`), free `client_id` registration, full-length MP3/OGG streaming, and rich metadata (genre, BPM, mood tags, license info, cover art).
- Audius supplements Jamendo's catalog with electronic/indie that Jamendo lacks. Discoverable through `audius.co`'s public discovery node API; HLS-streamed.
- Yandex Music is the **only** practical source for Russian mainstream pop/rap. It is enabled when `YANDEX_MUSIC_TOKEN` is set; absent that, the Yandex provider is dormant and the app falls back to Jamendo + Audius. Provider file is named `yandex_music_unofficial.py` so the unofficial nature is visible in every import.
- The frontend never knows the upstream — it sees `GET /api/v1/stream/<track_id>` and an HTML5 `<audio>` element. The backend resolves which upstream to fetch from, range-proxies the bytes, and hides the upstream credentials. The track's `source` field (`"jamendo" | "audius" | "yandex"`) is exposed honestly in the JSON so the UI can label provenance.

### 1a. Unofficial provider exception (Yandex Music)

The original wording of this document said *"we won't ship a project that breaks ToS"*. That rule is **relaxed for the Yandex Music provider only**, and only under the following conditions:

1. The provider file is named `yandex_music_unofficial.py` and its module docstring states it violates Yandex Music ToS.
2. The `.env` variable is `YANDEX_MUSIC_TOKEN` and `.env.example` documents it as *unofficial / personal-use only*.
3. The track's `source` field travels to the frontend unchanged so UI badges can reveal the origin to the user.
4. This exception covers personal / educational / single-tenant deployments. **Do not ship a public, multi-tenant SaaS with this provider enabled** — Yandex's signing keys rotate, the token is account-bound, and rate-limits are not designed for serving thousands of users.
5. All other providers must remain strictly legal. The unofficial exception is local to this one file and is not a precedent for adding more scraped sources.

### What this means for users

We are honest in the UI: this is a *Spotify-like player on top of Creative-Commons / artist-uploaded music.* The interactions, the player, the library, the playlists, the social features — everything else — are 1:1 Spotify. The catalog is a free one. This is the only path that is (a) legal, (b) free for us to operate, and (c) doesn't require every user to have a Spotify Premium subscription.

If the project later acquires licensing budget, the streaming layer is a single `Provider` interface — swapping Jamendo for a licensed catalog is one file.

---

## 2. Architecture overview

```
                                 ┌──────────────────────────────────┐
                                 │       React 19 SPA (Vite)        │
                                 │  MobX services · DI · SCSS Mods  │
                                 │  HTML5 <audio> + queue/shuffle   │
                                 └───────────────┬──────────────────┘
                                                 │  HTTPS, cookies (SameSite=Lax)
                                                 │  /api/v1/...
                                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       Django 5.2 + DRF + Unfold admin                       │
│                                                                             │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐ │
│  │   auth     │ │   catalog  │ │  playback  │ │  library   │ │   social   │ │
│  │  (sessions │ │ (sync from │ │ (range     │ │ (saved /   │ │ (follows / │ │
│  │   + JWT)   │ │  upstream) │ │  proxy)    │ │  history)  │ │ activity)  │ │
│  └────────────┘ └─────┬──────┘ └──────┬─────┘ └────────────┘ └────────────┘ │
│                       │               │                                     │
│                       │               │                                     │
└───────────────────────┼───────────────┼─────────────────────────────────────┘
                        │               │
                        ▼               ▼
                  ┌──────────┐    ┌──────────────────────────┐
                  │ Postgres │    │  Upstream music sources  │
                  │ metadata │    │  ─ Jamendo (primary)     │
                  │  only    │    │  ─ Audius (secondary)    │
                  └──────────┘    └──────────────────────────┘
```

**Key invariants**

- The browser **never** calls Jamendo / Audius / iTunes directly. It only talks to `/api/v1/...`.
- Audio bytes **never** touch Postgres. They flow upstream → Django's stream view → browser as a plain HTTP byte stream with `Accept-Ranges: bytes`.
- Track metadata is **cached** in Postgres on first lookup (write-through). Subsequent requests hit Postgres only.
- The audio CDN URL is **never** sent to the browser. The browser only knows `/api/v1/stream/<track_id>`.

---

## 3. Database schema (final shape, additive across phases)

All tables prefixed with the app they belong to (`catalog_*`, `library_*`, `social_*`). Keys / important columns shown — full Django models defined in their phases.

```
auth_user                      ← Django default + email login
  id  email  username  display_name  avatar  password  date_joined  is_active

catalog_artist
  id  source  source_id  name  slug  bio  image  country  monthly_listeners (denormalised)

catalog_album
  id  source  source_id  artist_id  title  slug  release_date  cover  total_tracks  type (album|single|ep)

catalog_track
  id  source  source_id  album_id  artist_id  title  slug  duration_ms  track_number  isrc?
  audio_url_cached_at  preview_url  cover  explicit  bpm  genre  popularity  fts (GIN)

catalog_genre
  id  slug  name

catalog_track_genre
  track_id  genre_id

library_saved_track
  user_id  track_id  saved_at        UNIQUE(user_id, track_id)

library_saved_album
  user_id  album_id  saved_at        UNIQUE(user_id, album_id)

library_followed_artist
  user_id  artist_id  followed_at    UNIQUE(user_id, artist_id)

library_play_history
  id  user_id  track_id  played_at  source (search|playlist|album|artist|home|radio)  ms_listened

library_playlist
  id  owner_id  title  description  cover (auto-mosaic|user-upload)  is_public  is_collaborative  created_at  updated_at

library_playlist_item
  id  playlist_id  track_id  position  added_by_id  added_at        UNIQUE(playlist_id, position)

library_playlist_collaborator
  playlist_id  user_id  added_at      UNIQUE(playlist_id, user_id)

social_user_follow
  follower_id  followed_id  followed_at  UNIQUE(follower_id, followed_id)

playback_device
  id  user_id  name  user_agent  last_seen_at

playback_state
  user_id (PK)  device_id  track_id  position_ms  is_playing  shuffle  repeat  queue (jsonb)  context (jsonb)
```

Indexes:

- `catalog_track.fts` — `tsvector` of title + artist name + album title, GIN-indexed → drives full-text search.
- `library_play_history (user_id, played_at DESC)` — drives "recently played".
- `library_saved_track (user_id, saved_at DESC)` — drives "Liked Songs".
- All `(user_id, *)` constraints are user-scoped (no cross-tenant leaks).

---

## 4. Backend API surface (versioned `/api/v1/`)

```
auth
  POST   /auth/register                  email, username, password, display_name
  POST   /auth/login                     email|username, password   → sets session cookie
  POST   /auth/logout
  POST   /auth/password/reset/request
  POST   /auth/password/reset/confirm
  GET    /auth/me

catalog
  GET    /catalog/search?q=&type=track,artist,album,playlist&limit=&offset=
  GET    /catalog/track/<id>
  GET    /catalog/album/<id>             includes tracks
  GET    /catalog/artist/<id>            includes top tracks + albums + related
  GET    /catalog/genres
  GET    /catalog/genre/<slug>           featured tracks/albums for genre
  GET    /catalog/new-releases
  GET    /catalog/featured-playlists
  GET    /catalog/recommendations        seed_tracks=&seed_artists=&seed_genres=

playback
  GET    /stream/<track_id>              HTTP 206 byte-range proxy → upstream MP3
  POST   /playback/state                 sync queue/position/shuffle/repeat
  GET    /playback/state
  POST   /playback/play-event            track_id, ms_listened, source

library
  GET    /library/tracks
  PUT    /library/tracks/<track_id>      "save"
  DELETE /library/tracks/<track_id>
  GET    /library/albums
  PUT    /library/albums/<album_id>
  DELETE /library/albums/<album_id>
  GET    /library/artists
  PUT    /library/artists/<artist_id>    "follow"
  DELETE /library/artists/<artist_id>
  GET    /library/history?limit=&before=

playlists
  GET    /playlists/me
  POST   /playlists                      title, description?, is_public, is_collaborative
  GET    /playlists/<id>
  PATCH  /playlists/<id>                 title/description/is_public/is_collaborative/cover
  DELETE /playlists/<id>
  POST   /playlists/<id>/items           track_id(s), position?
  PATCH  /playlists/<id>/items/<itemId>  position (reorder)
  DELETE /playlists/<id>/items/<itemId>
  POST   /playlists/<id>/collaborators   user_id
  DELETE /playlists/<id>/collaborators/<userId>

social
  GET    /users/<id>
  PUT    /users/<id>/follow
  DELETE /users/<id>/follow
  GET    /users/<id>/playlists           public only unless owner
  GET    /me/feed                        recent activity from followed users (later phase)
```

All list endpoints are paginated (`limit`/`offset` or cursor). All mutating endpoints require auth. Range requests on `/stream/<id>` are honored byte-exactly so the browser's seek bar works.

---

## 5. Frontend structure (additions to existing scaffold)

```
frontend/src/app/features/
├── home/                   ← exists; will be replaced by real Home (Made For You, recents, new releases)
├── search/
├── browse/                 (genres, charts)
├── library/
│   ├── library.tsx         (list of saved playlists + albums + artists, tabs)
│   ├── saved-tracks/
│   ├── saved-albums/
│   ├── followed-artists/
│   └── playlist/<id>/
├── album/<id>/
├── artist/<id>/
├── auth/
│   ├── login/
│   └── register/
├── settings/
└── 404/

frontend/src/app/core/services/
├── catalog/
│   ├── catalog.service.ts          (search, lookups, recommendations)
│   └── catalog-cache.service.ts    (stale-while-revalidate)
├── player/
│   ├── player.service.ts           (the audio engine — MobX state)
│   ├── queue.service.ts            (current queue, history queue, shuffle bag)
│   ├── playback-sync.service.ts    (PUT /playback/state on changes, debounced)
│   └── media-session.service.ts    (browser MediaSession API integration)
├── library/
│   └── library.service.ts          (saved tracks/albums/artists/playlists)
├── auth/
│   └── auth.service.ts
└── ...existing infrastructure...
```

**Player engine** is one MobX class plus a singleton `<audio>` element mounted in `app.tsx`. `PlayerService` exposes `playTrack`, `playContext({type, id})`, `next`, `prev`, `toggleShuffle`, `toggleRepeat`, `seek`, `setVolume`, `addToQueue`. It is the single source of truth — every UI control reads from it via `@observer`. Sync to backend is debounced (800ms) so we don't thrash the API while the user drags the seek bar.

---

## 6. The 10 phases

Each phase is a complete, shippable slice. Each ends with the app deployable and demonstrable.

---

### Phase 1 — Foundations

**Goal:** All cross-cutting infrastructure for the rest of the work.

**Deliverables**

- Backend: env, settings split (base/dev/prod), DRF auth (session + cookie), CORS-with-credentials wired for the SPA, structured logging, Sentry stub, healthcheck `/api/v1/health`.
- Backend: `User` model with email login + display name + avatar.
- Backend: Postgres schema for `auth_user` and migration.
- Backend: `Provider` abstraction in `web/providers/` — `JamendoProvider`, `AudiusProvider`, both implementing `search(q)`, `track(id)`, `album(id)`, `artist(id)`, `stream_url(track_id)`. No business logic here yet — just typed clients.
- Backend: `.env.example` with `JAMENDO_CLIENT_ID`, `AUDIUS_HOST_OVERRIDE?`, `SECRET_KEY`, DB creds. Real `.env` git-ignored.
- Frontend: replace placeholder Hello World home with a `Shell` layout (sidebar / top-nav / bottom-player-stub / right-panel slot).
- Frontend: `auth.service.ts` skeleton, `catalog.service.ts` skeleton calling backend, `player.service.ts` skeleton (no audio yet — just observable state).
- Frontend: design tokens loaded from `colors.scss` redone to **DESIGN.md** Spotify palette (`--surface`, `--surface-elevated`, `--bg`, `--accent` `#1DB954`, type scale).
- Repo: `docker-compose.yml` for Postgres + Django + Vite (dev). `Dockerfile` for backend (prod).

**Acceptance**

- `npm run dev` and `python manage.py runserver` come up together via docker compose.
- `GET /api/v1/health` returns 200.
- Logging in/out from the SPA works (mock UI, real session). Reload preserves session.

---

### Phase 2 — Music ingestion + streaming proxy

**Goal:** Real audio plays in the browser.

**Deliverables**

- Backend: `catalog.models` — `Artist`, `Album`, `Track`, `Genre`, `TrackGenre`. Each has `source` (`jamendo|audius`) + `source_id`. Unique together on `(source, source_id)`.
- Backend: `CatalogSyncService` — given an upstream `track_id`/`artist_id`, fetch from `Provider`, upsert into Postgres. Idempotent. Cache TTL 24h on metadata, infinite on covers.
- Backend: `GET /api/v1/catalog/track/<id>` — DB-first, falls through to provider on miss.
- Backend: `GET /api/v1/catalog/search?q=&type=` — searches Jamendo by default, returns hits from DB if already synced (preferred). Stores results into DB on the way back so they're searchable locally next time.
- Backend: `GET /api/v1/stream/<track_id>` — the streaming proxy.
  - Resolves track → upstream URL.
  - Honors `Range` header (HTTP 206 partial content), forwards to upstream, streams chunks back without buffering whole file.
  - Sends `Accept-Ranges: bytes`, `Content-Type`, `Content-Length` (or `Content-Range` for partial), `Cache-Control: private, no-store`.
  - Records a `play-event` row asynchronously after >30s playback.
- Frontend: `<audio>` element wired up. Plays a track from search results. Seek bar uses HTTP range. Volume + play/pause/next/prev work.
- Frontend: search box in top-nav hits `/api/v1/catalog/search`.

**Acceptance**

- Pick any indie track on Jamendo; it plays end-to-end through the backend with a working seek bar.
- Network tab shows `Accept-Ranges: bytes` and 206 responses on seek.
- Postgres `catalog_track` populated with whatever was searched/played.
- `JAMENDO_CLIENT_ID` is **not** present in the JS bundle.

---

### Phase 3 — Auth, profile, settings

**Goal:** Real users with real sessions.

**Deliverables**

- Backend: `POST /auth/register` (email + username + password, basic validators, rate-limit 5/h/IP).
- Backend: `POST /auth/login` (email or username + password). Sets `sessionid` cookie, `Secure` + `HttpOnly` + `SameSite=Lax`. CSRF token returned in body for the SPA to echo as `X-CSRFToken`.
- Backend: `POST /auth/logout`, `GET /auth/me`.
- Backend: password reset (token email — dev: console; prod: SMTP).
- Backend: avatar upload — `POST /me/avatar` (multipart, Pillow → WebP, max 1024×1024, stored under `MEDIA_ROOT/avatars/`).
- Frontend: `/login`, `/register` pages. Form validation on the client, server messages displayed.
- Frontend: `AuthService` exposes `me` (observable User | null). Sidebar hides "Library" until logged in. Player works without auth (anonymous browsing) but library actions prompt login.
- Frontend: `/settings` page — display name, avatar, change password, delete account.

**Acceptance**

- Register → log in → reload → still logged in. Log out → reload → logged out.
- Avatar upload appears in sidebar within 1s.
- Failed login shows server-localised message, not a stack trace.

---

### Phase 4 — Player engine + queue

**Goal:** The audio player feels Spotify-grade. This is the most-touched component in the app, so we invest heavily.

**Deliverables**

- Frontend: `PlayerService` (MobX class) — full state machine:
  - `currentTrack`, `queue` (upcoming), `history` (already played), `isPlaying`, `position`, `duration`, `volume`, `isMuted`, `repeatMode` (`off|one|all`), `shuffleEnabled`, `context` (where playback was started — track | album | playlist | artist | search).
  - `playContext({type, id, startTrackId?})` builds a queue from a context and starts playback.
  - Shuffle is a Fisher–Yates shuffle of the *remaining* queue, preserving the played history.
  - `repeat=one` loops the current track without shifting the queue. `repeat=all` re-shuffles after the queue empties.
- Frontend: `BottomPlayer` component — cover, title, artist, prev/play/next, shuffle, repeat, seek bar with hover preview, volume, queue button, fullscreen button.
- Frontend: `QueuePanel` (right-side slide-out) — current queue, drag-reorder, "remove from queue", "play next".
- Frontend: `MediaSessionService` — wires `navigator.mediaSession` so OS-level media keys / lockscreen controls work on macOS, Windows, Android.
- Frontend: keyboard shortcuts — Space (play/pause), ←/→ (skip 10s), Shift+←/→ (prev/next track), M (mute), L (like).
- Frontend: gapless playback — preload next track at 90% of current track's duration.
- Backend: `POST /api/v1/playback/state` — debounced sync from frontend (every 5s during playback or on state change).
- Backend: `GET /api/v1/playback/state` — resume point on reload.

**Acceptance**

- Click any track in the catalog → it plays, the queue is the album it came from, "next" goes to track 2.
- Reload mid-song → comes back at the same track and position (within 5s).
- Shuffle on → the queue order changes; off → original order is restored.
- Press Space anywhere on the page → play/pause toggles.

---

### Phase 5 — Home & discovery

**Goal:** First page after login feels like Spotify.

**Deliverables**

- Backend: `/catalog/new-releases` — most recent N albums from upstream, cached for 1h.
- Backend: `/catalog/featured-playlists` — curated playlists owned by a special `system` user. Seeded via a management command on first deploy (a few hand-picked Jamendo selections per genre).
- Backend: `/catalog/recommendations?seed_*=` — naive: user's top genres from history → fetch trending in those genres.
- Backend: `Made For You: Daily Mix` job — for each user, every 24h a Celery task (or simple cron) regenerates a personal playlist from history. Phase 5 ships the synchronous version; async is Phase 10.
- Frontend: Home page sections — "Good morning/afternoon/evening, {name}", "Recently played" (from `/library/history`), "Made For You" (the Daily Mix), "New releases", "Featured playlists", "Trending in {top-genre}".
- Frontend: each section is a horizontal-scroll card row. Card click → context page (album / playlist / artist).

**Acceptance**

- Logged-in home shows ≥6 sections with real data.
- Cards open the right detail page.
- New releases refresh after the cache TTL without app restart.

---

### Phase 6 — Search

**Goal:** "Search" is one of the three sidebar tabs and must feel instant.

**Deliverables**

- Backend: `tsvector` column on `catalog_track` populated by trigger over `(title || ' ' || artist.name || ' ' || album.title)`. GIN index. Same on `catalog_artist` and `catalog_album`.
- Backend: `/catalog/search` — first checks DB FTS, falls through to upstream provider on weak match (<5 results), upserts upstream hits into DB on the way back. Returns categorised payload: `{ tracks: [], artists: [], albums: [], playlists: [] }`.
- Backend: `/catalog/recent-searches` per user (LRU, max 10).
- Frontend: `/search` page — empty state shows top genres tiles. Typing fires a debounced (250ms) request, renders categorised result blocks (Top result, Songs, Artists, Albums, Playlists).
- Frontend: highlight the matched substring in results.
- Frontend: clicking a result either plays (track), navigates (artist/album/playlist), or sets the query to that term (genre tile).

**Acceptance**

- Typing "moby" returns Moby's catalog within 250ms (after warm cache).
- Cold first search of a previously-unseen artist takes <1.5s and is instant on the second search.
- Recent searches persist across reloads.

---

### Phase 7 — Library + playlists

**Goal:** Users can save things and curate playlists.

**Deliverables**

- Backend: `library_saved_track`, `library_saved_album`, `library_followed_artist` models + endpoints.
- Backend: `library_playlist`, `library_playlist_item`, `library_playlist_collaborator` models + endpoints.
- Backend: playlist cover — auto-generated 2×2 mosaic from first four track covers, regenerated on items change. Stored as static file under `MEDIA_ROOT/playlist-covers/<id>.webp`.
- Backend: collaborative playlists — `is_collaborative=True` lets any collaborator add/remove/reorder.
- Backend: `library/history` — paginated, cursor-based, returns `{track, played_at, source}`.
- Frontend: `/library` — three tabs (Playlists, Albums, Artists) + "Liked Songs" pinned at top.
- Frontend: `/playlist/<id>` — header (cover, title, owner, total time), tracks list with index/title/artist/album/added-date/duration columns, drag-to-reorder for owners/collaborators.
- Frontend: "Liked Songs" is an auto-playlist of `saved_track`. Has its own page using the same playlist UI.
- Frontend: heart toggle on every track in the app talks to `PUT/DELETE /library/tracks/<id>`.
- Frontend: "Add to playlist" menu — searchable list of user's playlists + "Create new playlist".

**Acceptance**

- Save 5 tracks → they all show up in Liked Songs.
- Create a playlist, add 10 tracks, drag #5 to position 1, reload → the order persists.
- Mark playlist collaborative, share with another user → they can edit.
- Cover auto-generates a mosaic when ≥4 tracks; updates within 2s when items change.

---

### Phase 8 — Artist & album pages

**Goal:** Deep navigation through the catalog.

**Deliverables**

- Backend: `/catalog/artist/<id>` payload — artist meta, top tracks (most-played in our DB or from upstream), discography (all albums + EPs + singles), related artists (same genres + heuristic).
- Backend: `/catalog/album/<id>` payload — album meta, tracklist, total time, copyright, related albums.
- Frontend: `/artist/<id>` — large hero (blurred cover backdrop), follow button, monthly listeners, "Popular" top-5 tracks list, "Discography" tabs (Albums / Singles & EPs / Compilations), "Fans also like" row.
- Frontend: `/album/<id>` — header with cover + title + artist + year + length, tracklist, "Save album" heart, share button.
- Frontend: "Play" CTA on both pages starts a context-aware queue.

**Acceptance**

- Search "moby" → click artist → see top tracks → click "Play" → 5 tracks queued. Click an album → 12 tracks queued.
- Following an artist adds them to `/library` Artists tab.

---

### Phase 9 — Social, history, activity

**Goal:** Spotify's social layer (lightweight version).

**Deliverables**

- Backend: `social_user_follow`. Endpoints to follow/unfollow another user, list followers, list following.
- Backend: `/me/feed` — recently-public events from followed users (new playlist, new public playlist item, started listening to track/artist). Privacy-respectful — only public playlists / opt-in listening status.
- Backend: `User.privacy_settings` — `is_listening_public`, `is_recent_history_public` defaults `False`.
- Backend: yearly recap job (cron) — top tracks / artists / genres by user, persisted as a JSON blob for `/me/recap?year=`.
- Frontend: `/user/<id>` — public profile, public playlists, follow button, follower/following counts.
- Frontend: friends-activity sidebar (right rail on desktop ≥1280px): live-ish feed of followed users' currently-playing track.
- Frontend: profile dropdown → "Account", "Privacy", "Sign out".

**Acceptance**

- Follow another user → their public playlists appear under their profile.
- Toggle "Show what I'm listening to" → followers see your now-playing in the friends rail.
- `/me/recap?year=2026` returns top 10 tracks / 10 artists / 5 genres for the calling user.

---

### Phase 10 — Polish, perf, deploy

**Goal:** Production-grade. Boring but the difference between "demo" and "real product".

**Deliverables**

- **i18n**: every user-facing string passes through `LocaleService.t(...)`. Three locales (en/ru/uz) at parity. Date/time uses `time` namespace.
- **Theming**: light/dark via existing `ThemeService`. Verify every Spotify-style component looks intentional in both. Default to dark.
- **Responsive**: full tablet (1024px) + mobile (≤640px) layouts. Bottom player collapses to compact. Sidebar becomes drawer.
- **PWA**: enable `vite-plugin-pwa` (already a dep), service worker pre-caches the shell, network-first for `/api/*`, cache-first for static assets, *no* caching for `/api/v1/stream/*`.
- **Accessibility**: full keyboard navigation, ARIA roles on lists/dialogs/sliders, focus-visible everywhere, ≥4.5:1 contrast for text, prefers-reduced-motion respected.
- **Perf**:
  - Code-split per route (already true via `lazyLoaded`).
  - Image `loading="lazy"` for off-screen covers, `srcset` for 2x.
  - Backend: `db_index=True` on every FK and on `(user_id, played_at)`, `(user_id, saved_at)`. Run `EXPLAIN ANALYZE` on top-5 endpoints.
  - Backend: `select_related` / `prefetch_related` so the playlist endpoint is one query, not N+1.
  - Backend: `Cache-Control: public, max-age=3600` on covers; private no-store on `/me/*`.
- **Observability**: Sentry on both ends, request-id middleware, simple Grafana-able `/metrics` (request count + latency p50/p95) via `django-prometheus`.
- **Deploy**: production `Dockerfile` (multi-stage, non-root user). `docker-compose.prod.yml`. Documented deploy to a single VPS (Caddy reverse-proxy with auto-HTTPS in front of Django + static frontend). README updated with deploy steps.
- **Security audit**: rate-limit on auth endpoints (django-ratelimit), CSRF verified on every mutating endpoint, password hashing default Argon2, `SECURE_HSTS_SECONDS`, `SECURE_PROXY_SSL_HEADER` confirmed for the deploy proxy.

**Acceptance**

- Lighthouse: ≥90 on Performance / Accessibility / Best Practices / SEO for `/` (anonymous), ≥85 for `/library` (authed).
- One-command deploy of a fresh VPS to a public URL. App boots, anonymous can browse + play, registration works, registered user can save tracks and create playlists.
- All three locales fully translated.

---

## 7. Cross-cutting concerns (apply throughout)

- **Code style** — class-based React, MobX `makeObservable`, custom DI, SCSS Modules with `functions.rem(...)`, kebab-case file names, no atomic-CSS frameworks, no inline styles. (See `requirements_ai.md`.)
- **Backend style** — fat services in `apps/<name>/services.py`, thin views in `apps/<name>/api/views.py`, complex reads in `apps/<name>/selectors.py`, no business logic in serializers, no business logic in models beyond simple validators. Each domain (`accounts`, `catalog`, `playback`, `library`, `social`) is its own Django app under `backend/apps/<name>/` for clean migration boundaries.
- **Errors** — frontend never shows a stack. Every API error has a stable `code` field the frontend can branch on. 401 → redirect to `/login` with `?next=`. 5xx → toast.
- **Security** — never log a JWT/session id, never put a track audio URL into a JSON response, never accept a redirect URL from the client without an allowlist.
- **Testing** — Phase 1: pytest skeleton + fixtures. Each phase ships at minimum 1 happy-path integration test per new endpoint. Frontend: vitest happy-paths for services (player.service, library.service, catalog.service). No snapshot tests.

---

## 8. Risks & mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Jamendo rate-limits us | medium | medium | DB-cache aggressively; one upstream hit per (track, 24h). Add a `Provider` queue throttle. |
| Upstream removes a track we have in DB | low | low | `catalog_track.is_unavailable` flag. `/stream/<id>` returns 410 if true. UI shows "Unavailable in your region". |
| User catalog feels too indie | high | medium | Audius integration in Phase 6 expands it. UI never claims to be Spotify's catalog — copy is "Powered by Jamendo & Audius". |
| Streaming bandwidth bill | medium | high | Cache-Control on covers + nginx-buffering tuned for audio. Optional CDN in front (Phase 10). For self-host, document that audio is proxied — operator can run an `nginx` cache layer. |
| Spotify-clone TM concerns | medium | low | App is not named "Spotify". UI inspired by, not copied from. README clarifies. |
| Postgres FTS won't scale past ~1M tracks | low | low | Switch to Meilisearch later — easy to bolt on as a second `Provider` for search only. |

---

## 9. Open questions (please decide before Phase 1 starts)

1. **Project name in the UI?** Currently `index.html` says "Enzora". The Django config and frontend copy say "Spotify". Pick one short brand name that is *not* "Spotify" for legal clarity.
2. **Hosting target?** A single VPS (cheap, simple), Fly.io / Railway (easy CI deploys), or AWS (overkill but flexible)? Affects Phase 10's deploy section.
3. **Email provider for password reset?** SMTP via Resend / Postmark / SendGrid? Or skip and ship password reset in Phase 10?
4. **Mobile app scope?** Phase 10 ships responsive web + PWA. Native iOS/Android would be a separate project.
5. **DESIGN.md** — I am creating it alongside this plan with the Spotify-minimalism design system. Confirm I should keep ownership of it, or you'll edit/replace.

---

## 10. Definition of Done (for the whole project)

- A new visitor can land on the public URL, register, search, play a full-length track, save it, create a playlist, follow another user, and reload to the same state.
- The deployed app passes a Lighthouse audit at ≥90/90/90/90 anonymous home.
- All three locales (en/ru/uz) are at parity for every user-facing string.
- The codebase has zero `any` casts in new code (Phase 1+ rule), zero `style={...}` props, zero atomic-CSS classes, zero inline color literals in `.module.scss`.
- One operator can deploy the app to a fresh VPS with `git clone`, `docker compose up -d`, and a DNS record.
- Audio bytes never appear in a Postgres column. No upstream API key appears in the JS bundle. Period.

---

## Appendix — file-tree shape after Phase 10

```
Spotify-only-js/
├── plan.md                 ← this file
├── DESIGN.md
├── project.md
├── requirements_ai.md
├── frontend.md
├── README.md
├── docker-compose.yml      (dev)
├── docker-compose.prod.yml
├── Caddyfile               (prod proxy)
├── frontend/
│   ├── src/app/features/   home, search, browse, library, album, artist, auth, settings, 404, user
│   ├── src/app/core/services/  player/, queue/, catalog/, library/, auth/, +existing
│   └── ...
└── backend/
    ├── manage.py
    ├── requirements/{base,dev,prod}.txt
    ├── config/
    │   ├── settings/{base,dev,prod}.py
    │   ├── urls.py            mounts /api/v1/{auth,catalog,…}
    │   ├── asgi.py / wsgi.py  → config.settings.prod
    │   └── ...
    ├── apps/
    │   ├── common/    images.py, pagination, permissions, exceptions, validators
    │   ├── accounts/  User + auth: models, managers, services, selectors, admin, api/
    │   ├── catalog/   models, providers/{base,jamendo,audius}.py, services, selectors, admin, api/
    │   ├── playback/  stream proxy, state model, play-event: services, api/
    │   ├── library/   saved-*, history, playlists: models, services, selectors, admin, api/
    │   └── social/    follows, feed, recap: models, services, selectors, admin, api/
    └── assets/        static (admin-custom.css)
```

---

*Reviewed against `requirements_ai.md` (architectural rules), `frontend.md` (design rules) and `DESIGN.md` (Spotify design tokens). Conflicts: none.*
