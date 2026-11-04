# Contributing to Aralytics

This document defines the enforced workflow for this repository. All contributors must follow it; pull requests that do not meet the requirements below will not be merged.

## Getting Started

Prerequisites per `SETUP.md`: Node.js v20.x or later (v22.x recommended), npm v10.x or later, Git v2.40+.

```powershell
# Install frontend dependencies
npm --prefix frontend install

# Start the dev server ( http://localhost:3000 )
npm --prefix frontend run dev


# Quality gates (must pass before any merge)


npm --prefix frontend run lint

npm --prefix frontend run build
```


Both `lint` and `build` must pass with zero errors before a branch can be merged into `main`.

## Branch Naming

Use `main` for stable code; `feature/<issue>-<short-name>` for features; `fix/<issue>-<short-name>` for fixes. Branch from latest main; delete branches after merge.

## Commits

- Write descriptive imperative summaries: state what the commit does and why (e.g., "Add filter controls to students roster so teachers can isolate students below the mastery threshold").
- Reference the issue number when applicable (e.g., `(#12)`).
- Never mix unrelated work: do not commit commented-out code dumps, console/log noise, or files unrelated to the change in the same commit.

## Pull Requests

- Keep PRs small and focused: one feature or one fix per PR.
- The description must state what changed and why; UI changes should include screenshots (before/after).
- At least one peer reviewer approval is required before merging into `main`. Self-merging is not allowed.

## Branch Protection

The `main` branch is protected: force-push and direct-push are disabled by the repo owner in GitHub settings. Never attempt to bypass branch protection; all changes reach `main` through a reviewed pull request.

## Secrets

- Never commit real secrets, API keys, or `.env` values to the repository.
- Copy `.env.example` to `.env` for local configuration. `.env` is gitignored and must stay that way.

## Documentation Upkeep

- Any change that adds or renames files, or changes routes, must update `FILETREE.md` (file map) and `LOG.md` (chronological change log) in the same PR.
- UI changes must follow `HANDOFF.md` conventions: React 19 functional components with hooks only, Tailwind v4 theme tokens defined in `frontend/src/index.css`, and Google Material Symbols icons.
