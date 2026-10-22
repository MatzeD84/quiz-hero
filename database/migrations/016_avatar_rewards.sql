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
