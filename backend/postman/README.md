# Aralytics API — Postman Testing Guide

A ready-made Postman collection for the core Aralytics flows: authentication, the student
portal, and the teacher portal. Every request is real — it runs against the actual Spring Boot
backend and the seeded demo data.

- Collection: `backend/postman/Aralytics_API.postman_collection.json`
- Backend: `http://localhost:8080`
- Database: MySQL, booted with the `dev,seed` profiles so the demo users/quizzes exist

---

## 1. Import the collection

1. Open Postman.
2. Click **Import** (top-left).
3. Choose **Files** and select `backend/postman/Aralytics_API.postman_collection.json`
   (or drag the file into the Postman window).
4. Click **Import**. The collection **Aralytics API** appears in the left sidebar with three
   folders:
   - `1. Authentication`
   - `2. Student Endpoints`
   - `3. Teacher Endpoints`

Open the collection, then the **Variables** tab. You should see three collection variables:

| Variable | Value |
|---|---|
| `baseUrl` | `http://localhost:8080` |
| `studentToken` | *(blank — filled by the login script)* |
| `teacherToken` | *(blank — filled by the login script)* |

If `baseUrl` is different on your machine, change it here once; every request uses it.

---

## 2. Start the backend on port 8080

From the repository root, set the two mail variables first. The `dev` profile refuses to start
without them (password-reset email uses Gmail SMTP, even though this demo never sends mail):

```powershell
$env:GMAIL_USERNAME="you@gmail.com"
$env:GMAIL_APP_PASSWORD="your-16-character-app-password"
cd backend
.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=dev,seed"
```

Wait for `Started AralyticsApplication`. Then check that it is up:

```
GET http://localhost:8080/actuator/health   ->   {"status":"UP"}
```

(or simply open `http://localhost:8080/swagger-ui/index.html`).

The `seed` profile is what creates the demo accounts below. Without it the logins return 401.

- Student: `miguel@school.edu.ph` / `student123`
- Teacher: `maria.santos@university.edu.ph` / `teacher123`

---

## 3. Run `Login (Student)` first — it saves the JWT

The protected requests do **not** hard-code a token. They send
`Authorization: Bearer {{studentToken}}` (or `{{teacherToken}}`), and those variables are filled
by the login requests themselves.

`Login (Student)` has a **Tests** script that runs after the response arrives:

```js
pm.collectionVariables.set('studentToken', pm.response.json().token);
```

So the order is:

1. Open **1. Authentication → Login (Student)**.
2. Click **Send**. Expect **200 OK**.
3. Open the **Test Results** tab (bottom of the response pane). You will see
   `200 OK` and `studentToken saved` pass. The collection variable `studentToken` now holds a
   real JWT for the next 60 minutes.
4. Repeat with **Login (Teacher)** to fill `teacherToken`.
5. Now run any request in **2. Student Endpoints** / **3. Teacher Endpoints**.

If you skip the login, every protected request returns **401 Unauthorized**, because the
`{{studentToken}}` placeholder is still empty. Re-running a login simply issues a fresh token.

Tip: use the collection **Run** button to run all three folders in order — Postman executes the
login scripts before the protected requests, so the whole run passes in one click.

---

## 4. See the JWT in the Authorization tab

To show the panel that the token really is being sent:

1. Open any protected request, e.g. **2. Student Endpoints → Get My Dashboard**.
2. Click the **Authorization** tab (next to Params / Headers / Body).
3. The **Type** is **Bearer Token** and the **Token** field contains `{{studentToken}}`.
4. Hover the variable — Postman shows the resolved JWT value. You can also click
   **Collection → Variables** to see the current value stored in `studentToken`.
5. On the **Headers** tab after sending, the generated `Authorization: Bearer eyJ...` header is
   listed as a system header. That is the exact token the backend's `JwtFilter` verifies.

Useful talking point for the defense: the token is a signed HS256 JWT carrying `userId`, `role`,
and `schoolId`; the backend verifies it on every request, so no session is stored on the server.

---

## What each request demonstrates

### 1. Authentication

| Request | Method / URL | What it proves |
|---|---|---|
| Login (Student) | `POST /api/auth/login` | Credential check + JWT issue; saves `studentToken` |
| Login (Teacher) | `POST /api/auth/login` | Same flow with the teacher role; saves `teacherToken` |
| Verify Key (Activation) | `POST /api/auth/verify-key` | Public school-key check returns a short-lived activation token (no account created) |

### 2. Student Endpoints (Bearer `{{studentToken}}`)

| Request | Method / URL | Expected |
|---|---|---|
| Get My Dashboard | `GET /api/student/dashboard` | 200, student stats |
| Get My Activities | `GET /api/student/activities` | 200, assigned/remedial list |
| Get Quiz by ID | `GET /api/student/quiz/2` | 200, questions **without** correct answers |
| Submit Quiz | `POST /api/student/quiz/1/submit` | 200 (feedback READY) or 202 (PENDING) |
| Get Feedback | `GET /api/student/feedback/1` | 200, seeded feedback for submission 1 |

### 3. Teacher Endpoints (Bearer `{{teacherToken}}`)

| Request | Method / URL | Expected |
|---|---|---|
| Get Teacher Dashboard | `GET /api/teacher/dashboard` | 200, class/section stats |
| Get Student Roster | `GET /api/teacher/students` | 200, paginated roster |
| Create Activity (Draft) | `POST /api/teacher/activities` | **201 Created**, `status: "DRAFT"` |
| Export CSV | `GET /api/teacher/reports/export-csv` | 200, `text/csv` attachment |

---

## Demo caveats (read before the defense)

These are intentional, so nothing surprises you live:

1. **Submit Quiz targets quiz 1, not quiz 2.** The seed data already contains a submission for
   Miguel on quiz 2 ("Variables and Data Types"), so submitting quiz 2 returns **409 Conflict**
   (that is the duplicate-submit guard working). Quiz 1 ("Debugging Python Loops") is still open
   and has questions 1–3, which is what the body sends.
2. **Submit Quiz only works once per database.** The submission is persisted. To run it again,
   reset the database (`docker compose down -v` then restart, or drop/recreate the `aralytics`
   schema) and restart with `dev,seed`.
3. **Get Feedback uses submission 1** — the one the seed creates for Miguel. If you submit quiz 1
   first, your new submission gets a higher ID; change the URL to see its feedback.
4. **Create Activity creates a DRAFT, not a published quiz.** Students cannot see it until it is
   published via `PATCH /api/teacher/activities/{id}/publish`. The body matches the real
   `CreateQuizRequest`: options are `key`/`text` objects and `correctAnswer` must equal one of the
   option keys.
5. **Export CSV is a file download.** Use **Send and Download** so Postman saves the `.csv`
   instead of displaying it as text. The response is UTF-8 with a `text/csv` content type.
6. **Tokens expire after 60 minutes.** If protected calls start returning 401 mid-demo, just
   re-run the login request.
7. **Verify Key is public** (no token) and only validates the key — it does not create a user.
   A wrong key returns 400 with a problem-details body.
