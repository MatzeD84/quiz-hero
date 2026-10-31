CREATE TABLE IF NOT EXISTS quiz_avatar_reward_rules (
    avatar_key VARCHAR(80) PRIMARY KEY,
    target INT UNSIGNED NOT NULL DEFAULT 1,
    difficulty ENUM('all','easy','medium','hero') NOT NULL DEFAULT 'hero',
    attempts ENUM('first','any') NOT NULL DEFAULT 'first',
    without_help TINYINT(1) NOT NULL DEFAULT 1,
    category_id VARCHAR(120) NULL,
    period ENUM('total','round') NOT NULL DEFAULT 'total',
    state ENUM('draft','active','archived') NOT NULL DEFAULT 'draft',
    revision INT UNSIGNED NOT NULL DEFAULT 1,
    CONSTRAINT fk_avatar_reward_rule_avatar FOREIGN KEY (avatar_key) REFERENCES quiz_avatars(avatar_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET @sql = (SELECT IF(COUNT(*)=0,'ALTER TABLE quiz_user_avatar_unlocks ADD COLUMN rule_snapshot JSON NULL','SELECT 1') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='quiz_user_avatar_unlocks' AND COLUMN_NAME='rule_snapshot');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Existing Astra keeps the legacy marker and all existing entitlements.
-- Editing in the builder explicitly switches the avatar to the configured rule.
INSERT IGNORE INTO quiz_avatar_reward_rules(avatar_key,target,difficulty,attempts,without_help,period,state)
SELECT avatar_key,1,'hero','first',1,'total','active' FROM quiz_avatars WHERE avatar_key='astra' AND unlock_rule='hero_first_try' AND deleted_at IS NULL
AND NOT EXISTS (SELECT 1 FROM schema_migrations WHERE version='025_avatar_reward_rules.sql');
