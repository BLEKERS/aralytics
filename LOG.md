# LOG.md

Chronological log of steps taken during work sessions on this project, kept regardless of whether each step turned out to be meaningful.

**Started:** 2026-10-27 (retro-filled from this session)

---

## Session 2026-10-27 (continuation: "read handoff and continue")

1. Searched for a handoff file by glob pattern `**/*handoff*`; found nothing at first because I searched case-sensitively with lowercase (the file is `HANDOFF.md`).
2. Ran `git log --oneline -5` and `git status --short` to see repo state: last commit was `f0b9f75` (landing + home CS rebrand), with uncommitted changes in `Sidebar.jsx`, `TopBar.jsx`, `StudentsMasteryRoster.jsx`.
3. Globbed `*.md` at root and found `HANDOFF.md`, `README.md`, `FILETREE.md`.
4. Read `HANDOFF.md` (114 lines). Learned project state: all 7 screens converted from Stitch exports, CS/Python rebrand done for `/` and `/home` only, suggested next steps listed.
5. Ran `git diff` on the three modified files: found a half-finished rebrand of the roster screen (header + first 2 table rows converted to CS content, rows 3+ still old Grade 8 content), plus manual rebrand edits in Sidebar ("CS Instructor") and TopBar ("CS 101: Intro to Python").
6. Listed `screens/stitch/*/code.html` file timestamps: all 5 teacher-screen exports had timestamps of 11:33 PM (newer than the 11:06 PM portal/landing exports from the previous session) — meaning all 5 teacher screens had new, unconverted exports.
7. Grepped `screens/stitch/students_mastery_roster/code.html` for "CS 101|Python|Miguel": confirmed the new roster export contains the CS rebrand ("Students & Coding Mastery Roster", Miguel Ramos, STU IDs).
8. Grepped `screens/stitch/teacher_desktop_dashboard/code.html`: confirmed dashboard export also rebranded (CS 101, KPIs, flagged students).
9. Grepped the other 3 exports (settings, reports, activities) for CS terms: all confirmed rebranded.
10. Grepped all `src/screens/*.jsx` for old terms: confirmed 4 teacher screens still fully old (Grade 8/Sampaguita) and roster half-converted.
11. User asked to move blocking work to the background; the roster and dashboard conversion subagents were already running asynchronously, and I reported status briefly.
12. Dispatched 5 parallel subagents to re-implement the 5 teacher screens from their new exports, each with detailed conversion rules (HTML→JSX verbatim conversion, preserve interactivity, no imports from `screens/`, no `index.css` edits, lint + build verification required):
    - Roster (background) → completed: 7 rebuilt rows, STU-109283-0X IDs, Miguel detail drawer, select-on-row-click state.
    - Dashboard (background) → completed: new KPIs, CS benchmark chart, concept filter pills wired, flagged-student modal, CSV busy state.
    - Settings (foreground) → completed: CS department config, Aralytics-Code-7B card, tone cards, threshold slider, dirty-flag save.
    - Reports (foreground) → completed: cohort analytics for CS 101-A, CS-PY-10X competencies, telemetry panel, export busy states.
    - Activities (foreground) → completed: coding activities list, topic chips, create-activity drawer, toast system.
