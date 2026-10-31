CREATE TABLE IF NOT EXISTS quiz_abilities (
 id VARCHAR(80) PRIMARY KEY,
 title VARCHAR(120) NOT NULL,
 description VARCHAR(500) NOT NULL,
 effect VARCHAR(40) NOT NULL,
 scope VARCHAR(20) NOT NULL DEFAULT 'hero',
 rounds_required INT UNSIGNED NOT NULL DEFAULT 3,
 enabled TINYINT(1) NOT NULL DEFAULT 1,
 revision INT UNSIGNED NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS quiz_hero_abilities (
 avatar_key VARCHAR(80) NOT NULL,
 ability_id VARCHAR(80) NOT NULL,
 is_basic TINYINT(1) NOT NULL DEFAULT 0,
 PRIMARY KEY(avatar_key,ability_id),
 FOREIGN KEY(avatar_key) REFERENCES quiz_avatars(avatar_key) ON DELETE CASCADE,
 FOREIGN KEY(ability_id) REFERENCES quiz_abilities(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS quiz_user_abilities (
 user_id INT UNSIGNED NOT NULL,
 ability_id VARCHAR(80) NOT NULL,
 hero_key VARCHAR(80) NOT NULL DEFAULT '',
 source_result_id BIGINT UNSIGNED NULL,
 awarded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY(user_id,ability_id,hero_key),
 FOREIGN KEY(user_id) REFERENCES quiz_users(id) ON DELETE CASCADE,
 FOREIGN KEY(ability_id) REFERENCES quiz_abilities(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS quiz_ability_equipment (
 user_id INT UNSIGNED NOT NULL,
 hero_key VARCHAR(80) NOT NULL,
 ability_id VARCHAR(80) NULL,
 PRIMARY KEY(user_id,hero_key),
 FOREIGN KEY(user_id) REFERENCES quiz_users(id) ON DELETE CASCADE,
 FOREIGN KEY(ability_id) REFERENCES quiz_abilities(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS quiz_round_abilities (
 round_id CHAR(64) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
 snapshot_json JSON NOT NULL,
 action_json JSON NULL,
 FOREIGN KEY(round_id) REFERENCES quiz_rounds(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS quiz_hero_round_history (
 result_id BIGINT UNSIGNED PRIMARY KEY,
 user_id INT UNSIGNED NOT NULL,
 hero_key VARCHAR(80) NOT NULL,
 answered_count INT UNSIGNED NOT NULL,
 ability_json JSON NULL,
 action_json JSON NULL,
 INDEX idx_hero_history(user_id,hero_key),
 FOREIGN KEY(result_id) REFERENCES quiz_results(id) ON DELETE CASCADE,
 FOREIGN KEY(user_id) REFERENCES quiz_users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE quiz_question_results ADD COLUMN assisted_ability VARCHAR(80) NULL', 'SELECT 1') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='quiz_question_results' AND COLUMN_NAME='assisted_ability');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
INSERT IGNORE INTO quiz_abilities(id,title,description,effect) VALUES
 ('heldenblick','Heldenblick','Nach dem ersten Fehlversuch eine weitere falsche Antwort ausblenden.','eliminate'),
 ('schutzschild','Schutzschild','Nach dem ersten Fehlversuch ausrüsten: Bei richtiger zweiter Antwort gibt es zwei statt eines Punktes.','shield'),
 ('neues-abenteuer','Neues Abenteuer','Eine unbeantwortete Frage durch eine andere derselben Kategorie ersetzen, bevorzugt mit gleicher Schwierigkeit.','swap');
INSERT IGNORE INTO quiz_hero_abilities(avatar_key,ability_id,is_basic)
SELECT avatar_key,CASE MOD(sort_order,3) WHEN 0 THEN 'heldenblick' WHEN 1 THEN 'schutzschild' ELSE 'neues-abenteuer' END,1
FROM quiz_avatars WHERE deleted_at IS NULL
AND NOT EXISTS (SELECT 1 FROM schema_migrations WHERE version='022_hero_abilities.sql');
