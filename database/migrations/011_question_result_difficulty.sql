-- NULL preserves unknown difficulty in older history; never infer from today's catalog.
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE quiz_question_results ADD COLUMN difficulty ENUM(''easy'',''medium'',''hero'') NULL AFTER question_version', 'SELECT 1') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'quiz_question_results' AND COLUMN_NAME = 'difficulty');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