13. Ran `npx oxlint src` (exit 0, clean) and `npx vite build` (succeeded; known >500 kB chunk-size warning treated as noise).
14. Ran a stale-term grep sweep across `src/**/*.jsx`: only remaining old term was one decorative `data-alt` attribute on `LandingPage.jsx` (verbatim from its export; left as-is).
15. Started a dev server in the background with `npm run dev`; ports 3000 and 3001 were occupied by stale instances from earlier sessions, so Vite picked port 3002.
16. Ran Playwright checks on all 5 teacher routes at 1440px: for each route, navigated, read `document.body.innerText`, asserted new CS terms present and stale Grade 8/Sampaguita terms absent. All passed except `/settings` did not show "Mr. Ronald Reyes".
17. Investigated the settings miss: the teacher profile lives on the "Profile & Account" tab, not the default tab.
18. First attempt to click the tab via `browser_evaluate` failed with `ReferenceError: Unknown identifier 'setTimeout'` (timers are unavailable in the Code Mode runtime); retried without the delay and the click worked: "Ronald Reyes", "CS 101 - Intro to Python", and "CS 201 - Data Structures" all present. Settings verdict: pass.
19. Checked body computed styles on `/dashboard`: background `rgb(251, 248, 255)` (canvas token) and font `Inter` — correct.
20. Resized browser to 390×844 and checked `document.documentElement.scrollWidth > clientWidth` on all 5 routes: no horizontal overflow on any of them.
21. Looked up the Playwright screenshot tool signature via `search` (first call failed validation because the `scale` argument was required).
22. Took full-page desktop screenshots (1440px) of all 5 routes: `dashboard-desktop-1440.png`, `roster-desktop-1440.png`, `activities-desktop-1440.png`, `reports-desktop-1440.png`, `settings-desktop-1440.png`. They saved to the workspace root.
23. Moved the 5 screenshots into `.playwright-mcp/` and deleted the Playwright console-log and page-snapshot clutter (`console-*.log`, `page-*.yml`) that had accumulated there.
24. Staged all changes with `git add -A` (7 modified source files) and committed as `b8725c6` "Re-brand 5 teacher screens from new CS-rebrand Stitch exports; rebrand Sidebar/TopBar chrome; Playwright-verified".
25. Read `FILETREE.md` to sync it.
26. Edited `FILETREE.md`: added the 5 new screenshot filenames to the `.playwright-mcp/` section and changed the 5 teacher-screen lines to say "re-implemented from CS-rebrand … export".
27. Edited `HANDOFF.md`: updated the "Last updated" line and Project Overview (rebrand now covers all 7 screens), rewrote the 5 teacher-screen route descriptions in the routing table, rewrote the "Verified State" section (lint/build/browser results, screenshots, chrome note, port 3002 note), and updated next step 2 to mention 9 screenshots.
28. Committed the doc updates as `0887e3e` "Sync HANDOFF + FILETREE: full CS rebrand of all 7 screens".
29. Reported the finished rebrand to the user, including the note that dev servers are still holding ports 3000/3001.
30. User asked for this `LOG.md` file; created it and retro-filled all steps of this session from memory.

---

## Session 2026-10-27 (LOG.md creation)

31. Created `LOG.md` (this file) with the retro-filled session log above.

---

## Session 2026-10-29 (13-Screen Stitch Re-Implementation & Student/Teacher Separation)

