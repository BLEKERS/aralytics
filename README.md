# Aralytics

AI-powered diagnostic feedback and mastery analytics for Python / CS classrooms in Philippine schools.

## Summary

Aralytics is an AI-supported coding education platform that gives students personalized diagnostic feedback on quizzes and coding scenarios, and gives teachers class dashboards, mastery rosters, and learning analytics. The **core MVP is fully implemented**: the React frontend (13 routed screens with React 19 + Vite 8 + Tailwind CSS v4) is wired to the Spring Boot backend, covering fixed-key account activation, stateless JWT auth, teacher activity authoring, the student quiz lifecycle with durable drafts, deterministic scoring with mock AI diagnostic feedback, student/teacher dashboards, notifications, persistent teacher settings, feedback history and practice drills, and CSV/PDF report exports — all backed by PostgreSQL 16. The only post-MVP item still open is replacing the deterministic mock diagnostic engine with a live LLM. See [docs/PRD.md](./docs/PRD.md) for the product scope and [backend/README.md](./backend/README.md) for the API surface.

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
| Database | PostgreSQL `16`, Flyway `10` | ERD schema in `backend/src/main/resources/db/migration`; dev-only seed; legacy MySQL SQL kept under `db/migration_mysql_legacy` |
| Auth | Spring Security + JJWT `0.12.7` | Stateless HS256 JWT, BCrypt, fixed-key activation (no public signup) |
| API docs | springdoc `2.8.17` | Swagger UI only under the `dev` profile |
| Backend tests | JUnit 5, MockMvc, Testcontainers | `./mvnw verify` in `backend/`; PostgreSQL migration IT is Docker-gated |

A live AI model is not connected yet: the diagnostic engine is deterministic for this milestone,
with an adapter stub that falls back to it. See [backend/README.md](./backend/README.md).

## Documentation

| Document | Description |
|---|---|
| [docs/SETUP.md](./docs/SETUP.md) | Quick-start, available commands, and demo credentials |
| [backend/README.md](./backend/README.md) | Backend setup, `ENV=development\|production` configuration, API map, design decisions, and tests |
| [docs/PRD.md](./docs/PRD.md) | Product requirements and implementation status |
| [docs/architecture.md](./docs/architecture.md) | Architecture notes (planned backend and AI service) |
| [docs/requirements.md](./docs/requirements.md) | Functional / non-functional requirements breakdown |
| [docs/team-roles.md](./docs/team-roles.md) | Team roles and responsibilities |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | Contribution guidelines and branch conventions |
| [docs/NAVIGATION.md](./docs/NAVIGATION.md) | Screen routes, navigation graph, and planned `/api/*` endpoint map |
| [docs/HANDOFF.md](./docs/HANDOFF.md) | Architecture, design tokens, backend/frontend commands, and Stitch-to-React rules |
| [docs/FILETREE.md](./docs/FILETREE.md) | Complete directory and file purpose map |
| [docs/LOG.md](./docs/LOG.md) | Chronological append-only log of project changes |

## Getting Started

### Prerequisites

- JDK 21+ and Node.js 20+ / npm 10+
- PostgreSQL 16 reachable on port 5432, or Docker
- Copy the root `.env.example` to `.env` (`Copy-Item .env.example .env`). Both `docker compose` (at repo root) and Vite (`frontend/`) read this single `.env` automatically.
- `GMAIL_USERNAME` and `GMAIL_APP_PASSWORD` are optional in `ENV=development` (blank by default so the API starts without SMTP credentials; set a Gmail App Password, not your account password, to test password-reset email).

### One-click launch (Windows)

If `run-app.bat` exists in the repository root (it is a local-only helper and is not committed), double-click it. It loads variables from the root `.env` if present, checks Java 21+, Node.js, `frontend/node_modules` (installing if missing), and PostgreSQL on port 5432, optionally prompts for Gmail credentials in `development` mode if unset, then opens two windows: the Spring Boot API on `http://localhost:8080` (honoring `ENV`) and the Vite frontend on `http://localhost:3000`. Close those windows to stop the app.

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

When `ENV=development` during `npm run dev`, the login screen pre-fills the seeded demo credentials (student `miguel@school.edu.ph` / `student123`, teacher `maria.santos@university.edu.ph` / `teacher123`) and authenticates against the real API. They come from the local `seed` profile only — when `ENV=production` or building with `vite build`, demo credentials and seeded activation hints are omitted. See [docs/SETUP.md](./docs/SETUP.md).

### Backend (`ENV=development` vs `ENV=production`)

Requires JDK 21+ and PostgreSQL 16 (or Docker). The API runs at `http://localhost:8080`. One `ENV` variable in the root `.env` controls both backend and frontend and keeps `dev,seed` (`aralytics` DB, `V1` + `V2`) isolated from `prod` (`aralytics_prod` DB, `V1` only) so switching modes avoids Flyway validation conflicts:

- `ENV=development` (default): activates Spring profiles `dev,seed` on `aralytics` (Swagger UI + demo accounts).
- `ENV=production`: activates Spring profile `prod` on `aralytics_prod` (schema-only, Swagger disabled, `ProductionConfigGuard` enforced — `JWT_SECRET` must be >= 32 bytes).

```powershell
# Option 1: Docker Compose (at repo root — reads root .env automatically)
Copy-Item .env.example .env       # edit ENV=development or ENV=production
docker compose up -d --build      # starts postgres + backend
docker compose down               # stop containers
```

Fresh Docker volumes auto-create both `aralytics` and `aralytics_prod` via `backend/docker/postgres-init.sql`. If you already have a pre-existing `postgres_data` Docker volume from earlier runs, create `aralytics_prod` once manually:

```powershell
docker exec aralytics-postgres psql -U postgres -c "CREATE DATABASE aralytics_prod;"
```

Or run PostgreSQL in Docker and the backend locally via the Maven wrapper:

```powershell
# Option 2: Maven wrapper against Postgres on localhost:5432
docker compose up -d postgres     # from repo root
cd backend
Get-Content ..\.env | Where-Object { $_ -match '^[A-Za-z_][A-Za-z0-9_]*=.+' } | ForEach-Object { $k,$v = $_ -split '=',2; Set-Item "Env:$k" $v }
.\mvnw.cmd spring-boot:run

.\mvnw.cmd -B verify              # unit + integration tests
```

Under `dev`, Swagger is exposed at `/swagger-ui.html` and readiness at `/actuator/health/readiness`. Under `prod`, `/actuator/health` is exposed, Swagger returns `404`, and `JWT_SECRET` must be a unique secret of at least 32 bytes. Demo credentials, API routes, and security rules are documented in [backend/README.md](./backend/README.md).

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
