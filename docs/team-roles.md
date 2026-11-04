# Team Roles & Responsibilities

Defines the working roles for the Aralytics project team. Assign one primary role per member (members may share a role where noted). Responsibilities below are the minimum expectations; roles can be adjusted as the project evolves.

_Status: Team roster to be filled in._

## Team Members

| Member | Role | GitHub handle | Responsibilities |
|---|---|---|---|
| _ | _ | _ | _ |
| _ | _ | _ | _ |
| _ | _ | _ | _ |
| _ | _ | _ | _ |
| _ | _ | _ | _ |
| _ | _ | _ | _ |

## Role Archetypes

### Project Lead / Coordinator

Owns the repository itself and the project's day-to-day coordination: repo settings (keeping the repo private, inviting members, and protecting the `main` branch), issue triage, assigning work, and merging pull requests after review. Acts as the single point of contact for schedule questions and keeps the team aligned with the course/project setup checklist.

### Frontend Developer(s)

Owns the React 19 + Vite 8 + Tailwind CSS v4 app in `frontend/`, building and maintaining the 13 routed screens (public/auth, student, teacher) per `HANDOFF.md`: React 19 functional components + hooks, Tailwind v4 theme tokens in `frontend/src/index.css`, Material Symbols icons, and responsive behavior. Keeps screens consistent with the design system and passes lint/build before every PR.

### Backend & AI Engineer

Owns the planned backend work defined in `PRD.md`: secure server-side authentication with role-based access, the data model for classes/activities/attempts, and the locally hosted coding-education diagnostic model that returns scores, concept tags, and supportive feedback within the performance targets. Also owns model evaluation, fallback/retry behavior, and privacy compliance (RA 10173) for any student data.

### QA & Documentation

Owns quality gates and project records: Playwright route checks across all routed screens, keeping `npm --prefix frontend run lint` and `npm --prefix frontend run build` green, and reviewing PRs for regressions. Maintains `LOG.md` (chronological change log) and `FILETREE.md` (file map), verifying they are updated whenever files are added, renamed, or routes change.

### Instructor / Faculty Advisor

Reviews outcomes rather than code: evaluates demo and pilot readiness against the goals in `PRD.md`, gives pedagogical feedback on the diagnostic feedback tone and teacher-facing reports, and acts as the stakeholder voice for the planned school pilot. Endorses scope and priority decisions before they are implemented.

## Repository

The repo lives at https://github.com/dassel-avg-dev/aralytics . The project coordinator should invite team members per the course/project setup checklist, then each member fills in their row in the table above.
