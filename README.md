# Vinteo RMX Manager

Vinteo RMX Manager is a Django-based operations dashboard for Vinteo conferencing systems.

## UI Preview

![Vinteo RMX Manager Dashboard](docs/images/dashboard-preview.png)

## Tech stack
- Python 3.14 + Django 6
- Vanilla JavaScript modules + Axios + HLS.js
- PostgreSQL (via Docker) or SQLite fallback

## Project structure

```text
.
|- README.md
|- docs/
|  \- images/
|     \- dashboard-preview.png
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

## Main features

- Conference list with search, status display, start/stop, create, edit, and delete.
- Conference settings modal with tabs (`Main`, `Call`, `Connection`, `Advanced`).
- Participant table with auto refresh, search, status sort, and detail enrichment.
- Per-participant controls: mic, camera, audio, video, kick, and context menu actions.
- Bulk controls for all participants (mute mic/camera/audio/video).
- Layout selector (Equal/Focus presets) with drag-and-drop participant placement.
- Stage stream manager with HLS playback, preview fallback, and lecturer focus flow.
- Address book panel with add participant/group interactions.
- Backend proxy at `/api/vinteo/*` with automatic JWT login/refresh to Vinteo API.

## Docker quick start

Run from `vinteo_app/`:

```bash
docker compose up --build
```

Services:
- App: `http://127.0.0.1:8000`
- Postgres: `localhost:5432`
- pgAdmin: `http://127.0.0.1:5050`
