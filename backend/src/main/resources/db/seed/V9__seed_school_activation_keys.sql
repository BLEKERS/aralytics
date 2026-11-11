-- Demo-only school keys. Hashes of the documented dev keys:
--   student KEY-8821-PY, teacher FAC-2025-DEPED
UPDATE `SCHOOL`
SET `studentActivationKeyHash` = '00c89af703d0f965a4e9b2c8b03e0a5dce45f19b8032a45c63d3a7369ee1697d',
    `teacherActivationKeyHash` = '7245d52f03542151236b35a9a5597777cc4c236da5cbcce4ad5cc66740127977'
WHERE `institutionCode` = 'STJUDE-MNL-2025';
