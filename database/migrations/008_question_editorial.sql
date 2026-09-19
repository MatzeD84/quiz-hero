-- Safe for fresh installations and snapshots that already include this column.
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE quiz_questions ADD COLUMN editorial_json JSON NULL AFTER background_knowledge', 'SELECT 1') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'quiz_questions' AND COLUMN_NAME = 'editorial_json');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
