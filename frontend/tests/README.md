# frontend/tests/

Purpose: home for automated tests of the Aralytics frontend.

Current status: **this directory contains no test files yet.** No unit test runner is installed; the only automated-style verification today is E2E checking driven manually through Playwright MCP against the Vite dev server.

## Strategy

- **Unit tests** for pure logic and utility functions once a runner is chosen (e.g. Vitest, which fits the existing Vite setup).
- **Component smoke tests** that mount each screen and assert it renders its key sections without errors, also once a runner is installed.
- **Route / integration checks with Playwright** against `http://localhost:3000` (running dev server):
  - Every route loads and renders (13 core routes; see `HANDOFF.md` section 4).
  - **No horizontal overflow** at 320, 390, 768, 1024, and 1440 px viewport widths.
  - Key role flows: `/login` -> Sign In as Student -> `/student/dashboard`; `/login` -> Sign In as Teacher -> `/teacher/dashboard` (plus public landing and `/register` activation path).

## How to run tests

_Add runner instructions here once a test runner is installed._
