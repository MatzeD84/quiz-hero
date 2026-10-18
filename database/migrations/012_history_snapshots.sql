-- Shared immutable content; no FK to the editable/deletable question catalog.
CREATE TABLE IF NOT EXISTS quiz_question_versions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    question_id INT UNSIGNED NOT NULL,
    version_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    snapshot_json JSON NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_question_version (question_id, version_hash)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE quiz_question_results ADD COLUMN version_id BIGINT UNSIGNED NULL, ADD CONSTRAINT fk_question_result_version FOREIGN KEY (version_id) REFERENCES quiz_question_versions(id) ON DELETE RESTRICT', 'SELECT 1') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'quiz_question_results' AND COLUMN_NAME = 'version_id');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE quiz_rounds ADD COLUMN category_title VARCHAR(255) NULL, ADD COLUMN tag_title VARCHAR(255) NULL', 'SELECT 1') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'quiz_rounds' AND COLUMN_NAME = 'category_title');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE quiz_results ADD COLUMN category_title VARCHAR(255) NULL, ADD COLUMN tag_title VARCHAR(255) NULL', 'SELECT 1') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'quiz_results' AND COLUMN_NAME = 'category_title');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
