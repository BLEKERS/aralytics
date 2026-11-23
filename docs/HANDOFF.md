# HANDOFF.md — Aralytics Architecture & Continuation Guide

> **Always read this file alongside [`SETUP.md`](./SETUP.md), [`NAVIGATION.md`](./NAVIGATION.md), [`LOG.md`](./LOG.md), and [`FILETREE.md`](./FILETREE.md) before touching any code.**

---

## 1. Project Overview

**Aralytics** (also branded **Aralytics Pilipinas AI**) is a Philippine CS / Python coding classroom and diagnostic analytics platform. The React 19 + Vite 8 + Tailwind CSS v4 frontend lives in `frontend/` and is organized into three role-separated views:
1. **Public & Authentication View** (`frontend/src/screens/public/`):
   - Public Marketing Landing Page (`/`)
   - Unified Student / Teacher Login (`/login`)
   - Institutional Key & Account Activation (`/register`)
2. **Student View** (`frontend/src/screens/student/`, routes under `/student/*`):
   - Student Portal Home / Dashboard (`/student/dashboard`)
   - Student Assigned Coding Activities (`/student/activities`)
   - Student Live Quiz & Situational Code Scenario Arena (`/student/quiz`)
   - Student Instant AI Feedback & Diagnostic Report (`/student/feedback`)
   - Student Feedback History & Progress Analytics (`/student/progress`)
3. **Teacher View** (`frontend/src/screens/teacher/`, routes under `/teacher/*`, wrapped in `AppShell`):
   - Teacher Desktop Dashboard (`/teacher/dashboard`)
   - Students & Coding Mastery Roster (`/teacher/students`)
   - Coding Activities & Quizzes Management (`/teacher/activities`)
   - Cohort Reports & Learning Analytics (`/teacher/reports`)
   - Teacher Classroom Settings (`/teacher/settings`)

The UI is converted 1:1 from 13 Google Stitch HTML exports located in `screens/stitch/` (gitignored via `/screens/` in `.gitignore`) into a modular React 19 + Vite 8 + Tailwind CSS v4 Single-Page Application inside `frontend/`.

---

## 2. Tech Stack & Commands

| Layer | Package / Version | Notes |
|---|---|---|
| Framework | `react@^19.2.4`, `react-dom@^19.2.4` | Functional components + hooks only |
| Routing | `react-router-dom@^7.14.1` | `<BrowserRouter>` in `frontend/src/main.jsx`, `<Routes>` in `frontend/src/App.jsx` |
| Styling | `tailwindcss@^4.2.2`, `@tailwindcss/vite@^4.2.2` | Configured via `@theme` block in `frontend/src/index.css` (no `tailwind.config.js`) |
| Bundler | `vite@^8.0.0`, `@vitejs/plugin-react@^6.0.0` | Dev server on `http://localhost:3000` |
| Linter | `oxlint@^1.51.0` | `npm run lint` (`oxlint`) inside `frontend/` |

### Commands (run from `frontend/` or with `--prefix frontend`)
- `npm --prefix frontend run dev` — start Vite dev server
- `npm --prefix frontend run build` — production bundle into `frontend/dist/`
- `npm --prefix frontend run lint` — run `oxlint` across `frontend/src/`

---

## 3. Design System Tokens (`frontend/src/index.css`)

All Stitch exports share a Material-3-inspired palette and typography defined inside `@theme` in `frontend/src/index.css`:

- **Colors**:
  - Primary (Teal): `--color-primary: #00575c`, `--color-primary-container: #0e7076`, `--color-primary-fixed: #9ef0f7`, `--color-primary-fixed-dim: #82d3da`, `--color-on-primary-fixed: #002022`, `--color-on-primary-fixed-variant: #004f54`
  - Secondary (Emerald): `--color-secondary: #1b6d24`, `--color-secondary-container: #a0f399`, `--color-secondary-fixed: #a3f69c`, `--color-on-secondary-container: #217128`, `--color-on-secondary-fixed: #002204`
  - Tertiary (Amber/Brown): `--color-tertiary: #653e00`, `--color-tertiary-container: #835200`, `--color-tertiary-fixed: #ffddb4`, `--color-tertiary-fixed-dim: #ffb958`, `--color-on-tertiary-fixed: #291800`, `--color-on-tertiary-fixed-variant: #643f00`
  - Error (Crimson): `--color-error: #ba1a1a`, `--color-error-container: #ffdad6`, `--color-on-error-container: #93000a`
  - Surfaces (Warm Sand / Cream): `--color-background: #faf9f4`, `--color-surface: #faf9f4`, `--color-surface-bright: #faf9f4`, `--color-surface-dim: #dadad5`, `--color-surface-container-lowest: #ffffff`, `--color-surface-container-low: #f4f4ef`, `--color-surface-container: #eeeee9`, `--color-surface-container-high: #e8e8e3`, `--color-surface-container-highest: #e3e3de`, `--color-on-surface: #1a1c19`, `--color-on-surface-variant: #3f4849`, `--color-outline: #6f7979`, `--color-outline-variant: #bec8c9`
