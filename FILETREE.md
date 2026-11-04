# FILETREE.md — Aralytics Directory & File Purpose Map

Every directory and file in the repository, its responsibility, and which Stitch screen export (if any) it implements. Keep this file updated whenever a file is added, renamed, or deleted.

```text
aralytics/
├── .gitignore                              # Excludes node_modules, dist, .env*, editor junk, and root /screens/ + /fetch-screens.mjs
├── .env.example                            # Frontend environment template (VITE_* prefix; no variables currently required)
├── CONTRIBUTING.md                         # Enforced workflow: branch naming, commits, PR review, main protection, secrets policy
├── SETUP.md                                # Developer quick-start, workspace commands, and default Student/Teacher credentials
├── NAVIGATION.md                           # Frontend screen routes, navigation links, and backend /api/* endpoint map
├── PRD.md                                   # Project-aligned product requirements; distinguishes prototype UI from planned production behavior
├── HANDOFF.md                              # Architecture, design tokens, route map, Stitch -> React conversion rules
├── LOG.md                                  # Chronological append-only log of every agent action
├── FILETREE.md                             # This file — directory & file purpose map
├── docs/                                   # Project documentation (pointer + supporting docs; PRD.md remains canonical)
│   ├── requirements.md                     # Requirements index: canonical source is ../PRD.md; change process + MVP scope summary
│   ├── architecture.md                     # Frontend architecture: routes, layout modes, tooling, data/state status, testing pointer
│   └── team-roles.md                       # Team roster placeholders and role archetype descriptions
├── fetch-screens.mjs                       # Script to fetch Stitch HTML + screenshots into screens/stitch/ (gitignored)
│
├── screens/                                # RAW STITCH EXPORTS (gitignored via /screens/; reference only — never imported at runtime)
│   └── stitch/
│       ├── landing_page/
│       │   ├── code.html                   # Source HTML for Public Landing Page (/)
│       │   └── screen.png                  # Visual reference screenshot
│       ├── aralytics_login/
│       │   ├── code.html                   # Source HTML for Login Screen (/login)
│       │   └── screen.png                  # Visual reference screenshot
│       ├── aralytics_account_registration_activation/
│       │   ├── code.html                   # Source HTML for Account Activation & Registration (/register)
│       │   └── screen.png                  # Visual reference screenshot
│       ├── portal/
│       │   ├── code.html                   # Source HTML for Student Portal Home / Dashboard (/student/dashboard)
│       │   └── screen.png                  # Visual reference screenshot
│       ├── aralytics_student_my_activities/
│       │   ├── code.html                   # Source HTML for Student My Coding Activities (/student/activities)
│       │   └── screen.png                  # Visual reference screenshot
│       ├── aralytics_student_live_quiz_code_scenario/
│       │   ├── code.html                   # Source HTML for Student Live Quiz & Code Scenario (/student/quiz)
│       │   └── screen.png                  # Visual reference screenshot
│       ├── aralytics_instant_ai_feedback_diagnostic_report/
│       │   ├── code.html                   # Source HTML for Student Instant AI Feedback & Diagnostic Report (/student/feedback)
│       │   └── screen.png                  # Visual reference screenshot
│       ├── aralytics_student_feedback_history_progress/
│       │   ├── code.html                   # Source HTML for Student Feedback History & Progress (/student/progress)
│       │   └── screen.png                  # Visual reference screenshot
│       ├── aralytics_teacher_desktop_dashboard/
│       │   ├── code.html                   # Source HTML for Teacher Desktop Dashboard (/teacher/dashboard)
│       │   └── screen.png                  # Visual reference screenshot
│       ├── aralytics_students_mastery_roster/
│       │   ├── code.html                   # Source HTML for Students & Coding Mastery Roster (/teacher/students)
│       │   └── screen.png                  # Visual reference screenshot
│       ├── aralytics_activities_quiz_management/
│       │   ├── code.html                   # Source HTML for Coding Activities & Quizzes (/teacher/activities)
│       │   └── screen.png                  # Visual reference screenshot
│       ├── reports/
│       │   ├── code.html                   # Source HTML for Cohort Reports & Learning Analytics (/teacher/reports)
│       │   └── screen.png                  # Visual reference screenshot
│       └── teacher_settings/
│           ├── code.html                   # Source HTML for Teacher Classroom Settings (/teacher/settings)
│           └── screen.png                  # Visual reference screenshot
│
└── frontend/                               # React 19 + Vite 8 + Tailwind CSS v4 Frontend Application
    ├── index.html                          # Vite HTML entry; tab title "Aralytics | AI Learning Analytics"; loads Google Fonts (Nunito Sans, Inter) + Material Symbols Outlined
    ├── package.json                        # Dependencies: react 19, react-dom 19, react-router-dom 7, @tailwindcss/vite 4, vite 8, oxlint
    ├── package-lock.json                   # Locked dependency tree
    ├── vite.config.js                      # Vite 8 config with @vitejs/plugin-react and @tailwindcss/vite
    │
    ├── tests/                              # Automated test home (no test files yet; strategy in tests/README.md)
    │   └── README.md                       # Test strategy: unit + smoke tests once a runner is chosen; Playwright route checks
    │
    ├── public/                             # Static assets served at /
    │   ├── favicon.svg                     # Browser tab icon: primary rounded-square school mark + amber dot (matches BrandLogo)
    │
    └── src/                                # Application source code
        ├── main.jsx                        # React root mount wrapped in <BrowserRouter>
        ├── App.jsx                         # Route table + conditional AppShell wrapper (Teacher View routes in AppShell; Public & Student View standalone)
        ├── index.css                       # Tailwind v4 @import + @theme token block (colors, fonts, radii, spacing) + .material-symbols-outlined + .custom-scrollbar
        │
        ├── assets/                         # Bundled static assets (if needed by components)
        │
        ├── components/
        │   ├── BrandLogo.jsx              # Canonical Aralytics header lockup used across public/auth/student/teacher chrome (primary rounded-square school mark + amber dot + landing name styling); never used in footers
        │   └── layout/                     # Shared Teacher application chrome
        │       ├── AppShell.jsx            # Fixed left Sidebar + sticky TopBar + <main class="lg:ml-[240px] flex-1 p-6 lg:p-space-xl max-w-[1600px]"> + mobile drawer
        │       ├── Sidebar.jsx             # 250px fixed left nav (Dashboard, Students, Activities, Reports, Settings under /teacher/*) + Mr. Reyes profile footer
        │       └── TopBar.jsx              # 72px sticky glass header with mobile hamburger, CS 101 course selector, xl+ search, notifications, New Activity CTA, profile
        │
        └── screens/                        # Screen-level route components separated by role (1:1 conversions of screens/stitch/*/code.html)
            ├── public/                     # Public & Authentication screens (standalone chrome)
            │   ├── LandingPage.jsx         # Route: /                   <- screens/stitch/landing_page/code.html
            │   ├── LoginScreen.jsx         # Route: /login              <- screens/stitch/aralytics_login/code.html
            │   └── AccountActivationScreen.jsx # Route: /register       <- screens/stitch/aralytics_account_registration_activation/code.html
            ├── student/                    # Student View screens (standalone top navbar wired to /student/*)
            │   ├── StudentDashboard.jsx    # Route: /student/dashboard  <- screens/stitch/portal/code.html
            │   ├── StudentMyActivities.jsx # Route: /student/activities <- screens/stitch/aralytics_student_my_activities/code.html
            │   ├── StudentLiveQuiz.jsx     # Route: /student/quiz       <- screens/stitch/aralytics_student_live_quiz_code_scenario/code.html
            │   ├── StudentDiagnosticReport.jsx # Route: /student/feedback <- screens/stitch/aralytics_instant_ai_feedback_diagnostic_report/code.html
            │   └── StudentProgressHistory.jsx # Route: /student/progress <- screens/stitch/aralytics_student_feedback_history_progress/code.html
            └── teacher/                    # Teacher View screens (wrapped in AppShell)
                ├── TeacherDashboard.jsx    # Route: /teacher/dashboard  <- screens/stitch/aralytics_teacher_desktop_dashboard/code.html
                ├── StudentsMasteryRoster.jsx # Route: /teacher/students <- screens/stitch/aralytics_students_mastery_roster/code.html
                ├── ActivitiesQuizManagement.jsx # Route: /teacher/activities <- screens/stitch/aralytics_activities_quiz_management/code.html
                ├── ClassReportsLearningAnalytics.jsx # Route: /teacher/reports <- screens/stitch/reports/code.html
                └── TeacherClassroomSettings.jsx # Route: /teacher/settings <- screens/stitch/teacher_settings/code.html
```