32. Read `HANDOFF.md`, `LOG.md`, and `FILETREE.md` to review project state and conventions.
33. Inspected `screens/stitch/` and discovered 13 Stitch screen exports (3 Public/Auth: `landing_page`, `aralytics_login`, `aralytics_account_registration_activation`; 5 Student View: `portal`, `aralytics_student_my_activities`, `aralytics_student_live_quiz_code_scenario`, `aralytics_instant_ai_feedback_diagnostic_report`, `aralytics_student_feedback_history_progress`; 5 Teacher View: `aralytics_teacher_desktop_dashboard`, `aralytics_students_mastery_roster`, `aralytics_activities_quiz_management`, `reports`, `teacher_settings`).
34. Clarified routing and directory separation with the user: role-prefixed routes (`/student/*` and `/teacher/*` plus legacy redirects) and separated `src/screens/public/`, `src/screens/student/`, and `src/screens/teacher/` folders.
35. Created and updated the implementation plan artifact (`implementation_plan.md`) covering all 13 screens and got user approval.
36. Updated `src/App.jsx`, `src/components/layout/Sidebar.jsx`, and `src/components/layout/TopBar.jsx` for `/teacher/*` and `/student/*` routing.
37. Defined `screen-converter` subagent and launched 6 parallel subagents to convert all 13 screens into `src/screens/public/`, `src/screens/student/`, and `src/screens/teacher/`.
38. Created `fetch-screens.mjs` (and added `"fetch-screens"` to `package.json`) to fetch all 14 listed Stitch items (HTML code and hosted screenshots) for project `17585807675120887156` using Stitch MCP (`get_screen` / `download_file`) and `curl -L`.
39. Added `/fetch-screens.mjs` to `.gitignore`.
40. Completed 1:1 React conversions for all 13 Stitch screens across role-separated folders:
    - `src/screens/public/`: `LandingPage.jsx` (`/`), `LoginScreen.jsx` (`/login`), `AccountActivationScreen.jsx` (`/register`)
    - `src/screens/student/`: `StudentDashboard.jsx` (`/student/dashboard`), `StudentMyActivities.jsx` (`/student/activities`), `StudentLiveQuiz.jsx` (`/student/quiz`), `StudentDiagnosticReport.jsx` (`/student/feedback`), `StudentProgressHistory.jsx` (`/student/progress`)
    - `src/screens/teacher/`: `TeacherDashboard.jsx` (`/teacher/dashboard`), `StudentsMasteryRoster.jsx` (`/teacher/students`), `ActivitiesQuizManagement.jsx` (`/teacher/activities`), `ClassReportsLearningAnalytics.jsx` (`/teacher/reports`), `TeacherClassroomSettings.jsx` (`/teacher/settings`)
41. Removed the 7 legacy flat screen files from `src/screens/*.jsx`.
42. Verified `npx oxlint src` (0 warnings, 0 errors across 17 files) and `npx vite build` (38 modules transformed, clean production bundle).
43. Updated `FILETREE.md`, `HANDOFF.md`, and `LOG.md` to reflect the 13 screens and separated `public/`, `student/`, and `teacher/` architecture.
44. Moved React/Vite frontend files (`src/`, `public/`, `index.html`, `vite.config.js`, `package.json`, `package-lock.json`, `node_modules/`, `dist/`) into `frontend/`, updated `frontend/package.json` `fetch-screens` script path, and synced `FILETREE.md` and `HANDOFF.md`.
45. Checked git status, verified `screens/` and `fetch-screens.mjs` remain gitignored, staged all frontend and doc changes, and committed to git.
46. Pre-filled default Student (`miguel@school.edu.ph` / `student123`) and Teacher (`maria.santos@university.edu.ph` / `teacher123`) demo credentials in `frontend/src/screens/public/LoginScreen.jsx` when switching role tabs.
47. Created `SETUP.md` (prerequisites, quick start, default Student/Teacher login & activation credentials, commands) and `NAVIGATION.md` (13-screen navigation graph, outgoing links, and planned `/api/public/*`, `/api/auth/*`, `/api/student/*`, `/api/teacher/*` endpoints), and registered both in `FILETREE.md` and `HANDOFF.md`.
48. Ran Playwright audit across all 13 screens at 1440×900 desktop and 390×844 mobile against `screens/stitch/*/code.html`, captured 13 desktop screenshots in `.playwright-mcp/`, and fixed all detected inconsistencies:
    - Eliminated 390px mobile horizontal overflow on `/login` (`LoginScreen.jsx`) and `/register` (`AccountActivationScreen.jsx`) caused by ambient blur circles.
    - Updated `Sidebar.jsx` (`Mr. Reyes` / `High School CS`, removed old broken logo image) and `TopBar.jsx` (`💻 CS 101: Intro to Python (Sec A · 42 students)`, search placeholder, interactive `EN`/`FIL` toggle) to match the Stitch Teacher Dashboard export.
    - Removed legacy `Flagged for Coding Support` right-hand card in Row 3 of `TeacherDashboard.jsx` to match `aralytics_teacher_desktop_dashboard/code.html` and `screen.png` 1:1.
    - Added `Dashboard` link to desktop `NAV_ITEMS` in `StudentDiagnosticReport.jsx` (`/student/feedback`) for header consistency across Student View screens.
