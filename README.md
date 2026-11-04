# Aralytics

AI-powered diagnostic feedback and mastery analytics for Python / CS classrooms in Philippine schools.

## Summary

Aralytics is an AI-supported coding education platform that gives students personalized diagnostic feedback on quizzes and coding scenarios, and gives teachers class dashboards, mastery rosters, and learning analytics. The repository currently contains a **responsive frontend prototype only**: 13 routed screens built with React 19 + Vite 8 + Tailwind CSS v4. Login, account activation, data, reports, and AI feedback are demo UI with sample client-side data; a backend, real authentication, durable storage, and a live AI model are planned but not yet connected. See [PRD.md](./PRD.md) for the intended product versus current state.

## Problem

Students learning to code often receive feedback that is generic or arrives too late to help them understand a mistake. When they cannot identify which concept or line of reasoning failed, they may lose confidence and stop engaging. Teachers handling large classes cannot always provide individualized feedback or quickly spot the concepts that need reteaching. Aralytics aims to make useful diagnostic feedback available quickly and give teachers actionable evidence for follow-up, without replacing teacher judgment.

## Users

- **Student — Miguel, 16**: high-school student learning Python who wants to know what went wrong, how to reason about the correction, and what to practice next.
- **Teacher — Mr. Reyes, 35**: CS/coding teacher who creates activities, reviews class and individual results, identifies students below a mastery threshold, and targets personal intervention.
- **School Administrator — Dr. Santos, 50**: principal or academic lead who evaluates learning outcomes, teacher workload, student privacy, and subscription value; a buyer and provisioning stakeholder, not a separate in-product role.

## Features (13 screens)

### Public & Auth (`frontend/src/screens/public/`)

| Route | Purpose |
|---|---|
| `/` | Product landing page and pilot inquiry entry point |
| `/login` | Student/Teacher demo login |
| `/register` | Institution-code and issued-key account activation flow UI |

### Student View (`frontend/src/screens/student/`)

| Route | Purpose |
|---|---|
| `/student/dashboard` | Student home: assigned work, streak/XP, learning overview |
| `/student/activities` | Assigned, remedial, upcoming, and completed activities |
| `/student/quiz` | Live quiz / coding scenario and answer selection |
| `/student/feedback` | Diagnostic report and practice-drill UI |
| `/student/progress` | Feedback history and progress analytics |

### Teacher View (`frontend/src/screens/teacher/`, shared `AppShell` layout)

| Route | Purpose |
|---|---|
| `/teacher/dashboard` | Class KPIs, mastery overview, and flagged students |
| `/teacher/students` | Student roster and mastery detail |
| `/teacher/activities` | Activity/quiz management and create-activity drawer |
| `/teacher/reports` | Cohort reports and learning analytics |
| `/teacher/settings` | Classroom, grading, and diagnostic tone settings |

## Tech Stack

| Layer | Package / Version | Notes |
|---|---|---|
| Framework | `react@^19`, `react-dom@^19` | Functional components + hooks only |
| Routing | `react-router-dom@^7` | SPA with 13 routes in `frontend/src/App.jsx` |
| Build tool | `vite@^8` | Dev server at `http://localhost:3000` |
| Styling | `tailwindcss@^4` + `@tailwindcss/vite` | Tokens configured via `@theme` in `frontend/src/index.css` |
| Linter | `oxlint` | `npm run lint` inside `frontend/` |

Backend, database, authentication, and AI services: planned (see `PRD.md` and `NAVIGATION.md`).

## Documentation

| Document | Description |
|---|---|
| [SETUP.md](./SETUP.md) | Quick-start, available commands, and demo credentials |
| [PRD.md](./PRD.md) | Product requirements; prototype vs. production scope |
| [docs/architecture.md](./docs/architecture.md) | Architecture notes (planned backend and AI service) |
| [docs/requirements.md](./docs/requirements.md) | Functional / non-functional requirements breakdown |
| [docs/team-roles.md](./docs/team-roles.md) | Team roles and responsibilities |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | Contribution guidelines and branch conventions |
| [NAVIGATION.md](./NAVIGATION.md) | Screen routes, navigation graph, and planned `/api/*` endpoint map |
| [HANDOFF.md](./HANDOFF.md) | Architecture, design tokens, and Stitch-to-React conversion rules |
| [FILETREE.md](./FILETREE.md) | Complete directory and file purpose map |
| [LOG.md](./LOG.md) | Chronological append-only log of project changes |

## Getting Started

Requires Node.js v20+ and npm v10+.

```powershell
cd frontend
npm install
npm run dev   # http://localhost:3000
```

Other commands (run inside `frontend/`, or from the root with `npm --prefix frontend`):

```powershell
npm run lint    # oxlint across frontend/src/
npm run build   # production bundle into frontend/dist/
```

Demo mode sign-in accepts any non-empty credentials and routes to the Student or Teacher view based on the selected role tab. Demo credentials and activation examples are for local development only — do not use them in production. See [SETUP.md](./SETUP.md).

## Branching & Workflow

Work targets `main`; create branches as `feature/<issue>-<short-name>` for new work or `fix/<issue>-<short-name>` for bugs. Full process, commit expectations, and review steps: [CONTRIBUTING.md](./CONTRIBUTING.md).

## Team

| Name | Role | GitHub |
|---|---|---|
| | | |

_Add team members here._

## Task Board

- Repository: https://github.com/dassel-avg-dev/aralytics
- Task board: _Paste GitHub Projects / task board link here._
