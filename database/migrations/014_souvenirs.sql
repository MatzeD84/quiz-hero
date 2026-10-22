-- Historical category: never guess old topic-question categories from today's catalog.
SET @sql = (SELECT IF(COUNT(*)=0,'ALTER TABLE quiz_question_results ADD COLUMN category_id_at_play VARCHAR(120) NULL, ADD INDEX idx_question_discoveries(user_id,category_id_at_play,question_id,outcome)','SELECT 1') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='quiz_question_results' AND COLUMN_NAME='category_id_at_play');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
UPDATE quiz_question_results d JOIN quiz_results r ON r.id=d.result_id
SET d.category_id_at_play=r.category_id WHERE r.category_id IS NOT NULL AND d.category_id_at_play IS NULL;

CREATE TABLE IF NOT EXISTS quiz_souvenir_definitions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    souvenir_key VARCHAR(120) NOT NULL,
    revision INT UNSIGNED NOT NULL,
    category_id VARCHAR(120) NOT NULL,
    title VARCHAR(120) NOT NULL,
    description VARCHAR(1000) NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    rule_type ENUM('first_visit','discover') NOT NULL,
    target INT UNSIGNED NOT NULL DEFAULT 1,
    state ENUM('draft','active','archived') NOT NULL DEFAULT 'draft',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_souvenir_revision(souvenir_key,revision)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS quiz_user_souvenirs (
    user_id INT UNSIGNED NOT NULL,
    souvenir_key VARCHAR(120) NOT NULL,
    definition_id BIGINT UNSIGNED NOT NULL,
    awarded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    source_result_id BIGINT UNSIGNED NULL,
    is_backfill TINYINT(1) NOT NULL DEFAULT 0,
    PRIMARY KEY(user_id,souvenir_key),
    CONSTRAINT fk_souvenir_user FOREIGN KEY(user_id) REFERENCES quiz_users(id) ON DELETE CASCADE,
    CONSTRAINT fk_souvenir_definition FOREIGN KEY(definition_id) REFERENCES quiz_souvenir_definitions(id) ON DELETE RESTRICT,
    CONSTRAINT fk_souvenir_result FOREIGN KEY(source_result_id) REFERENCES quiz_results(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO quiz_souvenir_definitions(souvenir_key,revision,category_id,title,description,image_url,rule_type,target,state) VALUES
('rom-first-visit',1,'rom','Rom besucht','Dein erster Halt in der Ewigen Stadt. Die Reise hat gerade erst begonnen.','images/souvenirs/rom-stamp-v1.png','first_visit',1,'active'),
('rom-discoverer',1,'rom','Deine römische Reisemarke','Zwischen antiken Gassen und neuen Geschichten: ein Stück Rom gehört jetzt zu deiner Sammlung.','images/souvenirs/rom-token-v1.png','discover',20,'active');
