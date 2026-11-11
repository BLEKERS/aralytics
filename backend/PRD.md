# Aralytics - Product Requirements Document (PRD)

**Version:** 2.0
**Date:** November 5, 2026
**Author:** James Benedict De la Peña, Dassel Bacaltos, Kharil Christian Tumamak
**Status:** MVP Core Complete (40% Backend / Frontend Integration)

---

## 1. Executive Summary

Aralytics is an AI-powered learning platform designed to address the critical issue of generic and delayed feedback in coding education. By providing personalized, immediate feedback to students learning to code, Aralytics aims to boost learner engagement, motivation, and academic performance. The platform empowers teachers with a diagnostic dashboard to monitor student progress and intervene effectively, making personalized education scalable even in large classes. 

**Current State:** The project has moved from a purely visual frontend prototype to a functional full-stack application. The foundational backend (Authentication, Database, Quiz Engine, and Mock AI Diagnostic Feedback) is live and tested. This document defines the requirements for completing the remaining features (the "60%").

---

## 2. Problem Statement

Students learning to code often receive generic feedback that arrives too late to be actionable, leading to disengagement and a lack of motivation. Teachers, particularly in large classes, struggle to provide the personalized feedback each student needs, resulting in some learners being left behind without clear guidance on how to improve. This is especially critical in coding education, where understanding specific errors and concepts is essential for progress.

---

## 3. Goals and Objectives

### 3.1. Business Goals
- **B1:** Achieve adoption by private schools and individual teachers across the Philippines within the first two years.
- **B2:** Establish a sustainable subscription-based revenue model targeting schools.
- **B3:** Scale the platform globally after achieving nationwide success in the Philippines.

### 3.2. Product Goals
- **G1:** Improve student engagement and motivation through personalized, timely feedback on coding activities.
- **G2:** Reduce the time teachers spend on grading and providing feedback, allowing them to focus on high-impact interventions.
- **G3:** Provide teachers with actionable diagnostic data to identify struggling students and track class-wide progress.
- **G4:** Create a scalable solution that delivers personalized learning support for coding education, regardless of class size.

---

## 4. Target Audience & Personas

### 4.1. Primary Persona: The Student
**Name:** Miguel, 16 years old
**Pain Points:** Receives generic feedback, loses motivation when stuck, feels like a number in a large class.
**Goals:** Understand mistakes in coding exercises, improve grades, feel supported.

### 4.2. Secondary Persona: The Teacher
**Name:** Mr. Reyes, 35 years old
**Pain Points:** Overwhelmed by grading, wants to give individual attention but lacks time, struggles to identify struggling students quickly.
**Goals:** See progress at a glance, provide effective feedback efficiently, use data to inform lesson planning.

### 4.3. Tertiary Persona: The School Administrator
**Name:** Dr. Santos, 50 years old
**Pain Points:** Needs to demonstrate improved outcomes, wants to support teachers without increasing workload, seeks cost-effective solutions.
**Goals:** Wants a platform that improves performance and engagement, backed by data.

---

## 5. System Architecture & Tech Stack

### 5.1. Backend Architecture (Implemented)
- **Framework:** Java 21, Spring Boot 3.4.13
- **Database:** MySQL 8 (Local XAMPP environment for development)
- **ORM & Migrations:** Spring Data JPA (Hibernate) + Flyway
- **Authentication:** Stateless JWT (JSON Web Tokens) + Spring Security + BCrypt
- **API Documentation:** Springdoc OpenAPI (Swagger UI)
- **AI Integration:** Adapter Pattern (`DiagnosticEngine`) with a deterministic `MockDiagnosticEngine` for MVP and a stub for future LLM integration.

### 5.2. Frontend Architecture
- **Framework:** React 19, Vite 8
- **Styling:** Tailwind CSS v4
- **State Management:** React Hooks (Local State + Context for Auth)
- **API Client:** Native `fetch` (Wired to `http://localhost:8080/api`)

### 5.3. Database Schema (15 Tables)
The database accurately reflects the ERD: `SCHOOL`, `USER`, `SUBSCRIPTION`, `CLASS`, `ENROLLMENT`, `QUIZ`, `QUESTION`, `SUBMISSION`, `ANSWER`, `FEEDBACK`, `CONCEPT`, `FEEDBACK_CONCEPT`, `PROGRESS_RECORD`, `NOTIFICATION`, and the additive `QUESTION_CONCEPT` (for tagging concepts to specific questions).

---

## 6. Functional Requirements

### 6.1. Must-Have (MVP) - **STATUS: IMPLEMENTED (Backend)**

#### 6.1.1. User Authentication & Account Management
- **Fixed System Access:** No public self-registration. Accounts are provisioned via Institution Code (`STJUDE-MNL-2025`) and issued Access Keys (`KEY-8821-PY` / `FAC-2025-DEPED`).
- **Role-Based Access Control (RBAC):** Students can only see their own data. Teachers can only see data for their assigned classes.
- **JWT Sessions:** Secure, stateless login returning a Bearer token.

#### 6.1.2. Student Dashboard & Quiz Engine
- Students can view assigned and completed activities.
- Students can take quizzes (Multiple Choice and Situational/Code-Scenario questions).
- **Deterministic Scoring:** Scores are calculated server-side by comparing submitted answers to the `correctAnswer` in the database (no AI guessing).
- **Idempotency:** A student cannot submit the same quiz twice (returns 409 Conflict).

#### 6.1.3. AI Diagnostic & Feedback Engine (Mock)
- Upon submission, the `MockDiagnosticEngine` parses the questions' associated `CONCEPT` tags.
- It generates a supportive, 2-to-4 sentence English response that identifies strengths and areas for practice without leaking the correct answer.
- **Fallback State:** If feedback generation fails, the system returns a `202 Accepted` with a `PENDING` status, allowing the student to retry.

