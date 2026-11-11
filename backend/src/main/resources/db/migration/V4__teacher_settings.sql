-- Phase 3: per-teacher classroom preferences (PRD FR-SET).
CREATE TABLE `TEACHER_SETTINGS` (
    `id`                    BIGINT      NOT NULL AUTO_INCREMENT,
    `teacherId`             BIGINT      NOT NULL,
    `interventionThreshold` INT         NOT NULL DEFAULT 70,
    `feedbackTone`          VARCHAR(32) NOT NULL DEFAULT 'FORMAL',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_teacher_settings_teacher` (`teacherId`),
    CONSTRAINT `fk_teacher_settings_teacher`
        FOREIGN KEY (`teacherId`) REFERENCES `USER` (`id`),
    CONSTRAINT `chk_teacher_settings_threshold`
        CHECK (`interventionThreshold` >= 0 AND `interventionThreshold` <= 100)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
