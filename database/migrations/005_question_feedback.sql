CREATE TABLE IF NOT EXISTS quiz_question_feedback (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    question_id INT UNSIGNED NOT NULL,
    user_id INT UNSIGNED NULL,
    types_json JSON NOT NULL,
    comment TEXT NULL,
    user_agent_hash CHAR(64) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_quiz_question_feedback_question FOREIGN KEY (question_id) REFERENCES quiz_questions(id) ON DELETE CASCADE,
    CONSTRAINT fk_quiz_question_feedback_user FOREIGN KEY (user_id) REFERENCES quiz_users(id) ON DELETE SET NULL,
    INDEX idx_quiz_question_feedback_created (created_at),
    INDEX idx_quiz_question_feedback_question (question_id, created_at),
    INDEX idx_quiz_question_feedback_user (user_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