49. Verified `.gitignore` (added `.env` / `.env.*` ignore rules alongside `node_modules/`, `dist`, `.playwright-mcp/`, `/screens/`, `/fetch-screens.mjs`), checked `git status`, and committed all Playwright fixes and `SETUP.md` / `NAVIGATION.md` docs.

---

## Session 2026-10-29 (Global visual/interaction polish pass)

61. Clarified enhancement direction with the user; chose "Visual/UI polish pass" over data wiring, accessibility audit, or mock backend.
62. Found the installed `ui-ux-pro-max` skill scripts/data missing (`scripts/` only contains `tests/`), so used its built-in priority-table defaults for focus visibility (P1), touch feedback (P2), and reduced motion (P7).
63. Audited all 17 `frontend/src` files: 384 `hover:` / 404 transition mentions already exist from Stitch classes, but only 66 `focus` mentions and zero `prefers-reduced-motion` handling.
64. Added one additive block to `frontend/src/index.css` (no screen edits, no layout change): global `:focus-visible` ring in brand purple `--color-primary`, soft `::selection` color, `-webkit-tap-highlight-color: transparent`, smooth `scroll-behavior`, gentle `scale(0.98)` press feedback on buttons via `:where()` (utilities override it), and a `prefers-reduced-motion: reduce` guard that kills animations/transitions/smooth scrolling. Obeyed the `*/`-in-CSS-comment rule.
65. Verified: `npm --prefix frontend run lint` clean, `npm --prefix frontend run build` clean (only the known >500 kB chunk warning), and confirmed all new rules present in `dist/assets/*.css`.
66. Playwright-verified on the dev server (port 3000): tab focus on `/teacher/dashboard` nav links shows the purple ring (`rgb(66,46,194)`), `scroll-behavior: smooth` applies, reduced-motion `@media` rule present in the served page; no 390px horizontal overflow after the change; screenshot `.playwright-mcp/polish-teacher-dashboard-1440.png` confirms visuals are unchanged (additive polish only). Initial stale-CSS confusion in the browser was resolved by a fresh navigation.

---

## Session 2026-10-29 (Playwright UI pass, branding, language removal)

50. Started Vite on `http://localhost:5173` and captured full-page screenshots of all 13 routes at 1440×900, 1024×768, and 390×844 into `.playwright-mcp/audit/`, then compared them against `screens/stitch/*/screen.png`.
51. Ran scripted layout checks on every route/viewport: page-level horizontal overflow, headings whose computed line-height was under 1.1× font-size, broken images, and clipped text. Found and fixed:
    - `/login`: `Welcome to Aralytics` inherited the 20px body line-height at mobile, so its two lines overlapped the subtitle. Added `leading-[1.2]` + `text-balance` (and the same guard on `/register`).
    - `/student/feedback`: mobile diagnostic accordion rows squeezed question titles into a ~80px column. Rows now wrap to a second line below `sm`, giving the title full width and keeping the badge/chevron on its own row.
    - Teacher `/teacher/activities`: create-activity drawer's Topic/Section selects truncated their values side-by-side at 390px; they now stack below `sm`.
52. Fixed tablet-width teacher layouts (1024–1279px) where the fixed 250px sidebar left too little room for `lg` grids:
    - Teacher dashboard KPI/12-column rows, header, and directory header now switch at `xl`; table has `min-w-[760px]` with horizontal scroll.
    - Roster header switches at `xl`, KPI cards use 2 columns through `md`, table has `min-w-[900px]`.
    - Reports header, 4-up metrics, competency header, and telemetry grid switch at `xl`.
    - Activities page header and generator button switch at `xl`.
    - Settings 7/5 split switches at `xl`.
    - `TopBar` search is hidden below `xl` instead of collapsing to a ~70px input at 1024.
