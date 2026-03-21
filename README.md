# Vinteo RMX Manager

Vinteo RMX Manager is a Django-based operations dashboard for Vinteo conferencing systems.

It provides:
- Conference management (list, create, update, delete, start, stop)
- Participant monitoring and controls (mic/camera/audio/video/kick)
- Dynamic stage layouts (Equal/Focus presets with drag-and-drop tiles)
- Stage stream playback (HLS/preview) and lecturer focus actions
- Backend proxy (`/api/vinteo/*`) with automatic JWT login/refresh to upstream Vinteo API

## Tech stack
- Python 3.14 + Django 6
- Vanilla JavaScript modules + Axios + HLS.js
- PostgreSQL (via Docker) or SQLite fallback

## Project structure

```text
.
|- README.md
|- vinteo_app/
|  |- manage.py
|  |- requirements.txt
|  |- docker-compose.yaml
|  |- Dockerfile
|  |- templates/
|  |- static/
|  \- vinteo_app/
|     |- settings.py
|     |- urls.py
|     |- views.py
|     \- api/  (token manager + upstream client)
```

## Quick start (local)

Run from `vinteo_app/`:

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

Open:
- `http://127.0.0.1:8000/` (dashboard)
- `http://127.0.0.1:8000/admin/` (Django admin)

Optional (if you need admin login):

```bash
python manage.py createsuperuser
```

## Environment variables

Create `vinteo_app/.env` (or update existing one). Minimum for upstream Vinteo calls:

```env
BASE_URL=https://your-vinteo-host
VINTEO_USERNAME=admin
VINTEO_PASSWORD=your-password
VINTEO_VERIFY_SSL=false
```

Common Django/DB options:

```env
DEBUG=True
SECRET_KEY=django-secret-key-change-me
ALLOWED_HOSTS=127.0.0.1,localhost

POSTGRES_DB=vinteo_db
POSTGRES_USER=vinteo_user
POSTGRES_PASSWORD=vinteo_password
POSTGRES_HOST=db
POSTGRES_PORT=5432
```

Notes:
- If Postgres variables are not fully set, the app falls back to SQLite (`db.sqlite3`).
- The proxy route is `GET/POST/PUT/PATCH/DELETE /api/vinteo/<endpoint>`.

## Docker quick start

Run from `vinteo_app/`:

```bash
docker compose up --build
```

Services:
- App: `http://127.0.0.1:8000`
- Postgres: `localhost:5432`
- pgAdmin: `http://127.0.0.1:5050`
