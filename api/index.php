<?php

declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

$action = $_GET['action'] ?? 'public-data';

try {
    match ($action) {
        'public-data' => public_data(),
        'user-login' => user_login(),
        'save-result' => save_result(),
        'admin-login' => admin_login(),
        'admin-logout' => admin_logout(),
        'admin-me' => admin_me(),
        'admin-data' => admin_data(),
        'admin-question-save' => admin_question_save(),
        'admin-question-delete' => admin_question_delete(),
        'admin-category-save' => admin_category_save(),
        default => json_response(['ok' => false, 'error' => 'Unbekannte API-Aktion.'], 404),
    };
} catch (PDOException $exception) {
    error_log($exception->getMessage());
    json_response(['ok' => false, 'error' => 'Datenbankfehler. Bitte Konfiguration prüfen.'], 500);
} catch (Throwable $exception) {
    error_log($exception->getMessage());
    json_response(['ok' => false, 'error' => 'Serverfehler.'], 500);
}

function public_data(): void
{
    require_method('GET');
    emit_quiz_data(true);
}

function admin_data(): void
{
    require_method('GET');
    require_admin();
    emit_quiz_data(false);
}

function emit_quiz_data(bool $onlyActive): void
{
    $pdo = db();

    $categoriesStmt = $pdo->query('SELECT * FROM quiz_categories ORDER BY sort_order ASC, title ASC');
    $categories = [];
    foreach ($categoriesStmt->fetchAll() as $category) {
        $questionSql = 'SELECT * FROM quiz_questions WHERE category_id = :category_id' . ($onlyActive ? ' AND active = 1' : '') . ' ORDER BY sort_order ASC, id ASC';
        $questionsStmt = $pdo->prepare($questionSql);
        $questionsStmt->execute(['category_id' => $category['id']]);
        $questions = array_map('format_question', $questionsStmt->fetchAll());
        $categories[] = format_category($category, $questions);
    }

    $tagsStmt = $pdo->query('SELECT * FROM quiz_tags ORDER BY sort_order ASC, title ASC');
    $tags = array_map(static fn(array $tag): array => [
        'id' => $tag['id'],
        'title' => $tag['title'],
        'description' => $tag['description'] ?? '',
        'icon' => $tag['icon'] ?? '',
        'badge' => decode_json_field($tag['badge_json'] ?? null, ['active' => false, 'text' => '']),
    ], $tagsStmt->fetchAll());

    $feedbackStmt = $pdo->query('SELECT feedback_key, messages_json FROM quiz_feedback');
    $feedback = [];
    foreach ($feedbackStmt->fetchAll() as $entry) {
        $feedback[$entry['feedback_key']] = decode_json_field($entry['messages_json'] ?? null, []);
    }

    json_response(['ok' => true, 'categories' => $categories, 'tags' => $tags, 'feedback' => $feedback]);
}

function user_login(): void
{
    require_method('POST');
    $data = read_json_body();
    $name = clean_string($data['name'] ?? '', 80);
    $profileImageUrl = clean_url($data['profileImageUrl'] ?? '', 500);

    if ($name === '') {
        json_response(['ok' => false, 'error' => 'Bitte gib einen Namen ein.'], 422);
    }

    $pdo = db();
    $stmt = $pdo->prepare('INSERT INTO quiz_users (display_name, profile_image_url, last_seen_at) VALUES (:display_name, :profile_image_url, NOW())');
    $stmt->execute(['display_name' => $name, 'profile_image_url' => $profileImageUrl ?: null]);
    $user = ['id' => (int) $pdo->lastInsertId(), 'name' => $name, 'profileImageUrl' => $profileImageUrl];

    json_response(['ok' => true, 'user' => $user]);
}

