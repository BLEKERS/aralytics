# Aralytics Backend

Spring Boot REST API for Aralytics: fixed-key account activation, stateless JWT auth, password reset and profile management, pilot inquiry capture, teacher activity authoring, the student quiz lifecycle with durable drafts, synchronous diagnostic feedback with practice drills, notifications, persistent teacher settings, CSV/PDF report exports, and student/teacher dashboards. Deferred post-MVP endpoints answer **501 Not Implemented** instead of returning fabricated data.

- **Java 21**, **Spring Boot 3.4.13**, Maven wrapper (`./mvnw` / `mvnw.cmd`)
- **PostgreSQL 16** via Spring Data JPA + **Flyway** migrations (`ddl-auto: validate`)
- **Spring Security** with BCrypt and JJWT 0.12.7 (stateless bearer tokens)
- **Bean Validation**, RFC 7807 problem responses, springdoc OpenAPI (dev profile only)
- **JUnit 5 + MockMvc + Testcontainers** (`./mvnw verify`)

## Layout

```text
backend/
├── src/main/java/ph/aralytics/backend/
│   ├── ai/            # DiagnosticEngine, deterministic MockDiagnosticEngine, LLM stub adapter
│   ├── config/        # Security, CORS, Jackson, OpenAPI, ProductionConfigGuard, @ConfigurationProperties
│   ├── domain/        # JPA entities matching the ERD + drafts, settings, reset tokens, pilot inquiries
│   ├── exception/     # API exceptions (incl. 429/501) + RFC 7807 GlobalExceptionHandler
│   ├── repository/    # Spring Data repositories
│   ├── security/      # JWT service/filter, denylist, AuthRateLimiter, UserDetails adapter
│   ├── service/       # Auth, password reset, quizzes, durable drafts, submissions, diagnostics, reports, settings, notifications
│   └── web/           # auth, public, student, teacher, notifications controllers + DTOs
├── src/main/resources/
│   ├── application.yml, application-dev.yml, application-prod.yml, application-seed.yml
│   ├── db/migration/V1__init_postgres.sql          # ERD schema (Flyway)
│   ├── db/seed/V2__seed_dev_postgres.sql           # demo data (`seed` profile only)
│   └── db/migration_mysql_legacy/                  # preserved MySQL history, not on the Flyway classpath
├── src/test/          # H2-backed MockMvc ITs + Docker-gated PostgreSQL migration IT
└── docker/            # postgres-init.sql (creates aralytics + aralytics_prod)
```

## Quick start

All run modes read the single root `.env` file (copied from root `.env.example`):

- `ENV=development` (default): Spring profiles `dev,seed` on `aralytics` DB (`V1` + `V2` seed, Swagger UI on, frontend demo prefill on).
- `ENV=production`: Spring profile `prod` on `aralytics_prod` DB (`V1` schema only, Swagger UI off, `ProductionConfigGuard` enforced, frontend demo prefill off).

To switch modes, edit `ENV=` in root `.env` and restart the app (`docker compose up -d` or restart Maven + Vite).

### Option A — Docker Compose (PostgreSQL + Backend API)

Run `docker compose` from the **repository root** (reads root `.env` automatically):

```powershell
# From repo root:
Copy-Item .env.example .env   # set ENV=development or ENV=production (plus JWT_SECRET >= 32 bytes for production)
docker compose up -d --build  # start postgres + backend (rebuild after Java edits)
npm --prefix frontend run dev # optional: start React dev server on http://localhost:3000
docker compose down           # stop containers
```

The API listens on `http://localhost:8080`; PostgreSQL 16 is exposed on `localhost:5432`. Fresh Docker volumes auto-create both `aralytics` and `aralytics_prod` via `backend/docker/postgres-init.sql`. If you already have a pre-existing `postgres_data` Docker volume from earlier runs, create `aralytics_prod` once inside the container (`docker exec aralytics-postgres psql -U postgres -c "CREATE DATABASE aralytics_prod;"`) or recreate the volume (`docker compose down -v`).

### Option B — Local Maven + PostgreSQL 16

1. Install PostgreSQL 16 (or run only the database from the repo root with `docker compose up -d postgres`), then
   ensure the databases exist:

   ```sql
   CREATE DATABASE aralytics;       -- used when ENV=development (dev,seed)
   CREATE DATABASE aralytics_prod;  -- used when ENV=production (prod)
   ```

   The default local credentials are `postgres` / `postgres`; override them with `DB_USERNAME` and
   `DB_PASSWORD` if your installation uses different values. MySQL 5.5/8 is no longer the target.

