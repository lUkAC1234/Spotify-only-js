# Spotify

A Spotify-style music streaming web app. **React 19 + MobX SPA** against a **Django 5.2 + DRF + Postgres** backend, layered on top of free, legally-redistributable catalogs (**Jamendo + Audius**).

Architecture, design tokens, and the implementation roadmap live in:

- [`plan.md`](./plan.md) — 10-phase implementation plan + music-source decision + DB schema + API surface
- [`project.md`](./project.md) — current state, tech stack, directory layout, services inventory
- [`DESIGN.md`](./DESIGN.md) — Spotify-minimalism design system (colour tokens, typography, spacing, components)
- [`requirements_ai.md`](./requirements_ai.md) — architectural rules (class-based, MobX, SCSS modules, no atomic CSS)
- [`frontend.md`](./frontend.md) — design philosophy and aesthetic guard-rails

---

## Local development

### Backend (Django 5.2 + Postgres)

```bash
cd backend
python -m venv myenv
./myenv/Scripts/activate          # Windows  (or `source myenv/bin/activate`)
pip install -r requirements/dev.txt
cp .env.example .env              # then edit DB creds + JAMENDO_CLIENT_ID
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver        # http://127.0.0.1:8000
```

Admin: <http://127.0.0.1:8000/admin/>

### Frontend (React 19 + Vite 7)

```bash
cd frontend
npm install
npm run dev                       # http://localhost:5173
```

Vite proxies `/api/*` and `/media/*` to `http://127.0.0.1:8000`.

### Seed featured playlists (Phase 5)

```bash
cd backend
python manage.py seed_featured_playlists
```

### Rebuild full-text search vectors (Phase 6)

```bash
cd backend
python manage.py rebuild_search_vectors
```

---

## Production deployment (single VPS, Docker + Caddy)

The repo ships a one-command deploy stack: Postgres + Django (gunicorn) + Vite static (nginx) + Caddy reverse-proxy with auto-HTTPS via Let's Encrypt.

### 1. Point a DNS A-record at your VPS IP

```
spotify.example.com  → 203.0.113.42
```

### 2. Clone the repo and create `.env`

```bash
ssh root@203.0.113.42
git clone https://github.com/<you>/Spotify-only-js.git
cd Spotify-only-js
cp .env.example .env
```

Edit `.env` and set at minimum:

| Variable | Description |
|---|---|
| `DOMAIN` | Public hostname (e.g. `spotify.example.com`) |
| `SECRET_KEY` | Long random string. Generate with `python -c "import secrets; print(secrets.token_urlsafe(64))"` |
| `ALLOWED_HOSTS` | Same as `DOMAIN` |
| `CSRF_TRUSTED_ORIGINS` | `https://$DOMAIN` |
| `CORS_ALLOWED_ORIGINS` | `https://$DOMAIN` |
| `DB_PASSWORD` | Postgres password |
| `JAMENDO_CLIENT_ID` | Free key from <https://devportal.jamendo.com/> |
| `SITE_URL` | `https://$DOMAIN` |

### 3. Bring the stack up

```bash
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
```

The first `up` does:
- builds the React static bundle and the Django image (multi-stage, non-root user)
- pulls Postgres + Caddy
- runs `manage.py migrate` and `collectstatic` automatically
- Caddy provisions a Let's Encrypt cert for `$DOMAIN` on port 443 and redirects port 80

### 4. Seed the catalog (one-time)

```bash
docker compose -f docker-compose.prod.yml --env-file .env exec backend \
  python manage.py seed_featured_playlists
```

### 5. Tail logs

```bash
docker compose -f docker-compose.prod.yml --env-file .env logs -f backend caddy
```

### Updating the deployment

```bash
git pull
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
```

Migrations are applied on container start.

---

## Hardening checklist

- ✅ `Argon2PasswordHasher` is the default hasher (`argon2-cffi` in `requirements/base.txt`)
- ✅ `SECURE_HSTS_SECONDS = 31_536_000` + `INCLUDE_SUBDOMAINS` + `PRELOAD` in `config/settings/prod.py`
- ✅ `SECURE_SSL_REDIRECT`, `SESSION_COOKIE_SECURE`, `CSRF_COOKIE_SECURE`, `X_FRAME_OPTIONS = "DENY"`, `SECURE_PROXY_SSL_HEADER`
- ✅ DRF throttling on `/auth/register/` (5/h) and `/auth/login/` (20/h)
- ✅ `MeCacheControlMiddleware` forces `Cache-Control: private, no-store` on every `/api/v1/me/*`, `/api/v1/auth/me*`, `/api/v1/library/*`, `/api/v1/playback/state/`, `/api/v1/playlists/me/`
- ✅ `RequestIdMiddleware` echoes the inbound `X-Request-Id` (or generates one) into the response — logs and clients share the same id

## Stream proxy invariants

- `JAMENDO_CLIENT_ID` lives only in Django settings — never in the JS bundle
- The browser only sees `/api/v1/stream/<track_id>` — the upstream URL is resolved server-side and cached for 1h
- The PWA service worker uses `NetworkOnly` for `/api/v1/stream/*` so audio is never cached client-side
- Audio bytes never enter Postgres (Postgres holds metadata only)
