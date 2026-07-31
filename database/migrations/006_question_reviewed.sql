ALTER TABLE quiz_questions
    ADD COLUMN reviewed TINYINT(1) NOT NULL DEFAULT 0 AFTER active;
