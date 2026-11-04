# Aralytics — Requirements Index

**Version:** 1.0
**Date:** 2026-11-04

This document is a pointer, not a duplicate source of truth. It exists so the
`docs/` folder has a requirements entry and can also note how requirement changes
are handled. The actual, maintained product requirements live elsewhere.

## Canonical requirements

**THE CANONICAL REQUIREMENTS DOCUMENT IS [../PRD.md](../PRD.md).**

Do not copy its full content here. PRD.md at the repository root is the single
authoritative source for product scope, functional requirements, non-functional
requirements, and roadmap. If this index and PRD.md ever disagree, PRD.md wins.

## MVP scope summary

- Provisioned role-based login for Student and Teacher; role-based access enforced server-side (FR-AUTH-01/02).
- Account activation via institution code and issued access key; no unrestricted self-sign-up (FR-AUTH-03).
- Student portal showing assigned and completed activities with status, scores, and submitted-answer review (FR-STU-01..03).
- Teacher-authored quiz engine: multiple-choice and situational/code-scenario questions, with assignment, submission, and answer retention (FR-ACT-01..05).
- AI diagnostic feedback from a locally hosted coding-education model: score, concepts demonstrated/needed, supportive explanation within a five-second target (FR-AI-01..04).
- Teacher dashboard and roster with class KPIs, per-student detail, and a configurable intervention threshold defaulting to 70% (FR-TCH-01..03).
- Progress history, trend analytics, reports, and notifications are post-MVP (FR-PROG-*, FR-NOT-*).

### Prototype-only caveats in the current repository

The repository contains a React 19 + Vite 8 frontend prototype only. Login,
activation, activities, scores, dashboards, reports, settings, and AI feedback
are demo UI with sample/local data; there is no product API, persistent store,
real authentication, or live AI inference. See PRD.md sections 5.2 and the
"Current state" notes in section 6, and SETUP.md, which documents demo-only
credentials. Do not mistake any screen in this prototype for a working service.

## Requirement change process

1. A user/owner requests a requirement change.
2. PRD.md is updated and its version is bumped.
3. A numbered entry describing the change is appended to LOG.md.
4. If the change adds or removes files, FILETREE.md is updated accordingly.

## Traceability

Implementation status per capability is in PRD.md section 5.2, and the
FR-* requirement IDs live in PRD.md section 6. Refer to them at
[../PRD.md](../PRD.md) rather than restating them here.

---

Requirements status as of 2026-11-04: PRD v1.1