- **Fonts** (loaded in `frontend/index.html`):
  - `--font-headline`: `'Nunito Sans', sans-serif`
  - `--font-body`: `'Inter', sans-serif`
  - `--font-label`: `'Inter', sans-serif`
  - `--font-mono`: `'JetBrains Mono', monospace`
- **Radii** (`@theme` overrides):
  - `--radius-sm: 4px`, `--radius-DEFAULT: 8px`, `--radius-md: 8px`, `--radius-lg: 12px`, `--radius-xl: 16px`, `--radius-2xl: 20px`, `--radius-3xl: 24px`, `--radius-full: 9999px`
- **Custom Spacing** (`@theme`):
  - `--spacing-space-xs: 4px` (`p-space-xs`, `gap-space-xs`, etc.)
  - `--spacing-space-sm: 8px` (`p-space-sm`, `gap-space-sm`, etc.)
  - `--spacing-space-md: 16px` (`p-space-md`, `gap-space-md`, etc.)
  - `--spacing-space-lg: 24px` (`p-space-lg`, `gap-space-lg`, etc.)
  - `--spacing-space-xl: 32px` (`p-space-xl`, `gap-space-xl`, etc.)
  - `--spacing-space-2xl: 48px` (`p-space-2xl`, `gap-space-2xl`, etc.)
- **Icons**: Google Material Symbols Outlined (`.material-symbols-outlined` in `frontend/src/index.css` with `font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24`).
- **Brand lockup**: `<BrandLogo />` (`frontend/src/components/BrandLogo.jsx`) is the single source of the header identity: primary rounded-square with the `school` glyph in `tertiary-fixed`, amber status dot, and `font-headline-sm` “Aralytics” in `text-on-surface`. Use it on every public/auth/student header and in the teacher `Sidebar`; do not hand-roll alternate logo marks, and do not place it (or a duplicate wordmark) in any footer. Every logo links to the public landing page (`/`). There is no EN/FIL language switcher anywhere in the product.
- **Teacher responsive breakpoint**: because the fixed sidebar consumes 250px from 1024px up, teacher multi-column grids and split headers switch at `xl` (1280px), not `lg`. Dense teacher tables use `min-w` + horizontal scroll below `xl`.

> **CRITICAL CSS RULE**: Never put a literal `*/` inside a CSS block comment in `frontend/src/index.css` (e.g., use `[all-screens]` instead of `*` followed by `/`), as that prematurely terminates the comment and breaks the Tailwind CSS parser.

---

## 4. Screen & Route Map

| Route | Component | Source Stitch Export | Layout Chrome |
|---|---|---|---|
| `/` | `frontend/src/screens/public/LandingPage.jsx` | `screens/stitch/landing_page/code.html` | Standalone (Public Marketing Header + Footer) |
| `/login` | `frontend/src/screens/public/LoginScreen.jsx` | `screens/stitch/aralytics_login/code.html` | Standalone (Auth Header + Split Card + Footer) |
| `/register` | `frontend/src/screens/public/AccountActivationScreen.jsx` | `screens/stitch/aralytics_account_registration_activation/code.html` | Standalone (Auth Header + Split Card + Footer) |
| `/student/dashboard` | `frontend/src/screens/student/StudentDashboard.jsx` | `screens/stitch/portal/code.html` | Standalone (Student Portal Header + Mobile Nav + Footer) |
| `/student/activities` | `frontend/src/screens/student/StudentMyActivities.jsx` | `screens/stitch/aralytics_student_my_activities/code.html` | Standalone (Student Activities Header + Mobile Nav + Footer) |
| `/student/quiz` | `frontend/src/screens/student/StudentLiveQuiz.jsx` | `screens/stitch/aralytics_student_live_quiz_code_scenario/code.html` | Standalone (Student Quiz Header + Sticky Submit Footer) |
| `/student/feedback` | `frontend/src/screens/student/StudentDiagnosticReport.jsx` | `screens/stitch/aralytics_instant_ai_feedback_diagnostic_report/code.html` | Standalone (Student Feedback Header + Practice Modal + Footer) |
| `/student/progress` | `frontend/src/screens/student/StudentProgressHistory.jsx` | `screens/stitch/aralytics_student_feedback_history_progress/code.html` | Standalone (Student Progress Header + Diagnostic Modal + Footer) |
| `/teacher/dashboard` | `frontend/src/screens/teacher/TeacherDashboard.jsx` | `screens/stitch/aralytics_teacher_desktop_dashboard/code.html` | `AppShell` (`Sidebar` + `TopBar`) |
| `/teacher/students` | `frontend/src/screens/teacher/StudentsMasteryRoster.jsx` | `screens/stitch/aralytics_students_mastery_roster/code.html` | `AppShell` (`Sidebar` + `TopBar`) |
| `/teacher/activities` | `frontend/src/screens/teacher/ActivitiesQuizManagement.jsx` | `screens/stitch/aralytics_activities_quiz_management/code.html` | `AppShell` (`Sidebar` + `TopBar`) |
| `/teacher/reports` | `frontend/src/screens/teacher/ClassReportsLearningAnalytics.jsx` | `screens/stitch/reports/code.html` | `AppShell` (`Sidebar` + `TopBar`) |
| `/teacher/settings` | `frontend/src/screens/teacher/TeacherClassroomSettings.jsx` | `screens/stitch/teacher_settings/code.html` | `AppShell` (`Sidebar` + `TopBar`) |

