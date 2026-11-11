-- Per-school activation keys. Only the SHA-256 hash is stored; keys are provisioned
-- out-of-band (no default global keys live in configuration any more).
ALTER TABLE `SCHOOL`
    ADD COLUMN `studentActivationKeyHash` CHAR(64) NULL AFTER `institutionCode`,
    ADD COLUMN `teacherActivationKeyHash` CHAR(64) NULL AFTER `studentActivationKeyHash`;
