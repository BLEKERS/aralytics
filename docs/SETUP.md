# SETUP.md — Aralytics Setup & Developer Guide

> Quick-start instructions, default demo credentials for Student & Teacher views, and available workspace commands.

---

## 1. Prerequisites

- **Node.js**: `v20.x` or later (`v22.x` recommended)
- **npm**: `v10.x` or later
- **Git**: `v2.40+`

---

## 2. Quick Start

```powershell
# 1. Install frontend dependencies
cd frontend
npm install

# 2. Start the Vite development server (http://localhost:3000)
npm run dev
```

Or run commands directly from the repository root (`aralytics/`) using `--prefix frontend`:

```powershell
npm --prefix frontend install
npm --prefix frontend run dev
```

---

## 3. Default Credentials (Student & Teacher)

### Login Screen (`/login`)

The `/login` screen pre-fills default demo credentials automatically when switching between the **Student** and **Teacher / Educator** tabs:

| Role | Identifier (Email / ID) | Alternate ID | Default Password | Redirects To |
|---|---|---|---|---|
| **Student** | `miguel@school.edu.ph` | `s2024-9102` | `student123` | `/student/dashboard` |
| **Teacher / Educator** | `maria.santos@university.edu.ph` | `t2024-0104` | `teacher123` | `/teacher/dashboard` |

> **Backend Required**: Sign In calls `POST /api/auth/login`; the app only navigates on a successful response and shows the API error otherwise.

---

### Account Activation & Registration (`/register`)

When testing the institutional onboarding flow on `/register`, the backend must be running with the
demo data (`SPRING_PROFILES_ACTIVE=dev,seed`). The screen calls `POST /api/auth/verify-key` then
`POST /api/auth/activate`, and asks for full name and email in addition to the fields below.

| Role | School / Institution Code | Issued Access Key / PIN | Password Requirement | Redirects To |
|---|---|---|---|---|
| **Student Activation** | `STJUDE-MNL-2025` | `KEY-8821-PY` | 8+ chars, ≥1 number, matching confirm (e.g. `Student123!`) | `/student/dashboard` |
| **Teacher / School Setup** | `STJUDE-MNL-2025` | `FAC-2025-DEPED` | 8+ chars, ≥1 number, matching confirm (e.g. `Teacher123!`) | `/teacher/dashboard` |

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
├── SETUP.md          # Setup, commands, and default Student/Teacher credentials (this file)
├── NAVIGATION.md     # Frontend screen routes, navigation links, and backend /api/* endpoint map
├── PRD.md            # Product requirements and current prototype/production scope distinction
├── HANDOFF.md        # Architecture, design tokens, and Stitch -> React conversion rules
├── FILETREE.md       # Complete directory & file purpose map
├── LOG.md            # Chronological log of project changes
├── screens/          # Raw Stitch HTML + PNG reference exports (gitignored)
└── frontend/         # React 19 + Vite 8 + Tailwind CSS v4 SPA
    ├── public/       # Static public assets
    └── src/
        ├── components/layout/   # Teacher View AppShell (Sidebar + TopBar)
        └── screens/
            ├── public/          # /, /login, /register
            ├── student/         # /student/dashboard, /student/activities, /student/quiz, /student/feedback, /student/progress
            └── teacher/         # /teacher/dashboard, /teacher/students, /teacher/activities, /teacher/reports, /teacher/settings
```