2. Load the root `.env` file and run Spring Boot (`ENV` in `.env` selects `dev,seed` vs `prod`):

   ```powershell
   cd backend
   Get-Content ..\.env | Where-Object { $_ -match '^[A-Za-z_][A-Za-z0-9_]*=.+' } | ForEach-Object { $k,$v = $_ -split '=',2; Set-Item "Env:$k" $v }
   .\mvnw.cmd spring-boot:run
   ```

   *(Empty `GMAIL_USERNAME` / `GMAIL_APP_PASSWORD` values in `dev` default cleanly to blank; in `production`, `ProductionConfigGuard` enforces a non-default `JWT_SECRET` of at least 32 bytes.)*

   URLs:
   - Swagger UI (`dev` only): <http://localhost:8080/swagger-ui.html>
   - OpenAPI JSON (`dev` only): <http://localhost:8080/v3/api-docs>
   - Readiness / Health: <http://localhost:8080/actuator/health/readiness> (`/actuator/health` is `UP` in `prod`, or in `dev` once Gmail SMTP credentials are valid)

3. Stop with `Ctrl+C`, edit `ENV` in root `.env`, and re-load `.env` in a fresh PowerShell session when switching modes. Flyway applies `V1__init_postgres.sql` everywhere; `V2__seed_dev_postgres.sql` is added only under `seed` and refused in `prod`.

### Option C — One-click Windows launcher (`run-app.bat`)

From the repository root, double-click `run-app.bat` (or run `.\run-app.bat`). It runs `check-env.ps1`, loads root `.env` (`ENV=development|production`), and opens both the Spring Boot backend (`:8080`) and Vite frontend (`:3000`) against local PostgreSQL 16.

### Demo credentials (dev seed)

| Role | Identifier | Password |
|---|---|---|
| Teacher | `maria.santos@university.edu.ph` or `t2024-0104` | `teacher123` |
| Student | `miguel@school.edu.ph` or `s2024-9102` | `student123` |

Institution code `STJUDE-MNL-2025`; issued keys `FAC-2025-DEPED` (teacher) and
`KEY-8821-PY` (student). These are hashed per school in the `SCHOOL` table by the dev seed — never
reuse them in a real deployment.

## Configuration

All runtime configuration is environment-overridable via the root `.env` (see root `.env.example`):

| Variable | Default | Purpose |
|---|---|---|
| `ENV` | `development` | `development` activates profile group `dev,seed` (`aralytics`); `production` activates `prod` (`aralytics_prod`) |
| `SERVER_PORT` | `8080` | HTTP port |
| `DB_HOST` / `DB_PORT` | `localhost` / `5432` | PostgreSQL host and port (Compose overrides `DB_HOST=postgres`) |
| `DB_URL` | `jdbc:postgresql://${DB_HOST}:${DB_PORT}/aralytics` | JDBC URL (defaults to `aralytics` in `dev` and `aralytics_prod` in `prod`) |
| `DB_USERNAME` / `DB_PASSWORD` | `postgres` / `postgres` | Database credentials |
| `DB_POOL_SIZE` | `10` | Hikari maximum pool size |
| `JWT_SECRET` | dev-only placeholder | HS256 signing key, **≥ 32 bytes**; `prod` refuses the placeholder |
| `JWT_EXPIRATION_MINUTES` | `120` | Token lifetime |
| `ACTIVATION_TOKEN_TTL_MINUTES` | `15` | Single-use activation-token lifetime |
| `PASSWORD_RESET_TTL_MINUTES` | `15` | Password-reset token lifetime |
| `GMAIL_USERNAME` / `GMAIL_APP_PASSWORD` | _(empty)_ | Optional Gmail SMTP credentials for password-reset emails under `dev` |
| `INTERVENTION_THRESHOLD` | `70` | Mastery percentage below which a student is flagged |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:3000` | Allowed browser origins (comma-separated) |
| `FRONTEND_BASE_URL` | `http://localhost:3000` | Base URL embedded in password-reset links |
| `SPRING_PROFILES_ACTIVE` | `${ENV:development}` | Driven by `ENV` via profile groups (`development`→`dev,seed`, `production`→`prod`); `ai` enables the LLM adapter |
| `AI_BASE_URL` | _(empty)_ | Base URL for the `ai` profile adapter; empty or failure falls back to the mock engine |

