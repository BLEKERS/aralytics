# Aralytics — Frontend Architecture

Purpose: describe the current structure of the Aralytics frontend so contributors can navigate the codebase and understand where a backend/AI service will plug in later.

Status: **frontend-only prototype** (React 19 + Vite 8 + Tailwind CSS v4), converted 1:1 from 13 Google Stitch HTML exports. No service tier exists yet — all data is sample data rendered from local component state.

## High-Level Diagram

```
+------------------------------------------
|                BROWSER
|   http://localhost:3000 (Vite dev server)
+---------------------+--------------------
                      |
                      v
+------------------------------------------
|         React SPA  (frontend/src)
|
|  [ Public & Auth screens ]   /, /login, /register
|         standalone header/footer
|  [ Student screens ]         /student/*
|         standalone header/footer
|  [ Teacher screens ]         /teacher/*
|         AppShell (Sidebar + TopBar)
|
|  State: local useState + sample data (no persistence)
+---------------------+--------------------
                      |
        (planned, NOT implemented)
                      |
                      v
+------------------------------------------
|     Backend / AI service  (future)
|  REST surface: /api/* as documented in
|  NAVIGATION.md  (/api/public, /api/auth,
|  /api/student, /api/teacher)
+------------------------------------------
```

The browser talks only to the Vite dev server today. The `/api/*` endpoints listed in `NAVIGATION.md` (section 2) are the planned integration surface — they are documented, not implemented, and no API client exists in `frontend/src`.

## Route Map (13 routes)

Derived from `HANDOFF.md` section 4. Core routes only; `App.jsx` also defines backwards-compatible redirects (`/home`, `/student`, `/dashboard`, etc.) — see `App.jsx` for the full list.

| Route | Component | Layout Chrome |
|---|---|---|
| `/` | `frontend/src/screens/public/LandingPage.jsx` | Standalone (public marketing header + footer) |
| `/login` | `frontend/src/screens/public/LoginScreen.jsx` | Standalone (auth header + split card + footer) |
| `/register` | `frontend/src/screens/public/AccountActivationScreen.jsx` | Standalone (auth header + split card + footer) |
| `/student/dashboard` | `frontend/src/screens/student/StudentDashboard.jsx` | Standalone (student portal header + mobile nav + footer) |
| `/student/activities` | `frontend/src/screens/student/StudentMyActivities.jsx` | Standalone (student activities header + mobile nav + footer) |
| `/student/quiz` | `frontend/src/screens/student/StudentLiveQuiz.jsx` | Standalone (student quiz header + sticky submit footer) |
| `/student/feedback` | `frontend/src/screens/student/StudentDiagnosticReport.jsx` | Standalone (student feedback header + practice modal + footer) |
| `/student/progress` | `frontend/src/screens/student/StudentProgressHistory.jsx` | Standalone (student progress header + diagnostic modal + footer) |
| `/teacher/dashboard` | `frontend/src/screens/teacher/TeacherDashboard.jsx` | `AppShell` (Sidebar + TopBar) |
| `/teacher/students` | `frontend/src/screens/teacher/StudentsMasteryRoster.jsx` | `AppShell` (Sidebar + TopBar) |
| `/teacher/activities` | `frontend/src/screens/teacher/ActivitiesQuizManagement.jsx` | `AppShell` (Sidebar + TopBar) |
| `/teacher/reports` | `frontend/src/screens/teacher/ClassReportsLearningAnalytics.jsx` | `AppShell` (Sidebar + TopBar) |
| `/teacher/settings` | `frontend/src/screens/teacher/TeacherClassroomSettings.jsx` | `AppShell` (Sidebar + TopBar) |

## Layout Architecture

The app has a two-mode layout split, conditional in `frontend/src/App.jsx`:

- **AppShell (Teacher View)** — `AppShell.jsx` is active only when the pathname starts with `/teacher/`. It renders the fixed left `Sidebar.jsx`, a sticky `TopBar.jsx`, and wraps children in `<main>`. It also owns a responsive mobile slide-over drawer (`lg:hidden`) triggered by the hamburger button in `TopBar`, with a backdrop overlay that closes the drawer on click.
- **Standalone chrome (Public/Auth + Student View)** — screens under `frontend/src/screens/public/` and `frontend/src/screens/student/` render their own header and footer from their respective Stitch exports and bypass `AppShell`. Student screens keep their Stitch top navigation (wired to `/student/*` and `/login`) and provide a responsive `xl:hidden` hamburger menu for smaller screens.
- **Role separation** — public/auth, student, and teacher screens live in separate directories (`screens/public/`, `screens/student/`, `screens/teacher/`) and journey logically from `/login` into the matching dashboard. Teacher screens render only the inner content of `<main>`; all shared chrome comes from AppShell.

## Design System

- **Tokens** live in the `@theme` block of `frontend/src/index.css` (Material-3-inspired palette, fonts, radii, custom spacing). Do not duplicate token values here — the canonical list is in `HANDOFF.md` section 3.
- **Brand identity**: `frontend/src/components/BrandLogo.jsx` is the single source of the header brand lockup. Use it on every public/auth/student header and in the teacher `Sidebar`; do not hand-roll alternate logo marks or place it in footers.
- **Icons**: Google Material Symbols Outlined (`.material-symbols-outlined`, configured in `frontend/src/index.css`).
- **Responsive convention**: teacher multi-column grids switch at `xl` (1280px), not `lg`, because the fixed sidebar occupies ~250px from `lg` up.

## Tooling & Quality Gates

Frontend tooling (run from `frontend/` or with `npm --prefix frontend`):

- `dev` — Vite dev server on port 3000 (`frontend/vite.config.js`).
- `build` — production bundle into `frontend/dist/`.
- `lint` — `oxlint` across `frontend/src/`.

**Quality gate: `lint` and `build` must pass before any merge.**

## Data & State

- Currently **local component state (`useState`) + hardcoded sample data only**. There is no persistence layer, no store library, and no API client in the codebase.
- All backend integration is deferred; the planned REST surface (`/api/public/*`, `/api/auth/*`, `/api/student/*`, `/api/teacher/*`) is documented endpoint-by-endpoint in `NAVIGATION.md` section 2. When a backend lands, it plugs in behind those endpoints without changing the route map.

## Testing Pointer

- Current checks are E2E-style, run manually with **Playwright MCP against the dev server** (`http://localhost:3000`): page loads, responsive overflow checks, and key role flows.
- A unit test runner has **not been chosen yet** (frontend test files do not exist yet).
- Conventions and planned checks for `frontend/tests/` are described in [`frontend/tests/README.md`](../frontend/tests/README.md).