53. Removed every EN/FIL language control: `StudentDashboard.jsx` header toggle, teacher `TopBar.jsx` toggle, and the teacher student-modal “Teacher Note Language” switch (modal now always renders the English observation). Removed the unused `lang` state, `toggleModalLang`, `lang`/`observationFil` data, and the now-pointless “Language & Localization” settings tab. Verified no `EN`/`FIL` text remains in `frontend/src`.
54. Created `frontend/src/components/BrandLogo.jsx` as the canonical brand lockup and replaced every hand-rolled header/footer logo with it: landing header + footer, login/register header + footer mark, all five student headers, student footer mark, and the teacher `Sidebar` (which previously had text only). Name styling now matches the landing page (`font-headline-sm`, `tracking-tight`, `text-on-surface`, `leading-none`) with the primary square + amber dot mark; removed the duplicated “Pilipinas AI” logo lockup from the student Activities nav and replaced that item with a normal Dashboard link.
55. Re-ran Playwright across all 13 routes at 1440×900 and 390×844: zero page overflow, zero tight headings, zero broken images, zero `EN`/`FIL` text. Verified the teacher modal no longer has a language switch and Settings shows only Profile & Account, Classroom & Grading, and AI Diagnostic Model & Tone.
56. Ran `npm --prefix frontend run lint` (clean) and `npm --prefix frontend run build` (clean; only the known >500 kB chunk warning). Updated `FILETREE.md` (BrandLogo, Sidebar/TopBar descriptions) and `HANDOFF.md` (brand lockup + teacher `xl` breakpoint rules).
57. Removed the Aralytics brand lockups from every footer: landing page, login, registration, and student dashboard. Footers now carry only the description/tagline and copyright/legal links; the canonical `BrandLogo` remains in headers and the teacher sidebar only. Re-verified footers at 1440px and re-ran lint/build clean.
58. Made every `BrandLogo` header link target the public landing page (`/`): student headers and the teacher sidebar previously went to their role dashboards. Playwright-click verified `/student/dashboard`, `/teacher/dashboard`, and `/login` all navigate to `/`; lint clean.
59. Replaced the browser tab icon (`frontend/public/favicon.svg`) with the BrandLogo mark — primary `#422ec2` rounded square, amber `#ffdf9a` graduation cap and status dot — and changed the document title separator from an em dash to a pipe: “Aralytics | AI Learning Analytics”. Verified the title and favicon URL through Playwright; updated `FILETREE.md`.
60. Standardized the local dev URL on port 3000: `frontend/vite.config.js` already sets `server.port: 3000`, so the server is now started without a CLI port override. Updated `SETUP.md` and `HANDOFF.md` references from `localhost:5173` to `localhost:3000` and verified HTTP 200 on the new port.

---

## Session 2026-10-29 (Responsive cutoff fixes)

67. Audited all 13 routes in Playwright at 1440×900, 1024×768, and 390×844, then ran additional responsive checks at 320×720 and 768×1024. Found two real clipped-content issues: the `/student/quiz` mobile code header pushed its copy button outside the rounded panel, and `/register` truncated both lines of its school inquiry message.
68. Fixed the quiz header by allowing the filename to shrink, hiding the redundant “Python 3.11” label below `sm`, and keeping the copy controls from shrinking. Removed `truncate` from the registration pilot notice so its complete title and description wrap on mobile.
69. Confirmed the teacher roster table is intentionally horizontally scrollable at mobile (342px viewport, 900px table width); Playwright verified the final Actions column becomes visible after scrolling at both 390px and 1024px. Verified no document-level horizontal overflow on any route at 320, 390, 768, 1024, or 1440px; the quiz copy button stays inside its panel and both registration notice strings remain untruncated at 320, 390, and 768px. Captured `.playwright-mcp/after-quiz-mobile.png` and `after-register-mobile.png`.
70. Ran `npm --prefix frontend run lint` (clean) and `npm --prefix frontend run build` (clean; existing >500 kB chunk-size warning only).

