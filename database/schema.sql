-- Snapshot for first-time imports. New schema changes belong in database/migrations/.

CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(190) PRIMARY KEY,
    applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS quiz_categories (
    id VARCHAR(120) PRIMARY KEY,
    title VARCHAR(120) NOT NULL,
    description VARCHAR(255) DEFAULT '',
    seo_description TEXT NULL,
    icon VARCHAR(500) NULL,
    enabled TINYINT(1) NOT NULL DEFAULT 1,
    badge_json JSON NULL,
    sort_order INT NOT NULL DEFAULT 100,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS quiz_questions (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    category_id VARCHAR(120) NOT NULL,
    question TEXT NOT NULL,
    answers_json JSON NOT NULL,
    correct_index TINYINT UNSIGNED NOT NULL,
    difficulty ENUM('easy','medium','hero') NOT NULL DEFAULT 'easy',
    question_type ENUM('text','image') NOT NULL DEFAULT 'text',
    image_url VARCHAR(500) NULL,
    tags_json JSON NULL,
    background_knowledge TEXT NULL,
    editorial_json JSON NULL,
    active TINYINT(1) NOT NULL DEFAULT 1,
    reviewed TINYINT(1) NOT NULL DEFAULT 0,
    sort_order INT NOT NULL DEFAULT 100,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_quiz_questions_category FOREIGN KEY (category_id) REFERENCES quiz_categories(id) ON UPDATE CASCADE ON DELETE CASCADE,
    INDEX idx_quiz_questions_category_active (category_id, active, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS quiz_tags (
    id VARCHAR(120) PRIMARY KEY,
    title VARCHAR(120) NOT NULL,
    description VARCHAR(255) DEFAULT '',
    icon VARCHAR(500) DEFAULT '',
    enabled TINYINT(1) NOT NULL DEFAULT 1,
    badge_json JSON NULL,
    sort_order INT NOT NULL DEFAULT 100
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS quiz_feedback (
    feedback_key VARCHAR(80) PRIMARY KEY,
    messages_json JSON NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS quiz_users (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(80) NULL,
    email VARCHAR(190) NULL,
    password_hash VARCHAR(255) NULL,
    profile_image_url VARCHAR(500) NULL,
    avatar_key VARCHAR(80) NULL,
    email_verified_at DATETIME NULL,
    privacy_accepted_at DATETIME NULL,
    deleted_at DATETIME NULL,
    last_seen_at DATETIME NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_quiz_users_username (username),
    UNIQUE KEY uq_quiz_users_email (email),
    INDEX idx_quiz_users_deleted_at (deleted_at),
    INDEX idx_quiz_users_last_seen (last_seen_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS quiz_email_verifications (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    token_hash CHAR(64) NOT NULL,
    expires_at DATETIME NOT NULL,
    used_at DATETIME NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_quiz_email_verifications_user FOREIGN KEY (user_id) REFERENCES quiz_users(id) ON DELETE CASCADE,
    UNIQUE KEY uq_quiz_email_verifications_token_hash (token_hash),
    INDEX idx_quiz_email_verifications_user (user_id, used_at, expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS quiz_password_resets (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    token_hash CHAR(64) NOT NULL,
    expires_at DATETIME NOT NULL,
    used_at DATETIME NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_quiz_password_resets_user FOREIGN KEY (user_id) REFERENCES quiz_users(id) ON DELETE CASCADE,
    UNIQUE KEY uq_quiz_password_resets_token_hash (token_hash),
    INDEX idx_quiz_password_resets_user (user_id, used_at, expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS quiz_account_consents (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    consent_key VARCHAR(80) NOT NULL,
    consent_version VARCHAR(40) NOT NULL,
    accepted_at DATETIME NOT NULL,
    revoked_at DATETIME NULL,
    ip_hash CHAR(64) NULL,
    user_agent_hash CHAR(64) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_quiz_account_consents_user FOREIGN KEY (user_id) REFERENCES quiz_users(id) ON DELETE CASCADE,
    INDEX idx_quiz_account_consents_user_key (user_id, consent_key, revoked_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS quiz_results (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NULL,
    category_id VARCHAR(120) NULL,
    tag_id VARCHAR(120) NULL,
    score INT UNSIGNED NOT NULL DEFAULT 0,
    max_score INT UNSIGNED NOT NULL DEFAULT 0,
    solved INT UNSIGNED NOT NULL DEFAULT 0,
    total_questions INT UNSIGNED NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_quiz_results_user FOREIGN KEY (user_id) REFERENCES quiz_users(id) ON DELETE SET NULL,
    INDEX idx_quiz_results_user_created (user_id, created_at),
    INDEX idx_quiz_results_category (category_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS quiz_question_feedback (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    question_id INT UNSIGNED NOT NULL,
    user_id INT UNSIGNED NULL,
    types_json JSON NOT NULL,
    comment TEXT NULL,
    user_agent_hash CHAR(64) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_quiz_question_feedback_question FOREIGN KEY (question_id) REFERENCES quiz_questions(id) ON DELETE CASCADE,
    CONSTRAINT fk_quiz_question_feedback_user FOREIGN KEY (user_id) REFERENCES quiz_users(id) ON DELETE SET NULL,
    INDEX idx_quiz_question_feedback_created (created_at),
    INDEX idx_quiz_question_feedback_question (question_id, created_at),
    INDEX idx_quiz_question_feedback_user (user_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS quiz_user_sessions (
    token_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    expires_at DATETIME NOT NULL,
    last_seen_at DATETIME NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_quiz_user_sessions_user FOREIGN KEY (user_id) REFERENCES quiz_users(id) ON DELETE CASCADE,
    INDEX idx_quiz_user_sessions_user (user_id),
    INDEX idx_quiz_user_sessions_expiry (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO schema_migrations (version) VALUES ('001_initial_schema.sql');
INSERT IGNORE INTO schema_migrations (version) VALUES ('002_accounts.sql');
INSERT IGNORE INTO schema_migrations (version) VALUES ('003_tag_enabled.sql');
INSERT IGNORE INTO schema_migrations (version) VALUES ('004_repair_account_schema.sql');
INSERT IGNORE INTO schema_migrations (version) VALUES ('005_question_feedback.sql');
INSERT IGNORE INTO schema_migrations (version) VALUES ('006_question_reviewed.sql');
INSERT IGNORE INTO schema_migrations (version) VALUES ('007_user_sessions.sql');

INSERT IGNORE INTO schema_migrations (version) VALUES ('008_question_editorial.sql');

-- Durable learning history, independent of the temporary quiz_rounds snapshots.
-- question_id deliberately has no FK: deleting a catalog question must not erase history.
CREATE TABLE IF NOT EXISTS quiz_question_results (
    result_id BIGINT UNSIGNED NOT NULL,
    question_id INT UNSIGNED NOT NULL,
    user_id INT UNSIGNED NOT NULL,
    question_version CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    difficulty ENUM('easy','medium','hero') NULL,
    position SMALLINT UNSIGNED NOT NULL,
    selected_answers JSON NOT NULL,
    outcome ENUM('first_try','second_try','incorrect','skipped') NOT NULL,
    score TINYINT UNSIGNED NOT NULL,
    max_score TINYINT UNSIGNED NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (result_id, question_id),
    CONSTRAINT fk_question_results_result FOREIGN KEY (result_id) REFERENCES quiz_results(id) ON DELETE CASCADE,
    CONSTRAINT fk_question_results_user FOREIGN KEY (user_id) REFERENCES quiz_users(id) ON DELETE CASCADE,
    INDEX idx_question_results_user_question (user_id, question_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO schema_migrations (version) VALUES ('010_question_results.sql');
INSERT IGNORE INTO schema_migrations (version) VALUES ('011_question_result_difficulty.sql');

CREATE TABLE IF NOT EXISTS quiz_rounds (
    id CHAR(64) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    category_id VARCHAR(120) NULL,
    tag_id VARCHAR(120) NULL,
    questions_json JSON NOT NULL,
    submission_hash CHAR(64) NULL,
    result_id INT UNSIGNED NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME NULL,
    CONSTRAINT fk_quiz_round_user FOREIGN KEY (user_id) REFERENCES quiz_users(id) ON DELETE CASCADE,
    INDEX idx_quiz_round_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO schema_migrations (version) VALUES ('009_quiz_rounds.sql');
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

INSERT IGNORE INTO schema_migrations (version) VALUES ('012_history_snapshots.sql');

SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE quiz_rounds ADD COLUMN is_practice TINYINT(1) NOT NULL DEFAULT 0', 'SELECT 1') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'quiz_rounds' AND COLUMN_NAME = 'is_practice');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE quiz_results ADD COLUMN is_practice TINYINT(1) NOT NULL DEFAULT 0', 'SELECT 1') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'quiz_results' AND COLUMN_NAME = 'is_practice');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

INSERT IGNORE INTO schema_migrations (version) VALUES ('013_practice_round_mode.sql');

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

INSERT IGNORE INTO schema_migrations(version) VALUES ('014_souvenirs.sql');

-- Additive definitions; existing awards and admin revisions remain unchanged.
INSERT IGNORE INTO quiz_souvenir_definitions(souvenir_key,revision,category_id,title,description,image_url,rule_type,target,state) VALUES
('neapel-first-visit',1,'neapel','Neapel besucht','Dein erster Halt am Golf von Neapel. Zwischen Meer und Vesuv beginnt dein Abenteuer.','images/souvenirs/neapel-stamp-v1.png','first_visit',1,'active'),
('neapel-discoverer',1,'neapel','Deine neapolitanische Reisemarke','Neue Geschichten am Fuße des Vesuvs: Ein Stück Neapel reist mit dir weiter.','images/souvenirs/neapel-token-v1.png','discover',5,'active'),
('florenz-first-visit',1,'florenz','Florenz besucht','Willkommen in der Stadt der Renaissance. Deine erste Entdeckung ist erst der Anfang.','images/souvenirs/florenz-stamp-v1.png','first_visit',1,'active'),
('florenz-discoverer',1,'florenz','Deine florentinische Reisemarke','Kunst, Kuppeln und kluge Köpfe: Deine Entdeckungen machen Florenz zu einem Teil deiner Sammlung.','images/souvenirs/florenz-token-v1.png','discover',20,'active');

INSERT IGNORE INTO schema_migrations(version) VALUES ('015_souvenirs_neapel_florenz.sql');

-- Durable avatar entitlement; deleting results must not revoke earned rewards.
CREATE TABLE IF NOT EXISTS quiz_user_avatar_unlocks (
    user_id INT UNSIGNED NOT NULL,
    avatar_key VARCHAR(80) NOT NULL,
    rule_key VARCHAR(80) NOT NULL,
    awarded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    source_result_id BIGINT UNSIGNED NULL,
    is_backfill TINYINT(1) NOT NULL DEFAULT 0,
    PRIMARY KEY(user_id,avatar_key),
    CONSTRAINT fk_avatar_unlock_user FOREIGN KEY(user_id) REFERENCES quiz_users(id) ON DELETE CASCADE,
    CONSTRAINT fk_avatar_unlock_result FOREIGN KEY(source_result_id) REFERENCES quiz_results(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO schema_migrations(version) VALUES ('016_avatar_rewards.sql');

-- Admin-managed avatar catalog. Stable keys retain account selections and unlocks.
CREATE TABLE IF NOT EXISTS quiz_avatars (
    avatar_key VARCHAR(80) PRIMARY KEY,
    label VARCHAR(80) NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    unlock_rule VARCHAR(80) NULL,
    sort_order INT NOT NULL DEFAULT 100,
    revision INT UNSIGNED NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO quiz_avatars(avatar_key,label,image_url,unlock_rule,sort_order) VALUES
('hero','Quiz-Hero','images/website/avatar/quizo.png',NULL,'0'),
('akuma','Akuma','images/website/avatar/akuma.png',NULL,'1'),
('amphos','Amphos','images/website/avatar/amphos.png',NULL,'2'),
('anubia','Anubia','images/website/avatar/anubia.png',NULL,'3'),
('bobo','Bobo','images/website/avatar/bobo.png',NULL,'4'),
('bronko','Bronko','images/website/avatar/bronko.png',NULL,'5'),
('burgo','Burgo','images/website/avatar/burgo.png',NULL,'6'),
('cassius','Cassius','images/website/avatar/cassius.png',NULL,'7'),
('cedric','Cedric','images/website/avatar/cedric.png',NULL,'8'),
('dash','Dash','images/website/avatar/dash.png',NULL,'9'),
('goldzahn','Goldzahn','images/website/avatar/goldzahn.png',NULL,'10'),
('horus','Horus','images/website/avatar/horus.png',NULL,'11'),
('kitsu','Kitsu','images/website/avatar/kitsu.png',NULL,'12'),
('krygon','Krygon','images/website/avatar/krygon.png',NULL,'13'),
('magmore','Magmore','images/website/avatar/magmore.png',NULL,'14'),
('milo','Milo','images/website/avatar/milo.png',NULL,'15'),
('morbix','Morbix','images/website/avatar/morbix.png',NULL,'16'),
('nagero','Nagero','images/website/avatar/nagero.png',NULL,'17'),
('nefara','Nefara','images/website/avatar/nefara.png',NULL,'18'),
('professor-blitzbirne','Professor Blitzbirne','images/website/avatar/professor-blitzbirne.png',NULL,'19'),
('quizo','Quizo','images/website/avatar/quizo.png',NULL,'20'),
('shinzo','Shinzo','images/website/avatar/shinzo.png',NULL,'21'),
('sir-emmental','Sir Emmental','images/website/avatar/sir-emmental.png',NULL,'22'),
('sporix','Sporix','images/website/avatar/sporix.png',NULL,'23'),
('sternenfunke','Sternenfunke','images/website/avatar/sternenfunke.png',NULL,'24'),
('winterseherin','Winterseherin','images/website/avatar/winterseherin.png',NULL,'25'),
('astra','Astra','images/website/avatar/astra-v1.png','hero_first_try','26');

INSERT IGNORE INTO schema_migrations(version) VALUES ('017_avatar_catalog.sql');

-- Keep deleted keys as tombstones so replaying old seeds cannot resurrect them.
SET @sql = (SELECT IF(COUNT(*)=0,'ALTER TABLE quiz_avatars ADD COLUMN enabled TINYINT(1) NOT NULL DEFAULT 1','SELECT 1') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='quiz_avatars' AND COLUMN_NAME='enabled');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
SET @sql = (SELECT IF(COUNT(*)=0,'ALTER TABLE quiz_avatars ADD COLUMN deleted_at DATETIME NULL','SELECT 1') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='quiz_avatars' AND COLUMN_NAME='deleted_at');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

INSERT IGNORE INTO schema_migrations(version) VALUES ('018_avatar_lifecycle.sql');

-- Additive Amalfi Coast definitions; existing awards and admin revisions stay unchanged.
-- Explorer progress uses correctly solved distinct questions (first or second try).
INSERT IGNORE INTO quiz_souvenir_definitions(souvenir_key,revision,category_id,title,description,image_url,rule_type,target,state) VALUES
('amalfi-first-visit',1,'amalfi','Amalfi-Küste besucht','Dein erster Halt zwischen bunten Häusern, Zitronenhainen und türkisblauem Meer. Die Küste heißt dich willkommen.','images/souvenirs/amalfi-stamp-v1.png','first_visit',1,'active'),
('amalfi-discoverer',1,'amalfi','Deine Reisemarke der Amalfi-Küste','Zwischen Küstenpfaden und kleinen Entdeckungen: Ein sonniges Stück Amalfi-Küste begleitet deine Quizreise.','images/souvenirs/amalfi-token-v1.png','discover',20,'active');

INSERT IGNORE INTO schema_migrations(version) VALUES ('019_souvenirs_amalfi.sql');
