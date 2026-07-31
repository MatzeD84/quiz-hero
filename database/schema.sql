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

INSERT IGNORE INTO schema_migrations (version) VALUES ('001_initial_schema.sql');
INSERT IGNORE INTO schema_migrations (version) VALUES ('002_accounts.sql');
INSERT IGNORE INTO schema_migrations (version) VALUES ('003_tag_enabled.sql');

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