---

## Session 2026-10-29 (Project-aligned PRD)

71. Confirmed no PRD file existed and reviewed the current route map, setup credentials, login implementation, and frontend interaction patterns. Verified the repository is a frontend-only prototype: demo login accepts non-empty credentials, UI uses sample/local state, and there is no product API or live AI service.
72. Created `PRD.md` v1.1 aligned to the current two-role, 13-route product. Preserved the original goals and core requirements while clarifying invitation-based account activation (not open sign-up), the English-first scope, removed mood detection, and the distinction between prototype UI and production requirements for authentication, activity persistence, AI feedback, reports, notifications, privacy, and scale.
73. Registered `PRD.md` in `FILETREE.md` and the repository structure section of `SETUP.md`.

---

## Session 2026-11-04 (GitHub repository setup checklist)

74. Implemented the repository-setup checklist (private repo, README, .gitignore, .env.example, CONTRIBUTING.md, docs/requirements.md, docs/architecture.md, docs/team-roles.md, src/ and tests/) by dispatching 4 parallel subagents that each wrote disjoint files, keeping the existing `frontend/src` layout instead of a root `src/`:
    - `README.md`: replaced the stock Vite template with project summary, problem, users (Miguel / Mr. Reyes / Dr. Santos), 13-screen feature tables, tech stack, docs map, setup steps (credentials stay in SETUP.md only), branching summary, team table placeholder, task-board link placeholder, and repo URL.
    - `docs/architecture.md`: high-level browser→SPA→future-backend diagram, 13-route map with layout chrome, AppShell vs standalone split, design-system pointers, quality gates, and data/state status (sample data, no API client).
    - `frontend/tests/README.md`: initialized the tests directory with strategy (unit + component smoke via a runner to choose, Playwright checks at 320/390/768/1024/1440 widths, role-flow checks) and a how-to-run placeholder.
    - `docs/requirements.md`: pointer document declaring `../PRD.md` canonical, MVP scope summary with FR IDs, requirement-change process, and a 2026-11-04 status stamp (PRD v1.1).
    - `docs/team-roles.md`: empty team roster table plus role archetypes (Project Lead/Coordinator incl. repo settings, Frontend Developer, Backend & AI Engineer, QA & Documentation, Instructor/Faculty Advisor).
    - `CONTRIBUTING.md`: getting started + lint/build merge gates, branch naming (`main`, `feature/<issue>-<short-name>`, `fix/<issue>-<short-name>`), descriptive commit rules, one-peer-review PR policy, protected `main`, secrets policy with `.env.example`.
    - `.env.example`: commented Vite environment template (no variables required today; `VITE_API_BASE_URL` as a future example). `.gitignore` already ignores `.env*` except `.env.example`.
75. Checked `gh` CLI availability for the GitHub-side checklist items: not installed, so making the repo private, inviting members, and protecting `main` must be done by the repo owner in the GitHub web UI (repo: github.com/dassel-avg-dev/aralytics).
76. Updated `FILETREE.md` (.env.example, CONTRIBUTING.md, docs/, frontend/tests/README.md) and this `LOG.md`; committed the docs additions while leaving the pre-existing uncommitted `.gitignore` edit (`opencode.json` ignore line) unstaged for the owner to decide.

---

## Session 2026-11-04 (Backend 40% milestone)

