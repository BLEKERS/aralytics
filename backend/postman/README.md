# Aralytics API — Postman Testing Guide

## 1. Overview

This folder contains the Postman collection for the Aralytics backend:

- `Aralytics_API.postman_collection.json`

It tests the live Spring Boot API and is organised into three folders:

| Folder | What it covers |
|---|---|
| `1. Authentication` | Student/teacher login (issues the JWT) and school-key verification |
| `2. Student Endpoints` | Dashboard, activities, quiz, submit, feedback |
| `3. Teacher Endpoints` | Dashboard, roster, create draft activity, CSV export |

Every request in folders 2 and 3 sends a real `Authorization: Bearer <JWT>` header. The JWT is
not typed by hand: the login requests save it into a collection variable automatically.

---

## 2. Prerequisites

1. **Backend running on `http://localhost:8080`.** From the repo root:

   ```powershell
   $env:GMAIL_USERNAME="you@gmail.com"
   $env:GMAIL_APP_PASSWORD="your-16-character-app-password"
   cd backend
   .\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=dev,seed"
   ```

   - `dev` enables the API and Swagger UI.
   - `seed` creates the demo school, teacher, student, classes, quizzes, submission and feedback.
   - The two Gmail variables are required to boot `dev` (password-reset mail); any non-empty
     value is enough for this demo.
   - Wait for `Started AralyticsApplication`.

2. **A Postman workspace.** Import `Aralytics_API.postman_collection.json`:
   **Import → Files → select the file → Import**. The collection **Aralytics API** appears in the
   left sidebar. Its **Variables** tab contains `baseUrl` (`http://localhost:8080`),
   `studentToken` and `teacherToken` (both blank until you log in).

3. **Demo accounts** (already inside the login request bodies):

   - Student: `miguel@school.edu.ph` / `student123`
   - Teacher: `maria.santos@university.edu.ph` / `teacher123`

---

## 3. How to Run the Tests (Step-by-Step)

### Step 1 — Run the Login first

Open **`1. Authentication`** and click **Send** on:

- **Login (Student)** — fills `{{studentToken}}`
- **Login (Teacher)** — fills `{{teacherToken}}`

You do **not** need both for every request, but you need the matching one: student endpoints use
`studentToken`, teacher endpoints use `teacherToken`.

### Step 2 — Watch the token save itself

After **Send**, open the **Test Results** tab at the bottom of the response. Each login runs this
test script:

```js
const body = pm.response.json();
pm.collectionVariables.set('studentToken', body.token);   // teacherToken for the teacher login
pm.test('studentToken saved', function () {
    pm.expect(body.token).to.be.a('string').and.not.empty;
});
```

You should see `200 OK` and `studentToken saved` pass. To see the stored value, open the
collection → **Variables** tab, or the request's **Authorization** tab and hover
`{{studentToken}}`.

### Step 3 — Run the endpoints

Click any request in **`2. Student Endpoints`** or **`3. Teacher Endpoints`** and press **Send**.
The Authorization tab already reads **Bearer Token** → `{{studentToken}}` or `{{teacherToken}}`,
so it sends the token saved in Step 1.

If you press Send before logging in, the token placeholder is empty and the API returns **401**.

---

## 4. Demo Walkthrough (What to Expect)

| Request | Expected | What it proves |
|---|---|---|
| `POST /api/auth/login` (Student or Teacher) | **200 OK**, returns `token` | Credentials are checked and a JWT is issued |
| `GET /api/teacher/dashboard` (Teacher token) | **200 OK**, class data | Bearer token is accepted; teacher endpoints work |
| `GET /api/teacher/dashboard` (Student token) | **403 Forbidden** | Role-Based Access Control: a student cannot read teacher data |
| `POST /api/student/quiz/1/submit` | **200 OK**, returns score + mock AI feedback | Quiz scoring and diagnostic feedback pipeline |
| `GET /api/teacher/reports/export-csv` | **200 OK**, `text/csv` | Report generation; use **Send and Download** to save the file |

**To demonstrate the 403:** open `GET /api/teacher/dashboard`, go to the **Authorization** tab,
change the token from `{{teacherToken}}` to `{{studentToken}}`, and click Send. You get
`403 Forbidden` because `/api/teacher/**` requires the `TEACHER` role. Change it back afterwards.

**To run Submit Quiz:** it sends answers for questions 1–3 of quiz 1 and returns
`200 OK` with `score: 66.67` and `feedbackStatus: "READY"`. It works once per database because
the submission is saved; a second attempt returns **409**. If you need to repeat it, restart the
database with a fresh seed (see Troubleshooting).

**Export CSV:** click the arrow next to **Send** and choose **Send and Download**; Postman saves
the `.csv` file instead of rendering it.

---

## 5. Troubleshooting

**401 Unauthorized**

- The login request has not been run, so `{{studentToken}}` / `{{teacherToken}}` is still empty.
- Or the JWT expired. Tokens last **120 minutes** by default; re-run the matching Login request
  and Send again.

**409 Conflict**

- The quiz was already submitted for this student. `POST /api/student/quiz/1/submit` works once
  per database. Re-seed (drop/recreate the `aralytics` schema and restart with `dev,seed`) if you
  need a clean run.

**403 Forbidden**

- You are calling a Teacher endpoint with a Student token, or a Student endpoint with a Teacher
  token. This is expected RBAC behaviour, not a server error. Check which `{{...Token}}` the
  request's Authorization tab uses.

**Connection refused**

- The backend is not on port 8080 or is still starting. Confirm the Maven command is still
  running and wait for `Started AralyticsApplication`.
