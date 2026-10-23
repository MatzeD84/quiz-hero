CREATE TABLE IF NOT EXISTS quiz_worlds (
    id VARCHAR(120) PRIMARY KEY,
    title VARCHAR(120) NOT NULL,
    description VARCHAR(255) NOT NULL DEFAULT '',
    enabled TINYINT(1) NOT NULL DEFAULT 1,
    revision INT UNSIGNED NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS quiz_question_worlds (
    question_id INT UNSIGNED NOT NULL,
    world_id VARCHAR(120) NOT NULL,
    PRIMARY KEY (question_id, world_id),
    INDEX idx_question_worlds_world (world_id, question_id),
    CONSTRAINT fk_question_worlds_question FOREIGN KEY (question_id) REFERENCES quiz_questions(id) ON DELETE CASCADE,
    CONSTRAINT fk_question_worlds_world FOREIGN KEY (world_id) REFERENCES quiz_worlds(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO quiz_worlds(id,title,description) VALUES ('italien','Italien','Entdecke Italien und seine Städte.');
-- Only the existing Italian city categories; unrelated future categories are not inferred.
INSERT IGNORE INTO quiz_question_worlds(question_id,world_id)
SELECT q.id,'italien' FROM quiz_questions q WHERE q.category_id IN ('rom','neapel','florenz','amalfi','siena')
AND NOT EXISTS (SELECT 1 FROM quiz_question_worlds qw WHERE qw.question_id=q.id);

SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE quiz_rounds ADD COLUMN world_id VARCHAR(120) NULL, ADD COLUMN world_title VARCHAR(120) NULL', 'SELECT 1') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'quiz_rounds' AND COLUMN_NAME = 'world_id');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE quiz_results ADD COLUMN world_id VARCHAR(120) NULL, ADD COLUMN world_title VARCHAR(120) NULL', 'SELECT 1') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'quiz_results' AND COLUMN_NAME = 'world_id');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