Profiles:

- **default** — migrations only, Swagger disabled, mock diagnostic engine.
- **dev** — migrations + Swagger UI, debug logging for `ph.aralytics.backend`.
- **seed** — adds the demo rows; used as `dev,seed` locally and refused in `prod`.
- **prod** — migrations only, Swagger disabled, INFO logging, rejects the default JWT secret.
- **ai** — swaps in `LlmDiagnosticEngine`, which POSTs the scored request to
  `${AI_BASE_URL}/diagnose` and falls back to the mock engine on timeout/failure. No real
  model is wired yet.

## API map

All request/response bodies are JSON. Authenticated routes require
`Authorization: Bearer <token>`. Errors are RFC 7807 `application/problem+json`.

### Public & auth

| Method | Path | Auth | Notes |
|---|---|---|---|
| `POST` | `/api/auth/verify-key` | public | `{institutionCode, accessKey, role}` → single-use `activationToken`, role, school name. No account is created. Rate-limited (`429`). |
| `POST` | `/api/auth/activate` | public | `{activationToken, fullName, email, password, username?}` → `201` + JWT, user, classes. Links the new account to a class/enrollment. |
| `POST` | `/api/auth/login` | public | `{identifier, password}` where identifier is email or username → JWT, user, classes. Rate-limited (`429`). |
| `POST` | `/api/auth/forgot-password` | public | `{email}` → `204`; issues a short-lived reset token and sends reset email when SMTP is configured. |
| `POST` | `/api/auth/reset-password` | public | `{token, newPassword}` → `204`; consumes the reset token and updates the password hash. |
| `POST` | `/api/auth/logout` | bearer | `204`; adds the JWT to an in-memory denylist. |
| `GET` | `/api/auth/me` | bearer | Current user, school, and linked classes. |
| `GET` | `/api/auth/profile` | bearer | Read current user's profile details. |
| `PUT` | `/api/auth/profile` | bearer | Update current user's profile details. |
| `PUT` | `/api/auth/profile/password` | bearer | Change password (verifies current password). |
| `POST` | `/api/public/pilot-inquiry` | public | `201`; validates and persists a landing-page pilot inquiry to `PILOT_INQUIRY`. |

### Student

| Method | Path | Notes |
|---|---|---|
| `GET` | `/api/student/dashboard` | Assigned/completed counts, recent scores, 7-day streak, concept mastery. |
| `GET` | `/api/student/progress` | Concept mastery for the authenticated student. |
| `GET` | `/api/student/progress/history?search=` | Past submissions with feedback status, searchable by quiz title. |
| `GET` | `/api/student/activities?category=all\|assigned\|remedial\|completed` | Published activities for the student's classes, with score/submission status. |
| `GET` | `/api/student/quiz/{quizId}` | Published quiz for an enrolled student. **Never includes `correctAnswer`**; includes any saved draft answers. |
| `PATCH` | `/api/student/quiz/{quizId}/answer` | `{questionId, selectedOption}`; idempotent durable draft save (`QUIZ_DRAFT`). |
| `POST` | `/api/student/quiz/{quizId}/submit` | `{answers:[{questionId, selectedOption}]}`; deterministic scoring + feedback. `200` when feedback is READY, `202` when PENDING. Second submission → `409`. |
| `GET` | `/api/student/feedback/{submissionId}` | Owner-only feedback; `202` + `status=PENDING` while generation is outstanding. |
| `POST` | `/api/student/feedback/{submissionId}/retry` | Re-runs feedback generation; `200`/`202`. |
| `POST` | `/api/student/feedback/{submissionId}/practice-drill` | Generates a 3-question practice drill targeting weak concepts from the feedback. |
| `GET` | `/api/student/notifications` | In-app notifications for the authenticated student, newest first. |

### Teacher

