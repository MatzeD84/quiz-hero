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
