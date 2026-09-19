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