### Backwards-Compatible Redirects (`frontend/src/App.jsx`)
- `/home` and `/student` -> `/student/dashboard`
- `/student/diagnostic-report` -> `/student/feedback`
- `/teacher` and `/dashboard` -> `/teacher/dashboard`
- `/students` -> `/teacher/students`
- `/activities` -> `/teacher/activities`
- `/reports` -> `/teacher/reports`
- `/settings` -> `/teacher/settings`

---

## 5. Layout Architecture (`AppShell` vs Standalone)

- **Teacher View Screens** (`/teacher/dashboard`, `/teacher/students`, `/teacher/activities`, `/teacher/reports`, `/teacher/settings`) share the exact same 240px left `<aside>` (`Sidebar.jsx`) and 64px sticky `<header>` (`TopBar.jsx`). `AppShell.jsx` renders both, plus a responsive mobile slide-over drawer (`lg:hidden`) triggered by a hamburger button in `TopBar.jsx`, and wraps children in `<main className="lg:ml-[240px] flex-1 p-6 lg:p-space-xl max-w-[1600px]">`.
  - Therefore, the 5 teacher screen components in `frontend/src/screens/teacher/` render **only the inner content of `<main>`** (from the Page Header `<div>` through the end of `<main>`), plus any screen-specific modals/drawers.
- **Public & Auth Screens** (`/`, `/login`, `/register` in `frontend/src/screens/public/`) and **Student View Screens** (`/student/*` in `frontend/src/screens/student/`) use their own standalone headers and footers from their respective Stitch exports and bypass `AppShell` in `frontend/src/App.jsx`. Each Student View screen preserves its exact Stitch top navigation bar while wiring all links to `/student/*` and `/login` and providing a responsive `xl:hidden` hamburger menu for smaller screens.

---

## 6. Rules for Modifying or Adding Screens

1. **Preserve Stitch Fidelity**: Keep all exact copy, statistics, Filipino/English code-switching examples (`Kumusta, Miguel!`, `G. Santos`, `Maria Clara R.`, `Juan Dela Cruz`), SVG illustrations, and Tailwind classes from `screens/stitch/*/code.html`.
2. **React/JSX Cleanliness**:
   - Convert `class` -> `className`, `for` -> `htmlFor`, `tabindex` -> `tabIndex`, SVG `stroke-width` -> `strokeWidth`, `stroke-dasharray` -> `strokeDasharray`, `stroke-dashoffset` -> `strokeDashoffset`, `stroke-linecap` -> `strokeLinecap`, `fill-rule` -> `fillRule`, `clip-rule` -> `clipRule`.
   - Convert inline `<script>` handlers (`onclick="..."`, `onsubmit="..."`) into idiomatic React `useState` state and event handlers. Never use `window.alert` or `window.confirm`.
   - Always clean up `setTimeout` / `setInterval` timers on unmount via `useEffect` + `useRef`.
3. **Resilient Remote Avatars**: Any external `lh3.googleusercontent.com` `<img>` must include `onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }}` inside a styled fallback container so offline/blocked requests degrade gracefully.
4. **Update Documentation**: Every time you complete a change, append an entry to [`LOG.md`](./LOG.md) and update [`FILETREE.md`](./FILETREE.md) + [`HANDOFF.md`](./HANDOFF.md) if routes, files, or architecture changed.
