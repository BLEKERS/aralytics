# Aralytics

AI-powered diagnostic feedback and mastery analytics for Python / CS classrooms in Philippine schools.

## Summary

Aralytics is an AI-supported coding education platform that gives students personalized diagnostic feedback on quizzes and coding scenarios, and gives teachers class dashboards, mastery rosters, and learning analytics. The **core MVP is fully implemented**: the React frontend (13 routed screens with React 19 + Vite 8 + Tailwind CSS v4) is wired to the Spring Boot backend, covering fixed-key account activation, stateless JWT auth, teacher activity authoring, the student quiz lifecycle with durable drafts, deterministic scoring with mock AI diagnostic feedback, student/teacher dashboards, notifications, persistent teacher settings, feedback history and practice drills, and CSV/PDF report exports — all backed by MySQL. The only post-MVP item still open is replacing the deterministic mock diagnostic engine with a live LLM. See [PRD.md](./PRD.md) for the product scope and [backend/README.md](./backend/README.md) for the API surface.

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
| Backend | Spring Boot `3.4.13`, Java `21` | `backend/`; Maven wrapper, Spring Web/JPA/Security/Validation/Actuator |
| Database | MySQL `8`, Flyway `10` | ERD schema in `backend/src/main/resources/db/migration`; dev-only seed |
| Auth | Spring Security + JJWT `0.12.7` | Stateless HS256 JWT, BCrypt, fixed-key activation (no public signup) |
| API docs | springdoc `2.8.17` | Swagger UI only under the `dev` profile |
| Backend tests | JUnit 5, MockMvc, Testcontainers | `./mvnw verify` in `backend/`; MySQL migration IT is Docker-gated |

A live AI model is not connected yet: the diagnostic engine is deterministic for this milestone,
with an adapter stub that falls back to it. See [backend/README.md](./backend/README.md).

## Documentation

| Document | Description |
|---|---|
| [SETUP.md](./SETUP.md) | Quick-start, available commands, and demo credentials |
| [backend/README.md](./backend/README.md) | Backend setup, environment variables, API map, design decisions, and tests |
| [PRD.md](./PRD.md) | Product requirements and implementation status |
| [docs/architecture.md](./docs/architecture.md) | Architecture notes (planned backend and AI service) |
| [docs/requirements.md](./docs/requirements.md) | Functional / non-functional requirements breakdown |
| [docs/team-roles.md](./docs/team-roles.md) | Team roles and responsibilities |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | Contribution guidelines and branch conventions |
| [NAVIGATION.md](./NAVIGATION.md) | Screen routes, navigation graph, and planned `/api/*` endpoint map |
| [HANDOFF.md](./HANDOFF.md) | Architecture, design tokens, and Stitch-to-React conversion rules |
| [FILETREE.md](./FILETREE.md) | Complete directory and file purpose map |
| [LOG.md](./LOG.md) | Chronological append-only log of project changes |

## Getting Started

### Prerequisites

- JDK 21+ and Node.js 20+ / npm 10+
- MySQL 8 reachable on port 3306 or 3307, or Docker
- `GMAIL_USERNAME` and `GMAIL_APP_PASSWORD` set in your environment. The backend `dev` profile sends password-reset email through Gmail SMTP and **will not start without them** — no defaults are committed. Use a Gmail App Password, not your account password.

```powershell
$env:GMAIL_USERNAME="you@gmail.com"
$env:GMAIL_APP_PASSWORD="your-16-character-app-password"
```

You can also copy `backend/.env.example` to `backend/.env` and fill the values there; `docker compose` reads it automatically.

### One-click launch (Windows)

If `run-app.bat` exists in the repository root (it is a local-only helper and is not committed), double-click it. It checks Java 17+, Node.js, `frontend/node_modules` (installing if missing), and MySQL on port 3306/3307, prompts for the Gmail variables if they are not already set, then opens two windows: the Spring Boot API on `http://localhost:8080` and the Vite frontend on `http://localhost:3000`. Close those windows to stop the app.

To run only the environment check:

```powershell
powershell -ExecutionPolicy Bypass -File .\check-env.ps1
```

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

The login screen pre-fills the seeded demo credentials (student `miguel@school.edu.ph` / `student123`, teacher `maria.santos@university.edu.ph` / `teacher123`) and authenticates against the real API. They come from the local `seed` profile only — change them before any real deployment. See [SETUP.md](./SETUP.md).

### Backend

Requires JDK 21+ and MySQL 8 (or Docker). The API runs at `http://localhost:8080`.

```powershell
cd backend
docker compose up --build      # MySQL + API with the prod profile (JWT_SECRET required)
```

Or run against a local MySQL with the Maven wrapper:

```powershell
cd backend
$env:JAVA_HOME="C:\Program Files\Java\jdk-21"
.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=dev,seed"
.\mvnw.cmd -B verify           # unit + integration tests
```

Configuration is environment-driven; copy `backend/.env.example` to `backend/.env`. The `dev`
profile sends password-reset email through Gmail SMTP, so it **requires `GMAIL_USERNAME` and
`GMAIL_APP_PASSWORD` to be set** (no defaults are committed) — the backend will not start without
them. The `test` profile needs neither. Swagger is available at `/swagger-ui.html` and health at
`/actuator/health` under the dev profile; the demo data needs the `seed` profile. Demo credentials, API routes, the security model, and endpoint coverage are documented in [backend/README.md](./backend/README.md).

## Branching & Workflow

Work targets `main`; create branches as `feature/<issue>-<short-name>` for new work or `fix/<issue>-<short-name>` for bugs. Full process, commit expectations, and review steps: [CONTRIBUTING.md](./CONTRIBUTING.md).

## Team

| Name | Role |
|---|---|
| Dassel Bacaltos | Frontend Deveoper |
| James Dela Peña | Backend Developer |
| Kharl Christian Tumamak | DevOps |

_Add team members here._

## Task Board

- Repository: https://github.com/dassel-avg-dev/aralytics
- Task board: _Paste GitHub Projects / task board link here._