function save_result(): void
{
    require_method('POST');
    $data = read_json_body();
    $userId = ensure_int($data['userId'] ?? 0, 1, PHP_INT_MAX);
    $score = ensure_int($data['score'] ?? 0, 0, 100000);
    $maxScore = ensure_int($data['maxScore'] ?? 0, 0, 100000);
    $solved = ensure_int($data['solved'] ?? 0, 0, 100000);
    $total = ensure_int($data['total'] ?? 0, 0, 100000);
    $categoryId = clean_string($data['categoryId'] ?? '', 120) ?: null;
    $tagId = clean_string($data['tagId'] ?? '', 120) ?: null;

    $pdo = db();
    $stmt = $pdo->prepare('INSERT INTO quiz_results (user_id, category_id, tag_id, score, max_score, solved, total_questions) VALUES (:user_id, :category_id, :tag_id, :score, :max_score, :solved, :total_questions)');
    $stmt->execute([
        'user_id' => $userId,
        'category_id' => $categoryId,
        'tag_id' => $tagId,
        'score' => $score,
        'max_score' => $maxScore,
        'solved' => $solved,
        'total_questions' => $total,
    ]);

    json_response(['ok' => true]);
}

function admin_login(): void
{
    require_method('POST');
    quiz_hero_start_session();
    $data = read_json_body();
    $username = clean_string($data['username'] ?? '', 120);
    $password = (string) ($data['password'] ?? '');

    $expectedUser = env_value('QUIZ_HERO_ADMIN_USER', 'admin');
    $hash = env_value('QUIZ_HERO_ADMIN_PASSWORD_HASH');
    $plain = env_value('QUIZ_HERO_ADMIN_PASSWORD');
    $passwordOk = $hash ? password_verify($password, $hash) : ($plain !== null && hash_equals($plain, $password));

    if (!hash_equals((string) $expectedUser, $username) || !$passwordOk) {
        json_response(['ok' => false, 'error' => 'Admin-Zugangsdaten sind ungültig.'], 401);
    }

    session_regenerate_id(true);
    $_SESSION['quiz_hero_admin'] = ['username' => $expectedUser, 'loggedInAt' => time()];
    json_response(['ok' => true, 'admin' => ['username' => $expectedUser]]);
}

function admin_logout(): void
{
    require_method('POST');
    quiz_hero_start_session();
    $_SESSION = [];
    session_destroy();
    json_response(['ok' => true]);
}

function admin_me(): void
{
    require_method('GET');
    quiz_hero_start_session();
    json_response(['ok' => true, 'admin' => $_SESSION['quiz_hero_admin'] ?? null]);
}

function admin_question_save(): void
{
    require_method('POST');
    require_admin();
    $data = read_json_body();
    $question = normalize_question_payload($data);
    $pdo = db();

    if (!empty($data['id'])) {
        $stmt = $pdo->prepare('UPDATE quiz_questions SET category_id = :category_id, question = :question, answers_json = :answers_json, correct_index = :correct_index, difficulty = :difficulty, question_type = :question_type, image_url = :image_url, tags_json = :tags_json, background_knowledge = :background_knowledge, active = :active, sort_order = :sort_order WHERE id = :id');
        $question['id'] = ensure_int($data['id'], 1, PHP_INT_MAX);
    } else {
        $stmt = $pdo->prepare('INSERT INTO quiz_questions (category_id, question, answers_json, correct_index, difficulty, question_type, image_url, tags_json, background_knowledge, active, sort_order) VALUES (:category_id, :question, :answers_json, :correct_index, :difficulty, :question_type, :image_url, :tags_json, :background_knowledge, :active, :sort_order)');
    }
    $stmt->execute($question);

    json_response(['ok' => true, 'id' => !empty($question['id']) ? $question['id'] : (int) $pdo->lastInsertId()]);
}

function admin_question_delete(): void
{
    require_method('POST');
    require_admin();
    $data = read_json_body();
    $id = ensure_int($data['id'] ?? 0, 1, PHP_INT_MAX);
    $stmt = db()->prepare('DELETE FROM quiz_questions WHERE id = :id');
    $stmt->execute(['id' => $id]);
    json_response(['ok' => true]);
}

