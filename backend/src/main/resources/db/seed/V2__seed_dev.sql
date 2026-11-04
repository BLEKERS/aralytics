-- Development-only demo data. Applied only by the dev profile because application-dev.yml
-- adds classpath:db/seed to the Flyway locations. Never include this location in production.
--
-- Seeded credentials (match SETUP.md):
--   teacher  maria.santos@university.edu.ph / t2024-0104 / teacher123
--   student  miguel@school.edu.ph            / s2024-9102 / student123
--   school   STJUDE-MNL-2025
--   keys     KEY-8821-PY (student), FAC-2025-DEPED (teacher)

INSERT INTO `SUBSCRIPTION` (`id`, `plan`, `startDate`, `endDate`, `status`, `maxStudents`, `maxTeachers`)
VALUES (1, 'Pilot Annual', '2026-01-01', '2027-12-31', 'ACTIVE', 500, 25);

INSERT INTO `SCHOOL` (`id`, `name`, `address`, `contactEmail`, `institutionCode`, `subscriptionId`)
VALUES (1, 'St. Jude Academy Manila', 'Quezon City, Metro Manila', 'registrar@stjude.edu.ph',
        'STJUDE-MNL-2025', 1);

INSERT INTO `USER` (`id`, `username`, `passwordHash`, `fullName`, `email`, `schoolId`, `role`,
                    `createdAt`, `lastLogin`)
VALUES (1, 't2024-0104', '$2b$10$giCJ3yA82JyISJZ378g3PeHEdRosNj6gblquGkYtvlRyBlIiQr5hO',
        'Maria Santos', 'maria.santos@university.edu.ph', 1, 'TEACHER', NOW(), NULL),
       (2, 's2024-9102', '$2b$10$iOfI2QJeGwHrorWndT2Ve.1BfQn3PYF5Ud./8AurNut.kk3QRuY1y',
        'Miguel Reyes', 'miguel@school.edu.ph', 1, 'STUDENT', NOW(), NULL);

INSERT INTO `CLASS` (`id`, `name`, `schoolId`, `teacherId`)
VALUES (1, 'CS 101: Intro to Python (Sec A)', 1, 1);

INSERT INTO `ENROLLMENT` (`id`, `studentId`, `classId`)
VALUES (1, 2, 1);

INSERT INTO `CONCEPT` (`id`, `name`, `description`)
VALUES (1, 'Variables', 'Naming, assigning, and updating values'),
       (2, 'Data Types', 'Choosing and converting Python types'),
       (3, 'Loops', 'for/while iteration and range semantics'),
       (4, 'Conditionals', 'if/elif/else branching and loop conditions'),
       (5, 'Functions', 'Defining and calling reusable code');

INSERT INTO `QUIZ` (`id`, `title`, `description`, `classId`, `createdBy`, `dueDate`, `status`)
VALUES (1, 'Debugging Python Loops',
        'Find the bug in short loop snippets and choose the correction.',
        1, 1, DATE_ADD(NOW(), INTERVAL 10 DAY), 'PUBLISHED'),
       (2, 'Variables and Data Types',
        'Check how values are stored, named, and converted.',
        1, 1, DATE_ADD(NOW(), INTERVAL 4 DAY), 'PUBLISHED'),
       (3, 'Functions Practice',
        'Draft activity covering function definition and return values.',
        1, 1, DATE_ADD(NOW(), INTERVAL 20 DAY), 'DRAFT');

INSERT INTO `QUESTION` (`id`, `quizId`, `text`, `options`, `correctAnswer`, `points`)
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

INSERT INTO `QUESTION_CONCEPT` (`questionId`, `conceptId`)
VALUES (1, 3), (1, 1),
       (2, 3), (2, 4),
       (3, 3),
       (4, 2), (4, 1),
       (5, 1),
       (6, 5);

-- One completed activity so the student dashboard and teacher roster are not empty.
INSERT INTO `SUBMISSION` (`id`, `studentId`, `quizId`, `score`, `submittedAt`)
VALUES (1, 2, 2, 50.00, DATE_SUB(NOW(), INTERVAL 2 DAY));

INSERT INTO `ANSWER` (`id`, `submissionId`, `questionId`, `selectedOption`, `isCorrect`)
VALUES (1, 1, 4, 'B', TRUE),
       (2, 1, 5, 'A', FALSE);

INSERT INTO `FEEDBACK` (`id`, `submissionId`, `studentId`, `content`, `generatedAt`)
VALUES (1, 1, 2,
        'You scored 50% on Variables and Data Types, and that gives us a useful place to focus next. You handled Data Types well, and that strength is worth keeping. When you review Variables, trace what happens step by step and explain the decision in your own words before choosing an answer.',
        DATE_SUB(NOW(), INTERVAL 2 DAY));

INSERT INTO `FEEDBACK_CONCEPT` (`feedbackId`, `conceptId`)
VALUES (1, 1), (1, 2);

INSERT INTO `PROGRESS_RECORD` (`id`, `studentId`, `conceptId`, `masteryLevel`, `lastUpdated`)
VALUES (1, 2, 1, 50, DATE_SUB(NOW(), INTERVAL 2 DAY)),
       (2, 2, 2, 100, DATE_SUB(NOW(), INTERVAL 2 DAY));
