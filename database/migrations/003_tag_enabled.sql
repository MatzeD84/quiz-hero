ALTER TABLE quiz_tags
    ADD COLUMN enabled TINYINT(1) NOT NULL DEFAULT 1 AFTER icon;

UPDATE quiz_tags
SET enabled = 0
WHERE id IN (
    'Test',
    'Geographie',
    'Architektur',
    'Geschichte',
    'Kunst',
    'Politik',
    'Religion',
    'Renaissance',
    'Sehenswürdigkeit',
    'Tradition'
);
