-- Password reset links: one active token per user, valid for 15 minutes.
CREATE TABLE `PASSWORD_RESET_TOKENS` (
    `id`          BIGINT       NOT NULL AUTO_INCREMENT,
    `token`       VARCHAR(64)  NOT NULL,
    `user_id`     BIGINT       NOT NULL,
    `expiry_date` DATETIME(6)  NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_password_reset_token` (`token`),
    CONSTRAINT `fk_password_reset_user`
        FOREIGN KEY (`user_id`) REFERENCES `USER` (`id`) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
