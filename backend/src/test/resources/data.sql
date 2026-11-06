-- H2-compatible equivalent of src/main/resources/db/seed/V2__seed_dev.sql.
-- Loaded by Spring SQL init only under the test profile.

INSERT INTO subscription (id, plan, startDate, endDate, status, maxStudents, maxTeachers)
VALUES (1, 'Pilot Annual', DATE '2026-01-01', DATE '2027-12-31', 'ACTIVE', 500, 25);

INSERT INTO school (id, name, address, contactEmail, institutionCode, subscriptionId)
VALUES (1, 'St. Jude Academy Manila', 'Quezon City, Metro Manila', 'registrar@stjude.edu.ph',
        'STJUDE-MNL-2025', 1);

INSERT INTO "user" (id, username, passwordHash, fullName, email, schoolId, role, createdAt, lastLogin)
VALUES (1, 't2024-0104', '$2b$10$giCJ3yA82JyISJZ378g3PeHEdRosNj6gblquGkYtvlRyBlIiQr5hO',
        'Maria Santos', 'maria.santos@university.edu.ph', 1, 'TEACHER', CURRENT_TIMESTAMP, NULL),
       (2, 's2024-9102', '$2b$10$iOfI2QJeGwHrorWndT2Ve.1BfQn3PYF5Ud./8AurNut.kk3QRuY1y',
        'Miguel Reyes', 'miguel@school.edu.ph', 1, 'STUDENT', CURRENT_TIMESTAMP, NULL);

INSERT INTO "class" (id, name, schoolId, teacherId)
VALUES (1, 'CS 101: Intro to Python (Sec A)', 1, 1);

INSERT INTO enrollment (id, studentId, classId)
VALUES (1, 2, 1);

INSERT INTO concept (id, name, description)
VALUES (1, 'Variables', 'Naming, assigning, and updating values'),
       (2, 'Data Types', 'Choosing and converting Python types'),
       (3, 'Loops', 'for/while iteration and range semantics'),
       (4, 'Conditionals', 'if/elif/else branching and loop conditions'),
       (5, 'Functions', 'Defining and calling reusable code');

INSERT INTO quiz (id, title, description, classId, createdBy, dueDate, status)
VALUES (1, 'Debugging Python Loops',
        'Find the bug in short loop snippets and choose the correction.',
        1, 1, DATEADD('DAY', 10, CURRENT_TIMESTAMP), 'PUBLISHED'),
       (2, 'Variables and Data Types',
        'Check how values are stored, named, and converted.',
        1, 1, DATEADD('DAY', 4, CURRENT_TIMESTAMP), 'PUBLISHED'),
       (3, 'Functions Practice',
        'Draft activity covering function definition and return values.',
        1, 1, DATEADD('DAY', 20, CURRENT_TIMESTAMP), 'DRAFT');

INSERT INTO question (id, quizId, text, options, correctAnswer, points)
VALUES (1, 1, 'How many times does the loop body run for range(3)?',
        '[{"key":"A","text":"3 times"},{"key":"B","text":"2 times"},{"key":"C","text":"4 times"},{"key":"D","text":"0 times"}]' FORMAT JSON,
        'A', 1),
       (2, 1, 'Which change fixes a while loop whose condition never becomes false?',
        '[{"key":"A","text":"Add more print statements"},{"key":"B","text":"Update the variable used in the condition inside the loop"},{"key":"C","text":"Wrap the loop in a function"},{"key":"D","text":"Change while to for without editing the body"}]' FORMAT JSON,
        'B', 1),
       (3, 1, 'What is len(range(2, 8, 2))?',
        '[{"key":"A","text":"3"},{"key":"B","text":"4"},{"key":"C","text":"2"},{"key":"D","text":"6"}]' FORMAT JSON,
        'A', 1),
       (4, 2, 'Which Python type stores True or False?',
        '[{"key":"A","text":"int"},{"key":"B","text":"bool"},{"key":"C","text":"str"},{"key":"D","text":"list"}]' FORMAT JSON,
        'B', 1),
       (5, 2, 'What is the value of x after: x = 5; x += 3?',
        '[{"key":"A","text":"5"},{"key":"B","text":"3"},{"key":"C","text":"8"},{"key":"D","text":"53"}]' FORMAT JSON,
        'C', 1),
       (6, 3, 'Which keyword defines a function in Python?',
        '[{"key":"A","text":"function"},{"key":"B","text":"fun"},{"key":"C","text":"def"},{"key":"D","text":"lambda only"}]' FORMAT JSON,
        'C', 1);

INSERT INTO question_concept (questionId, conceptId)
VALUES (1, 3), (1, 1),
       (2, 3), (2, 4),
       (3, 3),
       (4, 2), (4, 1),
       (5, 1),
       (6, 5);

INSERT INTO submission (id, studentId, quizId, score, submittedAt)
VALUES (1, 2, 2, 50.00, DATEADD('DAY', -2, CURRENT_TIMESTAMP));

INSERT INTO answer (id, submissionId, questionId, selectedOption, isCorrect)
VALUES (1, 1, 4, 'B', TRUE),
       (2, 1, 5, 'A', FALSE);

INSERT INTO feedback (id, submissionId, studentId, content, generatedAt)
VALUES (1, 1, 2,
        'You scored 50% on Variables and Data Types, and that gives us a useful place to focus next. You handled Data Types well, and that strength is worth keeping. When you review Variables, trace what happens step by step and explain the decision in your own words before choosing an answer.',
        DATEADD('DAY', -2, CURRENT_TIMESTAMP));

INSERT INTO feedback_concept (feedbackId, conceptId)
VALUES (1, 1), (1, 2);

INSERT INTO progress_record (id, studentId, conceptId, masteryLevel, lastUpdated)
VALUES (1, 2, 1, 50, DATEADD('DAY', -2, CURRENT_TIMESTAMP)),
       (2, 2, 2, 100, DATEADD('DAY', -2, CURRENT_TIMESTAMP));

-- Explicit IDs above must not collide with identities used by activation/authoring tests.
ALTER TABLE subscription ALTER COLUMN id RESTART WITH 100;
ALTER TABLE school ALTER COLUMN id RESTART WITH 100;
ALTER TABLE "user" ALTER COLUMN id RESTART WITH 100;
ALTER TABLE "class" ALTER COLUMN id RESTART WITH 100;
ALTER TABLE enrollment ALTER COLUMN id RESTART WITH 100;
ALTER TABLE concept ALTER COLUMN id RESTART WITH 100;
ALTER TABLE quiz ALTER COLUMN id RESTART WITH 100;
ALTER TABLE question ALTER COLUMN id RESTART WITH 100;
ALTER TABLE submission ALTER COLUMN id RESTART WITH 100;
ALTER TABLE answer ALTER COLUMN id RESTART WITH 100;
ALTER TABLE feedback ALTER COLUMN id RESTART WITH 100;
ALTER TABLE progress_record ALTER COLUMN id RESTART WITH 100;
