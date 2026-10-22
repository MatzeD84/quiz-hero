-- Keep deleted keys as tombstones so replaying old seeds cannot resurrect them.
SET @sql = (SELECT IF(COUNT(*)=0,'ALTER TABLE quiz_avatars ADD COLUMN enabled TINYINT(1) NOT NULL DEFAULT 1','SELECT 1') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='quiz_avatars' AND COLUMN_NAME='enabled');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
SET @sql = (SELECT IF(COUNT(*)=0,'ALTER TABLE quiz_avatars ADD COLUMN deleted_at DATETIME NULL','SELECT 1') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='quiz_avatars' AND COLUMN_NAME='deleted_at');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
