SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE quiz_abilities ADD COLUMN image_url VARCHAR(500) NULL', 'SELECT 1') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='quiz_abilities' AND COLUMN_NAME='image_url');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
-- One-time defaults; preserve administrator choices, including later deliberate removal.
UPDATE quiz_abilities SET image_url=CONCAT('images/abilities/',id,'-v1.png'),revision=revision+1
WHERE id IN ('heldenblick','schutzschild','neues-abenteuer') AND (image_url IS NULL OR image_url='')
AND NOT EXISTS (SELECT 1 FROM schema_migrations WHERE version='024_ability_images.sql');
