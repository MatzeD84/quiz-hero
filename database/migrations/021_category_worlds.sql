CREATE TABLE IF NOT EXISTS quiz_category_worlds (
    category_id VARCHAR(120) NOT NULL,
    world_id VARCHAR(120) NOT NULL,
    PRIMARY KEY (category_id, world_id),
    INDEX idx_category_worlds_world (world_id, category_id),
    CONSTRAINT fk_category_worlds_category FOREIGN KEY (category_id) REFERENCES quiz_categories(id) ON DELETE CASCADE,
    CONSTRAINT fk_category_worlds_world FOREIGN KEY (world_id) REFERENCES quiz_worlds(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- One-time promotion of the known Italian city categories. Never replay over admin edits.
INSERT IGNORE INTO quiz_category_worlds(category_id,world_id)
SELECT c.id,'italien' FROM quiz_categories c
WHERE c.id IN ('rom','neapel','florenz','amalfi','siena')
AND NOT EXISTS (SELECT 1 FROM schema_migrations WHERE version='021_category_worlds.sql')
AND NOT EXISTS (SELECT 1 FROM quiz_category_worlds cw WHERE cw.category_id=c.id);

-- Effective membership is unchanged; preserve all additional explicit worlds.
DELETE qw FROM quiz_question_worlds qw
JOIN quiz_questions q ON q.id=qw.question_id
JOIN quiz_category_worlds cw ON cw.category_id=q.category_id AND cw.world_id=qw.world_id
WHERE qw.world_id='italien' AND q.category_id IN ('rom','neapel','florenz','amalfi','siena')
AND NOT EXISTS (SELECT 1 FROM schema_migrations WHERE version='021_category_worlds.sql');
