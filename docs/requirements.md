# Aralytics — Requirements Index

**Version:** 1.1
**Date:** 2026-11-25

This document is a pointer, not a duplicate source of truth. It exists so the
`docs/` folder has a requirements entry and can also note how requirement changes
are handled. The actual, maintained product requirements live in `docs/PRD.md`.

## Canonical requirements

**THE CANONICAL REQUIREMENTS DOCUMENT IS [./PRD.md](./PRD.md).**

Do not copy its full content here. `docs/PRD.md` is the single
authoritative source for product scope, functional requirements, non-functional
requirements, and roadmap. If this index and `PRD.md` ever disagree, `PRD.md` wins.

## MVP scope summary

- Provisioned role-based login for Student and Teacher; role-based access enforced server-side and via `/forbidden` (FR-AUTH-01/02).
- Account activation via institution code and issued access key; no unrestricted self-sign-up (FR-AUTH-03).
- Student portal showing assigned and completed activities with status, scores, and submitted-answer review (FR-STU-01..03).
- Teacher-authored quiz engine: multiple-choice and situational/code-scenario questions, with assignment, submission, and answer retention (FR-ACT-01..05).
- Teacher dashboard and roster with class KPIs, per-student detail, and a configurable intervention threshold defaulting to 70% (FR-TCH-01..03).
- Progress history, trend analytics, reports, settings, notifications, and AI diagnostic feedback (`FR-AI-01..04` mock implemented, live LLM planned) are Should-Have / post-MVP (`FR-PROG-*`, `FR-RPT-*`, `FR-SET-*`, `FR-NOT-*`, `FR-AI-*`).

## Requirement change process

1. A user/owner requests a requirement change.
2. `docs/PRD.md` is updated and its version is bumped.
3. A numbered entry describing the change is appended to `docs/LOG.md`.
4. If the change adds or removes files, `docs/FILETREE.md` is updated accordingly.

## Traceability

Implementation status per capability is in [./PRD.md](./PRD.md) sections 6.1–6.2.

---

Requirements status as of 2026-11-25: PRD v2.1