#### 6.1.4. Teacher Dashboard & Roster
- Teachers can view class-wide KPIs (Average score, completion rate).
- Teachers can see a roster of students and identify those falling below the **70% intervention threshold**.
- Teachers can drill down into an individual student's diagnostic feedback.

---

### 6.2. Should-Have (The Remaining 60%) - **STATUS: TO BE IMPLEMENTED**

#### 6.2.1. Reporting & Exports (FR-RPT)
- Teachers must be able to generate and download a CSV export of the class roster and scores.
- Teachers must be able to download a PDF report of cohort analytics.
- **Endpoints to build:** `GET /api/teacher/reports/export-csv`, `GET /api/teacher/reports/export-pdf`.

#### 6.2.2. Persistent Settings (FR-SET)
- Teachers must be able to adjust the intervention threshold (e.g., from 70% to 75%).
- Teachers must be able to set their preferred feedback tone (e.g., Formal English vs. Conversational).
- **Requirement:** Create a `TEACHER_SETTINGS` table to persist these preferences.

#### 6.2.3. Notifications & Reminders (FR-NOT)
- The system must send in-app notifications for upcoming due dates and completion milestones.
- **Requirement:** Build the notification delivery service (currently the `NOTIFICATION` table exists but is empty).

#### 6.2.4. Student Feedback History & Practice Drills (FR-PROG)
- Students must have a searchable history of all past feedback.
- Students must be able to generate a "Practice Drill" (3 similar questions) based on their weak concepts.
- **Endpoints to build:** `GET /api/student/progress/history`, `POST /api/student/feedback/{submissionId}/practice-drill`.

#### 6.2.5. Real AI Integration (FR-AI)
- Replace the `MockDiagnosticEngine` with the `LlmDiagnosticEngine`.
- **Requirement:** Connect to a locally hosted model (e.g., Ollama, Llama 3) to generate the diagnostic feedback dynamically.

---

## 7. Non-Functional Requirements

### 7.1. Performance
- AI feedback must be generated and displayed within **5 seconds** of submission. *(Currently met by Mock Engine; must be load-tested with the real LLM).*
- Dashboards must load within **3 seconds**.

### 7.2. Security & Privacy
- **Compliance:** Must comply with the Data Privacy Act of 2012 (RA 10173).
- **Passwords:** Hashed using BCrypt.
- **Tokens:** JWT secrets must be at least 32 bytes and stored in environment variables.
- **Data Exposure:** No mood/emotion detection. AI feedback must never leak the correct answer.

### 7.3. Scalability
- The architecture must support horizontal scaling. The JWT denylist (currently in-memory) must be migrated to Redis for multi-instance deployments.

---

## 8. User Stories (Updated)

### 8.1. Student User Stories
- **US-01 (Done):** As a student, I want to log in with my credentials so I can access my assigned coding activities.
- **US-03 (Done):** As a student, I want to see a list of my pending coding activities so I know what to work on next.
- **US-06 (Done):** As a student, after I submit my quiz, I want to receive feedback that tells me exactly which concepts I got wrong.
- **US-09 (Pending):** As a student, I want to receive a reminder the day before an activity is due.
- **US-11 (Pending):** As a student, I want to review the feedback I received on past quizzes.

### 8.2. Teacher User Stories
- **US-02 (Done):** As a teacher, I want to log in with my credentials so I can manage my classes.
- **US-04 (Done):** As a teacher, I want to create a multiple-choice quiz and assign it to my class.
- **US-07 (Done):** As a teacher, I want to see a list of students who scored below 70% so I can schedule a remedial session.
- **US-10 (Pending):** As a teacher, I want to see a graph showing the average class score over the semester.

---

## 9. Risks & Mitigations

| Risk | Impact | Mitigation Strategy |
|------|--------|---------------------|
| **Real AI is too slow (>5s)** | High | Keep the `MockDiagnosticEngine` as a fallback. Use streaming responses if possible. |
| **XAMPP/MySQL conflicts** | Medium | The backend supports environment variables (`DB_URL`, `DB_USER`) for easy switching to a production database. |
| **Frontend/Backend desync** | Medium | Maintain strict adherence to the OpenAPI spec. Swagger UI is enabled in dev for contract testing. |

---

## 10. Roadmap (Updated)

| Phase | Timeline | Key Deliverables | Status |
|-------|----------|------------------|--------|
| **Phase 1: MVP Core** | Months 1-4 | Auth, Quiz Engine, Mock AI, Teacher Dashboard. | ✅ **DONE** |
| **Phase 2: Frontend Integration** | Month 4 | Wire React frontend to Spring Boot API. | ✅ **DONE** |
| **Phase 3: Post-MVP Features** | Months 5-6 | Notifications, Settings, CSV/PDF Exports, Feedback History. | ✅ **DONE**|
| **Phase 4: Real AI & Pilot** | Months 7-8 | Integrate local LLM, onboard 2-3 pilot schools. | ⏳ *Planned* |
| **Phase 5: Scale & Expand** | Months 9+ | Gamification, multi-language, global expansion. | ⏳ *Planned* |

---

## 11. Open Questions (Updated)

1. **LLM Hosting:** Will the local AI model be hosted via a Python microservice, or will we use a Java-native ONNX runtime?
2. **Frontend Auth:** Where should the JWT be stored on the frontend? (Currently using `localStorage`, but should we move to HTTP-only cookies for XSS protection in production?)
3. **Reports:** Should CSV exports happen on the server (Java) or the client (React)?