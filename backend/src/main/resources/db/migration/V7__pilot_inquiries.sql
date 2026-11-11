-- Landing-page pilot enquiries. Written by POST /api/public/pilot-inquiry.
CREATE TABLE `PILOT_INQUIRY` (
    `id`           BIGINT       NOT NULL AUTO_INCREMENT,
    `school_name`  VARCHAR(160) NULL,
    `contact_name` VARCHAR(160) NULL,
    `email`        VARCHAR(160) NOT NULL,
    `message`      TEXT         NULL,
    `created_at`   DATETIME(6)  NOT NULL,
    PRIMARY KEY (`id`),
    KEY `idx_pilot_inquiry_created` (`created_at`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