function admin_category_save(): void
{
    require_method('POST');
    require_admin();
    $data = read_json_body();
    $title = clean_string($data['title'] ?? '', 120);
    $id = slugify((string) ($data['id'] ?? $title));
    if ($title === '') {
        json_response(['ok' => false, 'error' => 'Kategorie-Titel fehlt.'], 422);
    }
    $payload = [
        'id' => $id,
        'title' => $title,
        'description' => clean_string($data['description'] ?? '', 255),
        'seo_description' => clean_string($data['seoDescription'] ?? '', 2000),
        'icon' => clean_url($data['icon'] ?? '', 500) ?: null,
        'enabled' => !empty($data['enabled']) ? 1 : 0,
        'badge_json' => json_encode(['active' => !empty($data['badgeActive']), 'text' => clean_string($data['badgeText'] ?? 'Neu', 40)], JSON_UNESCAPED_UNICODE),
        'sort_order' => ensure_int($data['sortOrder'] ?? 100, 0, 100000),
    ];
    $stmt = db()->prepare('INSERT INTO quiz_categories (id, title, description, seo_description, icon, enabled, badge_json, sort_order) VALUES (:id, :title, :description, :seo_description, :icon, :enabled, :badge_json, :sort_order) ON DUPLICATE KEY UPDATE title = VALUES(title), description = VALUES(description), seo_description = VALUES(seo_description), icon = VALUES(icon), enabled = VALUES(enabled), badge_json = VALUES(badge_json), sort_order = VALUES(sort_order)');
    $stmt->execute($payload);
    json_response(['ok' => true, 'id' => $id]);
}

function normalize_question_payload(array $data): array
{
    $answers = array_values(array_filter(array_map(static fn($answer): string => clean_string((string) $answer, 255), $data['answers'] ?? []), static fn(string $answer): bool => $answer !== ''));
    if (count($answers) !== 4) {
        json_response(['ok' => false, 'error' => 'Bitte genau vier Antworten ausfüllen.'], 422);
    }
    $correct = ensure_int($data['correct'] ?? 0, 0, 3);
    $difficulty = clean_string($data['difficulty'] ?? 'easy', 20);
    if (!in_array($difficulty, ['easy', 'medium', 'hero'], true)) {
        $difficulty = 'easy';
    }
    $type = clean_string($data['type'] ?? 'text', 20);
    if (!in_array($type, ['text', 'image'], true)) {
        $type = 'text';
    }
    $tags = array_values(array_filter(array_map(static fn($tag): string => slugify((string) $tag), explode(',', (string) ($data['tags'] ?? '')))));

    return [
        'category_id' => slugify((string) ($data['categoryId'] ?? '')),
        'question' => clean_string($data['question'] ?? '', 1000),
        'answers_json' => json_encode($answers, JSON_UNESCAPED_UNICODE),
        'correct_index' => $correct,
        'difficulty' => $difficulty,
        'question_type' => $type,
        'image_url' => clean_url($data['imageUrl'] ?? '', 500) ?: null,
        'tags_json' => json_encode($tags, JSON_UNESCAPED_UNICODE),
        'background_knowledge' => clean_string($data['backgroundKnowledge'] ?? '', 2000) ?: null,
        'active' => !empty($data['active']) ? 1 : 0,
        'sort_order' => ensure_int($data['sortOrder'] ?? 100, 0, 100000),
    ];
}

function format_category(array $category, array $questions): array
{
    return [
        'id' => $category['id'],
        'title' => $category['title'],
        'enabled' => (bool) $category['enabled'],
        'icon' => $category['icon'] ?? '',
        'description' => $category['description'] ?? '',
        'seoDescription' => $category['seo_description'] ?? '',
        'questionsFile' => null,
        'badge' => decode_json_field($category['badge_json'] ?? null, ['active' => false, 'text' => '']),
        'questions' => $questions,
    ];
}

function format_question(array $question): array
{
    return [
        'id' => (int) $question['id'],
        'categoryId' => $question['category_id'],
        'question' => $question['question'],
        'answers' => decode_json_field($question['answers_json'] ?? null, []),
        'correct' => (int) $question['correct_index'],
        'difficulty' => $question['difficulty'],
        'type' => $question['question_type'],
        'imageUrl' => $question['image_url'] ?? '',
        'tag' => decode_json_field($question['tags_json'] ?? null, []),
        'backgroundKnowledge' => $question['background_knowledge'] ?? '',
        'active' => (bool) $question['active'],
        'sortOrder' => (int) $question['sort_order'],
    ];
}