| Method | Path | Notes |
|---|---|---|
| `GET` | `/api/teacher/activities?status=DRAFT\|PUBLISHED\|CLOSED\|all&topic=` | The teacher's own activities. |
| `POST` | `/api/teacher/activities` | Create a DRAFT with questions, options, correct option key, points, and concept names. |
| `PATCH` | `/api/teacher/activities/{activityId}` | Update a DRAFT (ownership enforced). |
| `POST` | `/api/teacher/activities/{activityId}/publish` | DRAFT → PUBLISHED; makes it visible to enrolled students. |
| `GET` | `/api/teacher/dashboard?section=&concept=` | Cohort KPIs, completion rate, students below the intervention threshold, class concept mastery. |
| `GET` | `/api/teacher/students?search=&topic=&status=below\|above&page=1&size=20` | Paginated roster restricted to the teacher's own students. |
| `GET` | `/api/teacher/students/{studentId}` | Student deep-dive: average, concept mastery, feedback delivered to the student. |
| `GET` | `/api/teacher/students/{studentId}/diagnostic` | Same diagnostic drill-down (alias used by the frontend). |
| `GET` | `/api/teacher/reports/export-csv?topic=` | Download class roster and scores as UTF-8 CSV. |
| `GET` | `/api/teacher/reports/export-pdf?section=&topic=` | Download cohort analytics PDF. |
| `GET` / `PUT` | `/api/teacher/settings` | Read or update persisted teacher settings (intervention threshold, feedback tone; creates defaults on first read). |
| `GET` | `/api/teacher/notifications` | In-app notifications for the authenticated teacher, newest first. |

Deferred teacher routes (return **501 Not Implemented**): `POST /api/teacher/activities/ai-generate`,
`POST /api/teacher/diagnostics/run`, `GET /api/teacher/dashboard/export-csv`,
`POST /api/teacher/students/{studentId}/nudge`, `POST /api/teacher/students/batch-nudge`,
`PUT /api/teacher/students/{studentId}/private-log`.

## Security model

- **No public signup.** `verify-key` requires a school `institutionCode` that exists in `SCHOOL`
  plus the role's issued access key. Keys are compared in constant time. A short-lived,
  single-use activation token is returned; `activate` consumes it and hashes the password with
  BCrypt (cost 10).
- **Stateless JWT** (`HS256`, `sub` = user id, `role`, `schoolId`). `JwtFilter` validates the
  signature/expiry and rejects denylisted tokens. There are no server sessions.
- **Role rules** are enforced twice: route rules in `SecurityConfig` (`/api/student/**` →
  `ROLE_STUDENT`, `/api/teacher/**` → `ROLE_TEACHER`) and `@PreAuthorize` on every handler.
- **Ownership checks** live in the service layer as well as the controllers: teachers can only
  read/edit their own activities and students; students can only read their own submissions,
  feedback, and drafts; submissions require enrollment in the quiz's class.
- **401/403 are JSON**, produced by a custom `AuthenticationEntryPoint` / `AccessDeniedHandler`
  and `GlobalExceptionHandler`, never an HTML error page.
- **Auth rate limiting**: `AuthRateLimiter` caps failed public auth attempts at 5 per IP + identifier
  per minute (`429 Too Many Requests`).
- CORS allows only the configured frontend origins and disallows credentialed requests, since
  the JWT travels in the `Authorization` header.

## Data model & design decisions

- `V1__init_postgres.sql` is the schema authority: 19 tables covering the ERD plus the later
  activation/settings/draft/inquiry tables. The physical user table is `app_user` because `USER` is
  reserved in PostgreSQL; the former MySQL migrations are preserved under
  `db/migration_mysql_legacy` but are not on the Flyway classpath.
- Two additive pieces were needed beyond the base ERD and are called out in the migration:
  `SCHOOL.institutionCode` (unique; used by activation) and `QUESTION_CONCEPT` (per-question
  concept tags required by the diagnostic engine).
- `QUESTION.options` is a JSON array of `{ "key": "A", "text": "..." }`; `correctAnswer` stores
  the option key, so option text is never leaked with the answer key.
- Feedback is PENDING when no `FEEDBACK` row exists yet. Submission returns synchronously after
  generation; if generation fails, the row is absent and the student can `retry`. Concept
  mastery is upserted into `PROGRESS_RECORD` per concept.
- Scores are never recomputed from the client. The server reloads questions, validates that
  every answer belongs to the quiz, allows omitted answers (scored as incorrect), rejects
  duplicate `questionId`s, and computes `earned/total` as a percentage.
- camelCase column names are preserved with `PhysicalNamingStrategyStandardImpl`; PostgreSQL folds
  unquoted identifiers to lowercase. Hibernate auto-detects the dialect and `ddl-auto: validate`
  checks the Flyway schema at startup. `QUESTION.options` uses VARCHAR/TEXT JSON (not `jsonb`) so
  H2 in PostgreSQL mode can run the MockMvc tests.

