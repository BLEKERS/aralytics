-- Aralytics ERD schema (MySQL 8).
-- Camel-case identifiers are intentional: they match the ERD and the JPA entities use
-- PhysicalNamingStrategyStandardImpl so Hibernate does not snake_case them.

CREATE TABLE `SUBSCRIPTION` (
    `id`          BIGINT      NOT NULL AUTO_INCREMENT,
    `plan`        VARCHAR(64) NOT NULL,
    `startDate`   DATE        NOT NULL,
    `endDate`     DATE        NOT NULL,
    `status`      VARCHAR(16) NOT NULL,
    `maxStudents` INT         NOT NULL,
    `maxTeachers` INT         NOT NULL,
    PRIMARY KEY (`id`),
    CONSTRAINT `chk_subscription_status`
        CHECK (`status` IN ('TRIAL', 'ACTIVE', 'EXPIRED', 'SUSPENDED'))
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE `SCHOOL` (
    `id`              BIGINT       NOT NULL AUTO_INCREMENT,
    `name`            VARCHAR(160) NOT NULL,
    `address`         VARCHAR(255) NULL,
    `contactEmail`    VARCHAR(160) NULL,
    `institutionCode` VARCHAR(64)  NOT NULL,
    `subscriptionId`  BIGINT       NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_school_institution_code` (`institutionCode`),
    KEY `idx_school_subscription` (`subscriptionId`),
    CONSTRAINT `fk_school_subscription`
        FOREIGN KEY (`subscriptionId`) REFERENCES `SUBSCRIPTION` (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE `USER` (
    `id`           BIGINT       NOT NULL AUTO_INCREMENT,
    `username`     VARCHAR(64)  NOT NULL,
    `passwordHash` VARCHAR(100) NOT NULL,
    `fullName`     VARCHAR(160) NOT NULL,
    `email`        VARCHAR(160) NOT NULL,
    `schoolId`     BIGINT       NULL,
    `role`         VARCHAR(16)  NOT NULL,
    `createdAt`    DATETIME(6)  NOT NULL,
    `lastLogin`    DATETIME(6)  NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_user_username` (`username`),
    UNIQUE KEY `uk_user_email` (`email`),
    KEY `idx_user_school` (`schoolId`),
    CONSTRAINT `fk_user_school`
        FOREIGN KEY (`schoolId`) REFERENCES `SCHOOL` (`id`),
    CONSTRAINT `chk_user_role`
        CHECK (`role` IN ('STUDENT', 'TEACHER'))
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE `CLASS` (
    `id`        BIGINT       NOT NULL AUTO_INCREMENT,
    `name`      VARCHAR(160) NOT NULL,
    `schoolId`  BIGINT       NOT NULL,
    `teacherId` BIGINT       NULL,
    PRIMARY KEY (`id`),
    KEY `idx_class_school` (`schoolId`),
    KEY `idx_class_teacher` (`teacherId`),
    CONSTRAINT `fk_class_school`
        FOREIGN KEY (`schoolId`) REFERENCES `SCHOOL` (`id`),
    CONSTRAINT `fk_class_teacher`
        FOREIGN KEY (`teacherId`) REFERENCES `USER` (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE `ENROLLMENT` (
    `id`        BIGINT NOT NULL AUTO_INCREMENT,
    `studentId` BIGINT NOT NULL,
    `classId`   BIGINT NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_enrollment_student_class` (`studentId`, `classId`),
    KEY `idx_enrollment_class` (`classId`),
    CONSTRAINT `fk_enrollment_student`
        FOREIGN KEY (`studentId`) REFERENCES `USER` (`id`),
    CONSTRAINT `fk_enrollment_class`
        FOREIGN KEY (`classId`) REFERENCES `CLASS` (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE `QUIZ` (
    `id`          BIGINT       NOT NULL AUTO_INCREMENT,
    `title`       VARCHAR(200) NOT NULL,
    `description` TEXT         NULL,
    `classId`     BIGINT       NOT NULL,
    `createdBy`   BIGINT       NOT NULL,
    `dueDate`     DATETIME(6)  NULL,
    `status`      VARCHAR(16)  NOT NULL DEFAULT 'DRAFT',
    PRIMARY KEY (`id`),
    KEY `idx_quiz_class` (`classId`),
    KEY `idx_quiz_created_by` (`createdBy`),
    CONSTRAINT `fk_quiz_class`
        FOREIGN KEY (`classId`) REFERENCES `CLASS` (`id`),
    CONSTRAINT `fk_quiz_created_by`
        FOREIGN KEY (`createdBy`) REFERENCES `USER` (`id`),
    CONSTRAINT `chk_quiz_status`
        CHECK (`status` IN ('DRAFT', 'PUBLISHED', 'CLOSED'))
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE `QUESTION` (
    `id`            BIGINT      NOT NULL AUTO_INCREMENT,
    `quizId`        BIGINT      NOT NULL,
    `text`          TEXT        NOT NULL,
    `options`       JSON        NOT NULL,
    `correctAnswer` VARCHAR(16) NOT NULL,
    `points`        INT         NOT NULL,
    PRIMARY KEY (`id`),
    KEY `idx_question_quiz` (`quizId`),
    CONSTRAINT `fk_question_quiz`
        FOREIGN KEY (`quizId`) REFERENCES `QUIZ` (`id`),
    CONSTRAINT `chk_question_points`
        CHECK (`points` >= 1)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE `CONCEPT` (
    `id`          BIGINT       NOT NULL AUTO_INCREMENT,
    `name`        VARCHAR(100) NOT NULL,
    `description` VARCHAR(255) NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_concept_name` (`name`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Additive table: the ERD links concepts to feedback but not to questions. Per-question
-- concept metadata is required by the diagnostic engine, so this join table was added.
CREATE TABLE `QUESTION_CONCEPT` (
    `questionId` BIGINT NOT NULL,
    `conceptId`  BIGINT NOT NULL,
    PRIMARY KEY (`questionId`, `conceptId`),
    KEY `idx_question_concept_concept` (`conceptId`),
    CONSTRAINT `fk_question_concept_question`
        FOREIGN KEY (`questionId`) REFERENCES `QUESTION` (`id`),
    CONSTRAINT `fk_question_concept_concept`
        FOREIGN KEY (`conceptId`) REFERENCES `CONCEPT` (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE `SUBMISSION` (
    `id`          BIGINT        NOT NULL AUTO_INCREMENT,
    `studentId`   BIGINT        NOT NULL,
    `quizId`      BIGINT        NOT NULL,
    `score`       DECIMAL(5, 2) NOT NULL,
    `submittedAt` DATETIME(6)   NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_submission_student_quiz` (`studentId`, `quizId`),
    KEY `idx_submission_quiz` (`quizId`),
    CONSTRAINT `fk_submission_student`
        FOREIGN KEY (`studentId`) REFERENCES `USER` (`id`),
    CONSTRAINT `fk_submission_quiz`
        FOREIGN KEY (`quizId`) REFERENCES `QUIZ` (`id`),
    CONSTRAINT `chk_submission_score`
        CHECK (`score` >= 0 AND `score` <= 100)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE `ANSWER` (
    `id`             BIGINT      NOT NULL AUTO_INCREMENT,
    `submissionId`   BIGINT      NOT NULL,
    `questionId`     BIGINT      NOT NULL,
    `selectedOption` VARCHAR(16) NULL,
    `isCorrect`      BOOLEAN     NOT NULL,
    PRIMARY KEY (`id`),
    KEY `idx_answer_submission` (`submissionId`),
    KEY `idx_answer_question` (`questionId`),
    CONSTRAINT `fk_answer_submission`
        FOREIGN KEY (`submissionId`) REFERENCES `SUBMISSION` (`id`),
    CONSTRAINT `fk_answer_question`
        FOREIGN KEY (`questionId`) REFERENCES `QUESTION` (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE `FEEDBACK` (
    `id`           BIGINT      NOT NULL AUTO_INCREMENT,
    `submissionId` BIGINT      NOT NULL,
    `studentId`    BIGINT      NOT NULL,
    `content`      TEXT        NOT NULL,
    `generatedAt`  DATETIME(6) NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_feedback_submission` (`submissionId`),
    KEY `idx_feedback_student` (`studentId`),
    CONSTRAINT `fk_feedback_submission`
        FOREIGN KEY (`submissionId`) REFERENCES `SUBMISSION` (`id`),
    CONSTRAINT `fk_feedback_student`
        FOREIGN KEY (`studentId`) REFERENCES `USER` (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE `FEEDBACK_CONCEPT` (
    `feedbackId` BIGINT NOT NULL,
    `conceptId`  BIGINT NOT NULL,
    PRIMARY KEY (`feedbackId`, `conceptId`),
    KEY `idx_feedback_concept_concept` (`conceptId`),
    CONSTRAINT `fk_feedback_concept_feedback`
        FOREIGN KEY (`feedbackId`) REFERENCES `FEEDBACK` (`id`),
    CONSTRAINT `fk_feedback_concept_concept`
        FOREIGN KEY (`conceptId`) REFERENCES `CONCEPT` (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE `PROGRESS_RECORD` (
    `id`           BIGINT      NOT NULL AUTO_INCREMENT,
    `studentId`    BIGINT      NOT NULL,
    `conceptId`    BIGINT      NOT NULL,
    `masteryLevel` INT         NOT NULL,
    `lastUpdated`  DATETIME(6) NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_progress_student_concept` (`studentId`, `conceptId`),
    KEY `idx_progress_concept` (`conceptId`),
    CONSTRAINT `fk_progress_student`
        FOREIGN KEY (`studentId`) REFERENCES `USER` (`id`),
    CONSTRAINT `fk_progress_concept`
        FOREIGN KEY (`conceptId`) REFERENCES `CONCEPT` (`id`),
    CONSTRAINT `chk_progress_mastery`
        CHECK (`masteryLevel` >= 0 AND `masteryLevel` <= 100)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE `NOTIFICATION` (
    `id`          BIGINT      NOT NULL AUTO_INCREMENT,
    `userId`      BIGINT      NOT NULL,
    `message`     TEXT        NOT NULL,
    `isRead`      BOOLEAN     NOT NULL DEFAULT FALSE,
    `scheduledAt` DATETIME(6) NULL,
    `sentAt`      DATETIME(6) NULL,
    PRIMARY KEY (`id`),
    KEY `idx_notification_user` (`userId`),
    CONSTRAINT `fk_notification_user`
        FOREIGN KEY (`userId`) REFERENCES `USER` (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
