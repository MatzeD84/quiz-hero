-- Hundredths of a percent: 5 = 0.05%, 50 = 0.50%, 10000 = 100%.
SET @sql = (SELECT IF(COUNT(*)=0,'ALTER TABLE quiz_avatars ADD COLUMN drop_chance_bp SMALLINT UNSIGNED NOT NULL DEFAULT 0, ADD CONSTRAINT chk_avatar_drop_chance CHECK (drop_chance_bp <= 10000)','SELECT 1') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='quiz_avatars' AND COLUMN_NAME='drop_chance_bp');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- NULL marks rounds started before this feature: no historical random draws.
SET @sql = (SELECT IF(COUNT(*)=0,'ALTER TABLE quiz_rounds ADD COLUMN avatar_drops_json JSON NULL','SELECT 1') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='quiz_rounds' AND COLUMN_NAME='avatar_drops_json');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