### Diagnostic engines

`DiagnosticEngine` is a small interface (`DiagnosticRequest` in, `FeedbackResult` out) so the
feedback source can change without touching services:

- `MockDiagnosticEngine` (default, `!ai` profile): deterministic, offline, supportive English
  feedback. It derives 1–3 concepts from question metadata, falls back to
  `Python fundamentals`, caps output at 3 concepts, and never includes option text or the
  correct answer. Unit-tested for tone length (2–4 sentences) and no answer leakage.
- `LlmDiagnosticEngine` (`ai` profile): posts the already-scored request to an external
  `/diagnose` endpoint with 5s connect/read timeouts and falls back to the mock engine. No
  real model is connected in this milestone.

## Errors

`GlobalExceptionHandler` maps exceptions to RFC 7807 responses with `type`, `title`, `status`,
`detail`, `instance`, and a `timestamp`:

| Status | When |
|---|---|
| `400` | Validation failure, empty/duplicate/foreign answers, bad query parameters |
| `401` | Invalid credentials, expired/denylisted/missing token, invalid or reused activation token |
| `403` | Wrong role, teacher accessing another teacher's activity, student reading another student's feedback, non-enrolled student |
| `404` | Missing resource or a published-only route hit by a draft |
| `409` | Re-submitting an already-submitted quiz |
| `429` | Too many failed auth attempts (`AuthRateLimiter`: 5/min per IP + identifier) |
| `501` | Endpoint intentionally deferred beyond the current MVP |

## Tests

```powershell
cd backend
$env:JAVA_HOME="C:\Program Files\Java\jdk-21"   # JDK 21+
.\mvnw.cmd -B verify
```

| Test | What it covers |
|---|---|
| `MockDiagnosticEngineTest` | Feedback length, concept selection/cap, fallback, no answer leakage |
| `ReportServiceTest` | Roster CSV and cohort analytics PDF export generation |
| `AuthFlowIT` | verify-key → activate → me → login → logout → profile/password reset; invalid/reused activation tokens; 401/429 problem JSON |
| `PilotInquiryIT` | Public pilot-inquiry persistence and validation |
| `QuizLifecycleIT` | Teacher create/update/publish → student list/load/save draft/submit → feedback/dashboard; draft invisibility |
| `AuthorizationIT` | 401/403 boundaries, cross-teacher activity access, cross-student feedback access, roster isolation |
| `SubmitIdempotencyIT` | Second submit → 409, duplicate/empty/foreign answers → 400, non-enrolled/no-draft → 403/404 |
| `EndToEndPostgresTest` | Flyway applies all tables + dev seed on real PostgreSQL 16, then seeded login/submit/feedback pass (Docker-gated; skipped when Docker is unavailable) |

Functional ITs use H2 in PostgreSQL mode with Hibernate `create-drop` and an H2-compatible
`data.sql` so they run without Docker. `EndToEndPostgresTest` starts `postgres:16` through
Testcontainers and auto-skips when no Docker daemon is reachable, so run `verify` where Docker
exists to exercise the real migrations.

## Known limitations

These are intentional, documented gaps rather than silent failures:

- **Deferred teacher endpoints return 501**: AI activity generation (`ai-generate`), batch
  diagnostics (`diagnostics/run`), dashboard CSV export (`dashboard/export-csv`), student nudges
  (`nudge` / `batch-nudge`), and private teacher notes (`private-log`).
- **In-memory state**: JWT denylist (logout), single-use activation tokens, and `AuthRateLimiter`
  counters live in process memory. They reset on restart and are not shared across multiple
  instances; multi-instance production needs Redis (or DB tables). Quiz drafts are persisted in
  `QUIZ_DRAFT` (last-write-wins per student/quiz).
- **No refresh tokens**; clients re-authenticate when the JWT expires (default 2h).
- **Feedback generation is synchronous** on submit (mock engine is fast). A real model needs a
  queue/worker, retry policy, and observability; the `PENDING` + `retry` contract already
  supports that.
- **No admin role or subscription enforcement**; `SUBSCRIPTION` is modeled but not enforced.
- **Swagger is dev-only** and springdoc is not exposed in `prod`.
- **No Docker locally?** `EndToEndPostgresTest` is skipped, so run the migration test in CI where
  Docker is available.
