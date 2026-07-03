ALTER TABLE quiz_users
    ADD COLUMN username VARCHAR(80) NULL AFTER id,
    ADD COLUMN email VARCHAR(190) NULL AFTER username,
    ADD COLUMN password_hash VARCHAR(255) NULL AFTER email,
    ADD COLUMN avatar_key VARCHAR(80) NULL AFTER profile_image_url,
    ADD COLUMN email_verified_at DATETIME NULL AFTER avatar_key,
    ADD COLUMN privacy_accepted_at DATETIME NULL AFTER email_verified_at,
    ADD COLUMN deleted_at DATETIME NULL AFTER privacy_accepted_at,
    ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at,
    DROP COLUMN display_name,
    ADD UNIQUE KEY uq_quiz_users_username (username),
    ADD UNIQUE KEY uq_quiz_users_email (email),
    ADD INDEX idx_quiz_users_deleted_at (deleted_at);

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

ALTER TABLE quiz_results DROP FOREIGN KEY fk_quiz_results_user;
ALTER TABLE quiz_results MODIFY user_id INT UNSIGNED NULL;
ALTER TABLE quiz_results
    ADD CONSTRAINT fk_quiz_results_user FOREIGN KEY (user_id) REFERENCES quiz_users(id) ON DELETE SET NULL;
