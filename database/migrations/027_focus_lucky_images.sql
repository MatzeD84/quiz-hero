-- Initial motifs only; preserve later edits and intentionally removed images.
UPDATE quiz_abilities SET image_url='images/abilities/scharfblick-v1.png',revision=revision+1
WHERE id='scharfblick' AND image_url IS NULL AND revision=1
AND NOT EXISTS (SELECT 1 FROM schema_migrations WHERE version='027_focus_lucky_images.sql');
UPDATE quiz_abilities SET image_url='images/abilities/gluecksanker-v1.png',revision=revision+1
WHERE id='gluecksanker' AND image_url IS NULL AND revision=1
AND NOT EXISTS (SELECT 1 FROM schema_migrations WHERE version='027_focus_lucky_images.sql');