77. Created branch `feature/backend-40-scaffold` and extracted `backend.pdf` (text only; ERD/class diagrams are images) to drive the ERD and API scope. Kept `frontend/src/` untouched.
78. Scaffolded `backend/` as a Spring Boot 3.4.13 / Java 21 Maven project (`ph.aralytics.backend`, version `0.40.0-SNAPSHOT`): Web, JPA, Security, Validation, Actuator, Flyway (core + MySQL), MySQL connector, JJWT 0.12.7, springdoc 2.8.17, and H2/Testcontainers test dependencies. Generated the Maven wrapper pinned to Maven 3.9.9.
79. Implemented the ERD schema in Flyway `V1__init.sql` (15 tables) with two additive pieces required by the milestone: `SCHOOL.institutionCode` (unique) and `QUESTION_CONCEPT` (per-question concept tags). Added `V2__seed_dev.sql` under `db/seed`, loaded only by the `dev` profile.
80. Built the security layer: BCrypt(10), stateless HS256 JWTs, `JwtFilter`, in-memory JWT denylist for logout, in-memory single-use activation tokens, custom JSON 401/403 handlers, `@PreAuthorize` on every handler, and route rules for `/api/public`, `/api/auth`, `/api/student`, `/api/teacher`, Actuator health, and Swagger.
81. Implemented auth without public signup: `verify-key` (institution code + role access key → short-lived activation token), `activate` (consume token, create user, link class/enrollment, return JWT), `login` (email or username), `logout`, and `me`.
82. Implemented teacher authoring (`GET/POST /api/teacher/activities`, `PATCH /{id}`, `POST /{id}/publish`) with ownership checks in the service layer, plus the teacher dashboard, roster (search/topic/status/paging), and student diagnostic deep-dive.
83. Implemented the student lifecycle: dashboard, progress, activity list, published-quiz load (correct answers never serialized), idempotent draft answer saves, submission with server-side scoring, duplicate/foreign/empty-answer validation, 409 on re-submit, feedback read/retry, and enrollment checks. PENDING is represented by the absence of a `FEEDBACK` row.
84. Implemented diagnostic feedback behind a `DiagnosticEngine` seam: deterministic `MockDiagnosticEngine` (1–3 concepts, fallback `Python fundamentals`, 2–4 supportive sentences, no answer leakage, `PROGRESS_RECORD` upsert) and an `ai`-profile `LlmDiagnosticEngine` stub with timeouts and mock fallback.
85. Added RFC 7807 error handling (400/401/403/404/409/501), CORS for `localhost:3000` and `5173`, `application-dev.yml`/`application-prod.yml` (seed + Swagger only in dev), and Actuator health-only exposure.
86. Deferred frontend-linked features return explicit 501 with a reason instead of fabricated data: reports/exports, notifications/nudges, practice drills, settings, private notes, student preferences/notes, office hours, question flagging, feedback PDFs, pilot inquiry, AI generation, batch diagnostics, and progress history reports.
87. Wrote tests: `MockDiagnosticEngineTest` (4 unit tests) and `AuthFlowIT`, `QuizLifecycleIT`, `AuthorizationIT`, `SubmitIdempotencyIT`, `MySQLMigrationIT` (18 IT executions, of which 2 are Docker-gated and skipped locally). Functional ITs use H2 MySQL mode with a H2-compatible `data.sql`; `MySQLMigrationIT` starts `mysql:8.4` and skips cleanly without Docker.
88. Fixed two test-environment issues: H2 stored JSON options as strings unless `FORMAT JSON` was used, and seeded explicit IDs collided with new identities until `ALTER TABLE ... RESTART WITH 100`. Also corrected `JdkClientHttpRequestFactory` timeout setup and a duplicate-answer check that failed on a `null` option.
89. Ran `backend\mvnw.cmd -B verify` with JDK 24 targeting release 21: **BUILD SUCCESS**, 4 unit tests + 16 integration tests passed, 2 MySQL migration tests skipped (no Docker), 0 failures/errors.
90. Added developer/container assets: `backend/README.md` (setup, env vars, API map, security/data decisions, test matrix, known limitations), `.env.example`, `.gitignore`, `.dockerignore`, `Dockerfile` (multi-stage, non-root), and `docker-compose.yml` (MySQL 8.4 healthcheck + API on port 8080).
91. Updated the root `README.md` summary/tech stack/getting-started/docs pointer for the backend milestone and this log. Backend work is committed on `feature/backend-40-scaffold`; nothing was pushed.

