-- Durable learning history, independent of the temporary quiz_rounds snapshots.
-- question_id deliberately has no FK: deleting a catalog question must not erase history.
CREATE TABLE IF NOT EXISTS quiz_question_results (
    result_id BIGINT UNSIGNED NOT NULL,
    question_id INT UNSIGNED NOT NULL,
    user_id INT UNSIGNED NOT NULL,
    question_version CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    position SMALLINT UNSIGNED NOT NULL,
    selected_answers JSON NOT NULL,
    outcome ENUM('first_try','second_try','incorrect','skipped') NOT NULL,
    score TINYINT UNSIGNED NOT NULL,
    max_score TINYINT UNSIGNED NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (result_id, question_id),
    CONSTRAINT fk_question_results_result FOREIGN KEY (result_id) REFERENCES quiz_results(id) ON DELETE CASCADE,
    CONSTRAINT fk_question_results_user FOREIGN KEY (user_id) REFERENCES quiz_users(id) ON DELETE CASCADE,
    INDEX idx_question_results_user_question (user_id, question_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
