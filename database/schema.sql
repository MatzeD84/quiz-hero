CREATE TABLE IF NOT EXISTS quiz_categories (
    id VARCHAR(120) PRIMARY KEY,
    title VARCHAR(120) NOT NULL,
    description VARCHAR(255) DEFAULT '',
    seo_description TEXT NULL,
    icon VARCHAR(500) NULL,
    enabled TINYINT(1) NOT NULL DEFAULT 1,
    badge_json JSON NULL,
    sort_order INT NOT NULL DEFAULT 100,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS quiz_questions (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    category_id VARCHAR(120) NOT NULL,
    question TEXT NOT NULL,
    answers_json JSON NOT NULL,
    correct_index TINYINT UNSIGNED NOT NULL,
    difficulty ENUM('easy','medium','hero') NOT NULL DEFAULT 'easy',
    question_type ENUM('text','image') NOT NULL DEFAULT 'text',
    image_url VARCHAR(500) NULL,
    tags_json JSON NULL,
    background_knowledge TEXT NULL,
    active TINYINT(1) NOT NULL DEFAULT 1,
    sort_order INT NOT NULL DEFAULT 100,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_quiz_questions_category FOREIGN KEY (category_id) REFERENCES quiz_categories(id) ON UPDATE CASCADE ON DELETE CASCADE,
    INDEX idx_quiz_questions_category_active (category_id, active, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS quiz_tags (
    id VARCHAR(120) PRIMARY KEY,
    title VARCHAR(120) NOT NULL,
    description VARCHAR(255) DEFAULT '',
    icon VARCHAR(500) DEFAULT '',
    badge_json JSON NULL,
    sort_order INT NOT NULL DEFAULT 100
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS quiz_feedback (
    feedback_key VARCHAR(80) PRIMARY KEY,
    messages_json JSON NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS quiz_users (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    display_name VARCHAR(80) NOT NULL,
    profile_image_url VARCHAR(500) NULL,
    last_seen_at DATETIME NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_quiz_users_last_seen (last_seen_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS quiz_results (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    category_id VARCHAR(120) NULL,
    tag_id VARCHAR(120) NULL,
    score INT UNSIGNED NOT NULL DEFAULT 0,
    max_score INT UNSIGNED NOT NULL DEFAULT 0,
    solved INT UNSIGNED NOT NULL DEFAULT 0,
    total_questions INT UNSIGNED NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_quiz_results_user FOREIGN KEY (user_id) REFERENCES quiz_users(id) ON DELETE CASCADE,
    INDEX idx_quiz_results_user_created (user_id, created_at),
    INDEX idx_quiz_results_category (category_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
