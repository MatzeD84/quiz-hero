-- Also repairs installations created from the older snapshot containing reviewed.
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE quiz_questions ADD COLUMN reviewed TINYINT(1) NOT NULL DEFAULT 0 AFTER active', 'SELECT 1') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'quiz_questions' AND COLUMN_NAME = 'reviewed');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
