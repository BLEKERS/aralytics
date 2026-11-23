-- In-progress quiz answers, one row per student per quiz. Replaces the in-memory draft map.
CREATE TABLE `QUIZ_DRAFT` (
    `id`            BIGINT      NOT NULL AUTO_INCREMENT,
    `student_id`    BIGINT      NOT NULL,
    `quiz_id`       BIGINT      NOT NULL,
    `answers_json`  TEXT        NOT NULL,
    `last_saved_at` DATETIME(6) NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_quiz_draft_student_quiz` (`student_id`, `quiz_id`),
    KEY `idx_quiz_draft_quiz` (`quiz_id`),
    CONSTRAINT `fk_quiz_draft_student`
        FOREIGN KEY (`student_id`) REFERENCES `USER` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_quiz_draft_quiz`
        FOREIGN KEY (`quiz_id`) REFERENCES `QUIZ` (`id`) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
