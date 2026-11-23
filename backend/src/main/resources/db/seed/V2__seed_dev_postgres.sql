-- Development-only demo data (PostgreSQL). Applied only by the opt-in `seed` profile
-- because application-seed.yml adds classpath:db/seed to the Flyway locations.
-- Replaces the legacy MySQL V2 + V9 seeds (preserved under db/migration_mysql_legacy).
--   teacher  maria.santos@university.edu.ph / teacher123
--   student  miguel@school.edu.ph            / student123
--   school   STJUDE-MNL-2025 (keys KEY-8821-PY / FAC-2025-DEPED)

INSERT INTO subscription (id, plan, startDate, endDate, status, maxStudents, maxTeachers)
VALUES (1, 'Pilot Annual', DATE '2026-01-01', DATE '2027-12-31', 'ACTIVE', 500, 25);

INSERT INTO school (id, name, address, contactEmail, institutionCode,
                    studentActivationKeyHash, teacherActivationKeyHash, subscriptionId)
VALUES (1, 'St. Jude Academy Manila', 'Quezon City, Metro Manila', 'registrar@stjude.edu.ph',
        'STJUDE-MNL-2025',
        '00c89af703d0f965a4e9b2c8b03e0a5dce45f19b8032a45c63d3a7369ee1697d',
        '7245d52f03542151236b35a9a5597777cc4c236da5cbcce4ad5cc66740127977', 1);

INSERT INTO app_user (id, username, passwordHash, fullName, email, schoolId, role, createdAt, lastLogin)
VALUES (1, 't2024-0104', '$2a$10$WIGw9imUmR2zg13nXR1YUenMuWa67NlULd74X/jp2BJgvWLYh963S',
        'Maria Santos', 'maria.santos@university.edu.ph', 1, 'TEACHER', now(), NULL),
       (2, 's2024-9102', '$2a$10$qG0fHDRw6W2TwXTvlQQYXu2FMHR0GS4jbyruHh.VKxrGQ1xQGb6si',
        'Miguel Reyes', 'miguel@school.edu.ph', 1, 'STUDENT', now(), NULL);

INSERT INTO class (id, name, schoolId, teacherId)
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
        1, 1, now() + interval '10 days', 'PUBLISHED'),
       (2, 'Variables and Data Types',
        'Check how values are stored, named, and converted.',
        1, 1, now() + interval '4 days', 'PUBLISHED'),
       (3, 'Functions Practice',
        'Draft activity covering function definition and return values.',
        1, 1, now() + interval '20 days', 'DRAFT');

INSERT INTO question (id, quizId, text, options, correctAnswer, points)
VALUES (1, 1, 'How many times does the loop body run for range(3)?',
        '[{"key":"A","text":"3 times"},{"key":"B","text":"2 times"},{"key":"C","text":"4 times"},{"key":"D","text":"0 times"}]',
        'A', 1),
       (2, 1, 'Which change fixes a while loop whose condition never becomes false?',
        '[{"key":"A","text":"Add more print statements"},{"key":"B","text":"Update the variable used in the condition inside the loop"},{"key":"C","text":"Wrap the loop in a function"},{"key":"D","text":"Change while to for without editing the body"}]',
        'B', 1),
       (3, 1, 'What is len(range(2, 8, 2))?',
        '[{"key":"A","text":"3"},{"key":"B","text":"4"},{"key":"C","text":"2"},{"key":"D","text":"6"}]',
        'A', 1),
       (4, 2, 'Which Python type stores True or False?',
        '[{"key":"A","text":"int"},{"key":"B","text":"bool"},{"key":"C","text":"str"},{"key":"D","text":"list"}]',
        'B', 1),
       (5, 2, 'What is the value of x after: x = 5; x += 3?',
        '[{"key":"A","text":"5"},{"key":"B","text":"3"},{"key":"C","text":"8"},{"key":"D","text":"53"}]',
        'C', 1),
       (6, 3, 'Which keyword defines a function in Python?',
        '[{"key":"A","text":"function"},{"key":"B","text":"fun"},{"key":"C","text":"def"},{"key":"D","text":"lambda only"}]',
        'C', 1);

INSERT INTO question_concept (questionId, conceptId)
VALUES (1, 3), (1, 1),
       (2, 3), (2, 4),
       (3, 3),
       (4, 2), (4, 1),
       (5, 1),
       (6, 5);

-- One completed activity so the student dashboard and teacher roster are not empty.
INSERT INTO submission (id, studentId, quizId, score, submittedAt)
VALUES (1, 2, 2, 50.00, now() - interval '2 days');

INSERT INTO answer (id, submissionId, questionId, selectedOption, isCorrect)
VALUES (1, 1, 4, 'B', TRUE),
       (2, 1, 5, 'A', FALSE);

INSERT INTO feedback (id, submissionId, studentId, content, generatedAt)
VALUES (1, 1, 2,
        'You scored 50% on Variables and Data Types, and that gives us a useful place to focus next. You handled Data Types well, and that strength is worth keeping. When you review Variables, trace what happens step by step and explain the decision in your own words before choosing an answer.',
        now() - interval '2 days');

INSERT INTO feedback_concept (feedbackId, conceptId)
VALUES (1, 1), (1, 2);

INSERT INTO progress_record (id, studentId, conceptId, masteryLevel, lastUpdated)
VALUES (1, 2, 1, 50, now() - interval '2 days'),
       (2, 2, 2, 100, now() - interval '2 days');

-- Explicit IDs above must not collide with identity values generated at runtime.
SELECT setval(pg_get_serial_sequence('subscription', 'id'), 100, false);
SELECT setval(pg_get_serial_sequence('school', 'id'), 100, false);
SELECT setval(pg_get_serial_sequence('app_user', 'id'), 100, false);
SELECT setval(pg_get_serial_sequence('class', 'id'), 100, false);
SELECT setval(pg_get_serial_sequence('enrollment', 'id'), 100, false);
SELECT setval(pg_get_serial_sequence('concept', 'id'), 100, false);
SELECT setval(pg_get_serial_sequence('quiz', 'id'), 100, false);
SELECT setval(pg_get_serial_sequence('question', 'id'), 100, false);
SELECT setval(pg_get_serial_sequence('submission', 'id'), 100, false);
SELECT setval(pg_get_serial_sequence('answer', 'id'), 100, false);
SELECT setval(pg_get_serial_sequence('feedback', 'id'), 100, false);
SELECT setval(pg_get_serial_sequence('progress_record', 'id'), 100, false);
