# SETUP.md — Aralytics Setup & Developer Guide

> Quick-start instructions, default demo credentials for Student & Teacher views, and available workspace commands.

---

## 1. Prerequisites

- **Node.js**: `v20.x` or later (`v22.x` recommended)
- **npm**: `v10.x` or later
- **Git**: `v2.40+`
- **Backend**: JDK 21+ and PostgreSQL 16 on `localhost:5432` (databases `aralytics` and `aralytics_prod`, user/password `postgres`/`postgres`), or Docker to run `docker compose up -d` from the repository root (reads root `.env`).

---

## 2. Quick Start

```powershell
# 1. Create root .env (set ENV=development or ENV=production)
Copy-Item .env.example .env

# 2. Start PostgreSQL 16 + backend API (http://localhost:8080)
docker compose up -d --build

# 3. Install frontend dependencies & start Vite dev server (http://localhost:3000)
npm --prefix frontend install
npm --prefix frontend run dev
```

*(On Windows with local PostgreSQL 16, you can also run `.\run-app.bat` from the repository root.)*

---

## 3. Default Credentials (Student & Teacher)

### Login Screen (`/login`)

When `ENV=development` (and not a production `vite build`), `/login` pre-fills default demo credentials automatically when switching between the **Student** and **Teacher / Educator** tabs. When `ENV=production` or `vite build` runs, both fields start empty and no demo credentials are bundled:

| Role | Identifier (Email / ID) | Alternate ID | Default Password | Redirects To |
|---|---|---|---|---|
| **Student** | `miguel@school.edu.ph` | `s2024-9102` | `student123` | `/student/dashboard` |
| **Teacher / Educator** | `maria.santos@university.edu.ph` | `t2024-0104` | `teacher123` | `/teacher/dashboard` |

> **Backend Required**: Sign In calls `POST /api/auth/login`; the app only navigates on a successful response and shows the API error otherwise.

---

### Account Activation & Registration (`/register`)

When testing the institutional onboarding flow on `/register`, the backend must be running with `ENV=development` (which activates `dev,seed` on `aralytics`). Seeded institution/key hints appear in development only and are hidden in `ENV=production` / `vite build`. The screen calls `POST /api/auth/verify-key` then `POST /api/auth/activate`, and asks for full name and email in addition to the fields below.

| Role | School / Institution Code | Issued Access Key / PIN | Password Requirement | Redirects To |
|---|---|---|---|---|
| **Student Activation** | `STJUDE-MNL-2025` | `KEY-8821-PY` | 8+ chars, ≥1 number, matching confirm (e.g. `Student123!`) | `/student/dashboard` |
| **Teacher / School Setup** | `STJUDE-MNL-2025` | `FAC-2025-DEPED` | 8+ chars, ≥1 number, matching confirm (e.g. `Teacher123!`) | `/teacher/dashboard` |

### Testing the 403 Forbidden Page (`/forbidden`)

- **Role-mismatch redirect (full UI with Access Details card):** Sign in as a `STUDENT` and visit any teacher route (e.g. `/teacher/dashboard`), or sign in as a `TEACHER` and visit any student route (e.g. `/student/dashboard`). `RequireAuth` redirects to `/forbidden` with route/role state showing `Requested Route`, `Your Role`, `Required Role`, and the **Go to My Dashboard**, **Go Back**, and **Switch Account** actions.
- **Direct visit (generic layout check):** Open `http://localhost:3000/forbidden` directly while signed out (shows **Sign In** / **Back to Home**) or signed in (shows **Go to My Dashboard** / **Switch Account**) without the Access Details card.
- **API 403 vs. Page 403:** Backend `403` responses render the inline `DataError` ("Access denied") banner rather than redirecting to `/forbidden`.

---

## 4. Available Commands

Run inside `frontend/` (or from root with `npm --prefix frontend run <script>`):

| Command | Description |
|---|---|
| `npm run dev` | Starts Vite dev server with HMR at `http://localhost:3000` |
| `npm run build` | Builds production bundle into `frontend/dist/` |
| `npm run preview` | Serves the production build locally for verification |
| `npm run lint` | Runs `oxlint` across `frontend/src/` (must exit with 0 warnings and 0 errors) |
| `npm run fetch-screens` | Runs `node ../fetch-screens.mjs --out ../screens/stitch` to pull Stitch HTML/PNG exports |

---

## 5. Repository Structure

```text
aralytics/
├── .env.example          # Unified root env template (ENV=development|production)
├── docker-compose.yml    # PostgreSQL 16 + Spring Boot backend (:8080)
├── run-app.bat           # One-click Windows launcher (backend :8080 + frontend :3000)
├── README.md             # Project overview and quick start
├── docs/
│   ├── SETUP.md          # Setup, commands, and default Student/Teacher credentials (this file)
│   ├── NAVIGATION.md     # Frontend screen routes, navigation links, and backend /api/* endpoint map
│   ├── PRD.md            # Product requirements and MVP/post-MVP scope
│   ├── HANDOFF.md        # Architecture, design tokens, and Stitch -> React conversion rules
│   ├── FILETREE.md       # Complete directory & file purpose map
│   ├── LOG.md            # Chronological log of project changes
│   ├── architecture.md   # Full-stack system architecture overview
│   ├── requirements.md   # Requirements index and MVP scope summary
│   └── team-roles.md     # Team roster and role descriptions
├── backend/              # Spring Boot 3.4.13 / Java 21 REST API + Flyway PostgreSQL 16 migrations
├── postman/              # Postman collection and workspace globals for API testing
├── screens/              # Raw Stitch HTML + PNG reference exports (gitignored)
└── frontend/             # React 19 + Vite 8 + Tailwind CSS v4 SPA
    ├── public/           # Static public assets
    └── src/
        ├── api/          # REST client (client.js) and data-fetching hook (useApiResource.js)
        ├── components/   # BrandLogo, DataState, NotificationBell, student/, layout/ (Sidebar, TopBar)
        └── screens/
            ├── public/   # /, /login, /register, /forgot-password, /reset-password
            ├── shared/   # /profile
            ├── student/  # /student/dashboard, /student/activities, /student/quiz, /student/feedback, /student/progress
            └── teacher/  # /teacher/dashboard, /teacher/students, /teacher/activities, /teacher/reports, /teacher/settings
```
