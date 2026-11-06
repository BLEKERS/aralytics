# Aralytics Backend (40% milestone)

Spring Boot REST API for Aralytics: fixed-key account activation, stateless JWT auth, teacher
activity authoring, the student quiz lifecycle, synchronous diagnostic feedback, and the
student/teacher dashboards. The 40% milestone is deliberately narrow: endpoints that the
frontend links to but that are not in this milestone answer **501 Not Implemented** instead of
returning fabricated data (see [Deferred endpoints](#deferred-endpoints-501)).

- **Java 21**, **Spring Boot 3.4.13**, Maven wrapper (`./mvnw` / `mvnw.cmd`)
- **MySQL 8** via Spring Data JPA + **Flyway** migrations (`ddl-auto: none`)
- **Spring Security** with BCrypt and JJWT 0.12.7 (stateless bearer tokens)
- **Bean Validation**, RFC 7807 problem responses, springdoc OpenAPI (dev profile only)
- **JUnit 5 + MockMvc + Testcontainers** (`./mvnw verify`)

## Layout

```text
backend/
├── src/main/java/ph/aralytics/backend/
│   ├── ai/            # DiagnosticEngine, deterministic MockDiagnosticEngine, LLM stub adapter
│   ├── config/        # Security, CORS, Jackson, OpenAPI, @ConfigurationProperties
│   ├── domain/        # JPA entities matching the ERD
│   ├── exception/     # API exceptions + RFC 7807 GlobalExceptionHandler
│   ├── repository/    # Spring Data repositories
│   ├── security/      # JWT service/filter, denylist, UserDetails adapter
│   ├── service/       # Auth, quiz authoring/taking, submissions, diagnostics, dashboards
│   └── web/           # auth, public, student, teacher controllers + DTOs
├── src/main/resources/
│   ├── application.yml, application-dev.yml, application-prod.yml
│   └── db/migration/V1__init.sql     # ERD schema (Flyway)
│   └── db/seed/V2__seed_dev.sql      # demo data, loaded only by the dev profile
└── src/test/          # H2-backed MockMvc ITs + Docker-gated MySQL migration IT
```

## Quick start

### Option A — Docker Compose (MySQL + API)

```powershell
cd backend
Copy-Item .env.example .env      # then edit secrets if needed
docker compose up --build
```

The API listens on `http://localhost:8080`; MySQL is exposed on `localhost:3306`. Compose starts
the app with `SPRING_PROFILES_ACTIVE=dev`, so the demo seed and Swagger UI are available.

### Option B — Local Maven + local MySQL

1. Create the database and a user (or point `DB_URL` at an existing MySQL 8 instance):

   ```sql
   CREATE DATABASE aralytics CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE USER 'aralytics'@'%' IDENTIFIED BY 'aralytics';
   GRANT ALL PRIVILEGES ON aralytics.* TO 'aralytics'@'%';
   ```

2. Run the app with the dev profile (schema + demo seed + Swagger):

   ```powershell
   cd backend
   $env:JAVA_HOME="C:\Program Files\Java\jdk-21"   # or any JDK 21+
   .\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=dev"
   ```

   Dev-only URLs:
   - Swagger UI: <http://localhost:8080/swagger-ui.html>
   - OpenAPI JSON: <http://localhost:8080/v3/api-docs>
   - Health: <http://localhost:8080/actuator/health>

3. Stop with `Ctrl+C`. Flyway applies `V1__init.sql` (and `V2__seed_dev.sql` only under `dev`)
   on startup; with `prod` the seed is never loaded.

### Demo credentials (dev seed)

| Role | Identifier | Password |
|---|---|---|
| Teacher | `maria.santos@university.edu.ph` or `t2024-0104` | `teacher123` |
| Student | `miguel@school.edu.ph` or `s2024-9102` | `student123` |

Institution code `STJUDE-MNL-2025`; issued keys `FAC-2025-DEPED` (teacher) and
`KEY-8821-PY` (student). These values exist only in the dev seed — never reuse them in a real
deployment.

## Configuration

All runtime configuration is environment-overridable (see `.env.example`):

| Variable | Default | Purpose |
|---|---|---|
| `SERVER_PORT` | `8080` | HTTP port |
| `DB_URL` | `jdbc:mysql://localhost:3306/aralytics?...` | JDBC URL |
| `DB_USERNAME` / `DB_PASSWORD` | `aralytics` / `aralytics` | Database credentials |
| `DB_POOL_SIZE` | `10` | Hikari maximum pool size |
| `JWT_SECRET` | dev-only placeholder | HS256 signing key, **≥ 32 bytes**; override in every deployment |
| `JWT_EXPIRATION_MINUTES` | `120` | Token lifetime |
| `ACTIVATION_STUDENT_KEY` / `ACTIVATION_TEACHER_KEY` | demo keys | Issued access keys checked by `verify-key` |
| `ACTIVATION_TOKEN_TTL_MINUTES` | `15` | Single-use activation-token lifetime |
| `INTERVENTION_THRESHOLD` | `70` | Mastery percentage below which a student is flagged |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:3000,http://localhost:5173` | Allowed browser origins |
| `SPRING_PROFILES_ACTIVE` | _(none)_ | `dev` adds seed + Swagger; `prod` disables both; `ai` enables the LLM adapter |
| `AI_BASE_URL` | _(empty)_ | Base URL for the `ai` profile adapter; empty or failure falls back to the mock engine |

Profiles:

- **default** — migrations only, Swagger disabled, mock diagnostic engine.
- **dev** — migrations + demo seed, Swagger UI, debug logging for `ph.aralytics.backend`.
- **prod** — migrations only, Swagger disabled, INFO logging.
- **ai** — swaps in `LlmDiagnosticEngine`, which POSTs the scored request to
  `${AI_BASE_URL}/diagnose` and falls back to the mock engine on timeout/failure. No real
  model is wired yet.

## API map

All request/response bodies are JSON. Authenticated routes require
`Authorization: Bearer <token>`. Errors are RFC 7807 `application/problem+json`.

### Public & auth

| Method | Path | Auth | Notes |
|---|---|---|---|
| `POST` | `/api/auth/verify-key` | public | `{institutionCode, accessKey, role}` → single-use `activationToken`, role, school name. No account is created. |
| `POST` | `/api/auth/activate` | public | `{activationToken, fullName, email, password, username?}` → `201` + JWT, user, classes. Links the new account to a class/enrollment. |
| `POST` | `/api/auth/login` | public | `{identifier, password}` where identifier is email or username → JWT, user, classes. |
| `POST` | `/api/auth/logout` | bearer | `204`; adds the JWT to an in-memory denylist. |
| `GET` | `/api/auth/me` | bearer | Current user, school, and linked classes. |
| `POST` | `/api/public/pilot-inquiry` | public | **501** (lead capture deferred). |

### Student

| Method | Path | Notes |
|---|---|---|
| `GET` | `/api/student/dashboard` | Assigned/completed counts, recent scores, 7-day streak, concept mastery. |
| `GET` | `/api/student/progress` | Concept mastery for the authenticated student. |
| `GET` | `/api/student/activities?category=all\|assigned\|remedial\|completed` | Published activities for the student's classes, with score/submission status. |
| `GET` | `/api/student/quiz/{quizId}` | Published quiz for an enrolled student. **Never includes `correctAnswer`**; includes any saved draft answer. |
| `PATCH` | `/api/student/quiz/{quizId}/answer` | `{questionId, selectedOption}`; idempotent draft save. |
| `POST` | `/api/student/quiz/{quizId}/submit` | `{answers:[{questionId, selectedOption}]}`; deterministic scoring + feedback. `200` when feedback is READY, `202` when PENDING. Second submission → `409`. |
| `GET` | `/api/student/feedback/{submissionId}` | Owner-only feedback; `202` + `status=PENDING` while generation is outstanding. |
| `POST` | `/api/student/feedback/{submissionId}/retry` | Re-runs feedback generation; `200`/`202`. |

Deferred student routes (all return **501**): `PATCH /api/student/preferences`,
`POST /api/student/office-hours/book`, `POST /api/student/quiz/{quizId}/flag`,
`GET /api/student/feedback/{submissionId}/pdf`,
`POST /api/student/feedback/{submissionId}/practice-drill`,
`GET /api/student/progress/history`, `GET /api/student/progress/report/{reportId}`,
`POST /api/student/progress/notes`.

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

Deferred teacher routes (all return **501**): `POST /api/teacher/activities/ai-generate`,
`POST /api/teacher/diagnostics/run`, `GET /api/teacher/dashboard/export-csv`,
`GET /api/teacher/reports`, `GET /api/teacher/reports/export-csv`,
`GET /api/teacher/reports/export-pdf`, `GET|PUT /api/teacher/settings`,
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
- CORS allows only the configured frontend origins and disallows credentialed requests, since
  the JWT travels in the `Authorization` header.

## Data model & design decisions

- `V1__init.sql` is the schema authority: 15 tables covering `SUBSCRIPTION`, `SCHOOL`, `USER`,
  `CLASS`, `ENROLLMENT`, `QUIZ`, `QUESTION`, `CONCEPT`, `QUESTION_CONCEPT`, `SUBMISSION`,
  `ANSWER`, `FEEDBACK`, `FEEDBACK_CONCEPT`, `PROGRESS_RECORD`, and `NOTIFICATION`.
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
- H2/MySQL naming: the ERD uses camelCase identifiers, so entities use
  `PhysicalNamingStrategyStandardImpl`. `ddl-auto` stays `none` on MySQL because Flyway owns
  the schema; Hibernate type-name differences make strict validation noisy. Schema correctness
  is covered by `MySQLMigrationIT` instead.

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
| `501` | Endpoint intentionally deferred beyond this milestone |

## Tests

```powershell
cd backend
$env:JAVA_HOME="C:\Program Files\Java\jdk-21"   # JDK 21+
.\mvnw.cmd -B verify
```

| Test | What it covers |
|---|---|
| `MockDiagnosticEngineTest` | Feedback length, concept selection/cap, fallback, no answer leakage |
| `AuthFlowIT` | verify-key → activate → me → login → logout; invalid/reused activation tokens; 401 problem JSON |
| `QuizLifecycleIT` | Teacher create/update/publish → student list/load/save draft/submit → feedback/dashboard; draft invisibility |
| `AuthorizationIT` | 401/403 boundaries, cross-teacher activity access, cross-student feedback access, roster isolation |
| `SubmitIdempotencyIT` | Second submit → 409, duplicate/empty/foreign answers → 400, non-enrolled/no-draft → 403/404 |
| `MySQLMigrationIT` | Flyway applies all ERD tables + dev seed on real MySQL 8 and the seeded teacher can log in (Docker-gated; skipped when Docker is unavailable) |

Functional ITs use H2 in MySQL mode with Hibernate `create-drop` and an H2-compatible `data.sql`
so they run without Docker. `MySQLMigrationIT` starts `mysql:8.4` through Testcontainers and
auto-skips when no Docker daemon is reachable, so run `verify` where Docker exists to exercise
the real migrations.

## Known limitations (40% milestone)

These are intentional, documented gaps rather than silent failures:

- **Deferred features return 501**: reports/exports, notification delivery and nudges,
  practice drills, settings persistence, private teacher notes, student preferences/notes,
  office-hours booking, question flagging, feedback PDFs, pilot inquiries, AI activity
  generation, and batch diagnostics.
- **In-memory state**: JWT denylist (logout), single-use activation tokens, and quiz draft
  answers live in process memory. They reset on restart and do not work across multiple
  instances; production needs Redis (or DB tables) and a durable draft store.
- **No refresh tokens**; clients re-authenticate when the JWT expires (default 2h).
- **Feedback generation is synchronous** on submit (mock engine is fast). A real model needs a
  queue/worker, retry policy, and observability; the `PENDING` + `retry` contract already
  supports that.
- **No rate limiting** on `login`/`verify-key`; add it at the gateway or with Bucket4j before
  exposing the API publicly.
- **No admin role or subscription enforcement**; `SUBSCRIPTION` is modeled but not enforced.
- **Swagger is dev-only** and springdoc is not exposed in `prod`.
- **No Docker locally?** `MySQLMigrationIT` is skipped, so run the migration test in CI where
  Docker is available.
