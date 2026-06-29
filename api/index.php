<?php

declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

const QUIZ_HERO_API_VERSION = '1';
const QUIZ_HERO_MAX_IMAGE_UPLOAD_BYTES = 25165824;

$action = $_GET['action'] ?? 'public-data';
$apiVersion = trim((string) ($_GET['v'] ?? QUIZ_HERO_API_VERSION));

if ($apiVersion !== QUIZ_HERO_API_VERSION) {
    json_response([
        'ok' => false,
        'error' => 'Nicht unterstuetzte API-Version.',
        'supportedVersions' => [QUIZ_HERO_API_VERSION],
    ], 400);
}

try {
    match ($action) {
        'public-data' => public_data(),
        'user-login' => user_login(),
        'save-result' => save_result(),
        'admin-login' => admin_login(),
        'admin-logout' => admin_logout(),
        'admin-me' => admin_me(),
        'admin-data' => admin_data(),
        'seo-export' => seo_export(),
        'admin-question-save' => admin_question_save(),
        'admin-question-delete' => admin_question_delete(),
        'admin-category-save' => admin_category_save(),
        'admin-image-upload' => admin_image_upload(),
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
    json_response(['ok' => true, 'apiVersion' => QUIZ_HERO_API_VERSION] + load_quiz_data($onlyActive, false));
}

function seo_export(): void
{
    require_method('GET');
    require_seo_export_token();
    json_response(['ok' => true, 'apiVersion' => QUIZ_HERO_API_VERSION, 'generatedAt' => gmdate(DATE_ATOM)] + load_quiz_data(true, true));
}

function load_quiz_data(bool $onlyActive, bool $onlyEnabledCategories): array
{
    $pdo = db();

    $categoriesStmt = $pdo->query('SELECT * FROM quiz_categories ORDER BY sort_order ASC, title ASC');
    $categoryRows = array_values(array_filter(
        $categoriesStmt->fetchAll(),
        static fn(array $category): bool => !$onlyEnabledCategories || (bool) $category['enabled']
    ));

    $questionSql = 'SELECT * FROM quiz_questions' . ($onlyActive ? ' WHERE active = 1' : '') . ' ORDER BY category_id ASC, sort_order ASC, id ASC';
    $questionRows = $pdo->query($questionSql)->fetchAll();
    $questionsByCategory = [];
    foreach ($questionRows as $questionRow) {
        $questionsByCategory[$questionRow['category_id']][] = format_question($questionRow);
    }

    $categories = array_map(
        static fn(array $category): array => format_category($category, $questionsByCategory[$category['id']] ?? []),
        $categoryRows
    );

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

    return ['categories' => $categories, 'tags' => $tags, 'feedback' => $feedback];
}

function require_seo_export_token(): void
{
    $expected = env_value('QUIZ_HERO_SEO_EXPORT_TOKEN');
    if ($expected === null || $expected === '') {
        json_response(['ok' => false, 'error' => 'SEO-Export ist nicht konfiguriert.'], 503);
    }

    $provided = (string) ($_SERVER['HTTP_X_QUIZ_HERO_SEO_TOKEN'] ?? ($_GET['token'] ?? ''));
    if ($provided === '' || !hash_equals($expected, $provided)) {
        json_response(['ok' => false, 'error' => 'SEO-Export nicht erlaubt.'], 403);
    }
}

function user_login(): void
{
    require_method('POST');
    rate_limit('user-login', 20, 300);
    $data = read_json_body();
    $name = clean_string($data['name'] ?? '', 80);
    $profileImageUrl = clean_url($data['profileImageUrl'] ?? '', 500);

    if ($name === '') {
        json_response(['ok' => false, 'error' => 'Bitte gib einen Namen ein.'], 422);
    }

    $pdo = db();
    $stmt = $pdo->prepare('INSERT INTO quiz_users (display_name, profile_image_url, last_seen_at) VALUES (:display_name, :profile_image_url, NOW())');
    $stmt->execute(['display_name' => $name, 'profile_image_url' => $profileImageUrl ?: null]);
    $userId = (int) $pdo->lastInsertId();
    $user = ['id' => $userId, 'name' => $name, 'profileImageUrl' => $profileImageUrl, 'token' => create_user_token($userId)];

    json_response(['ok' => true, 'apiVersion' => QUIZ_HERO_API_VERSION, 'user' => $user]);
}

function save_result(): void
{
    require_method('POST');
    rate_limit('save-result', 60, 300);
    $data = read_json_body();
    $userId = ensure_int($data['userId'] ?? 0, 1, PHP_INT_MAX);
    require_user_token($userId, (string) ($data['userToken'] ?? ''));
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

    json_response(['ok' => true, 'apiVersion' => QUIZ_HERO_API_VERSION]);
}

function admin_login(): void
{
    require_method('POST');
    quiz_hero_start_session();
    $data = read_json_body();
    $username = clean_string($data['username'] ?? '', 120);
    $password = (string) ($data['password'] ?? '');
    rate_limit('admin-login:' . $username, 8, 900);

    $expectedUser = env_value('QUIZ_HERO_ADMIN_USER', 'admin');
    $hash = env_value('QUIZ_HERO_ADMIN_PASSWORD_HASH');
    $plain = env_value('QUIZ_HERO_ADMIN_PASSWORD');
    $passwordOk = $hash ? password_verify($password, $hash) : ($plain !== null && hash_equals($plain, $password));

    if (!hash_equals((string) $expectedUser, $username) || !$passwordOk) {
        json_response(['ok' => false, 'error' => 'Admin-Zugangsdaten sind ungültig.'], 401);
    }

    session_regenerate_id(true);
    $_SESSION['quiz_hero_admin'] = ['username' => $expectedUser, 'loggedInAt' => time()];
    json_response(['ok' => true, 'apiVersion' => QUIZ_HERO_API_VERSION, 'admin' => ['username' => $expectedUser], 'csrfToken' => csrf_token()]);
}

function admin_logout(): void
{
    require_method('POST');
    require_admin_csrf();
    $_SESSION = [];
    session_destroy();
    json_response(['ok' => true, 'apiVersion' => QUIZ_HERO_API_VERSION]);
}

function admin_me(): void
{
    require_method('GET');
    quiz_hero_start_session();
    $admin = $_SESSION['quiz_hero_admin'] ?? null;
    json_response(['ok' => true, 'apiVersion' => QUIZ_HERO_API_VERSION, 'admin' => $admin, 'csrfToken' => $admin ? csrf_token() : null]);
}

function admin_question_save(): void
{
    require_method('POST');
    require_admin_csrf();
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

    json_response(['ok' => true, 'apiVersion' => QUIZ_HERO_API_VERSION, 'id' => !empty($question['id']) ? $question['id'] : (int) $pdo->lastInsertId()]);
}

function admin_question_delete(): void
{
    require_method('POST');
    require_admin_csrf();
    $data = read_json_body();
    $id = ensure_int($data['id'] ?? 0, 1, PHP_INT_MAX);
    $stmt = db()->prepare('DELETE FROM quiz_questions WHERE id = :id');
    $stmt->execute(['id' => $id]);
    json_response(['ok' => true, 'apiVersion' => QUIZ_HERO_API_VERSION]);
}

function admin_category_save(): void
{
    require_method('POST');
    require_admin_csrf();
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
    json_response(['ok' => true, 'apiVersion' => QUIZ_HERO_API_VERSION, 'id' => $id]);
}

function admin_image_upload(): void
{
    require_method('POST');
    require_admin_csrf();
    rate_limit('admin-image-upload', 40, 300);

    $contentLength = (int) ($_SERVER['CONTENT_LENGTH'] ?? 0);
    if ($contentLength > 0 && $contentLength > QUIZ_HERO_MAX_IMAGE_UPLOAD_BYTES + 1048576) {
        json_response(['ok' => false, 'error' => 'Das Bild ist zu gross. Maximal erlaubt sind 24 MB.'], 413);
    }

    $rawCategoryId = clean_string($_POST['categoryId'] ?? '', 120);
    if ($rawCategoryId === '') {
        json_response(['ok' => false, 'error' => 'Kategorie fehlt.'], 422);
    }
    $categoryId = slugify($rawCategoryId);

    $stmt = db()->prepare('SELECT id FROM quiz_categories WHERE id = :id');
    $stmt->execute(['id' => $categoryId]);
    if (!$stmt->fetch()) {
        json_response(['ok' => false, 'error' => 'Kategorie wurde nicht gefunden.'], 422);
    }

    $file = $_FILES['image'] ?? null;
    if (!is_array($file) || ($file['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) {
        json_response(['ok' => false, 'error' => 'Bitte waehle eine Bilddatei aus.'], 422);
    }

    if (($file['error'] ?? UPLOAD_ERR_OK) !== UPLOAD_ERR_OK) {
        json_response(['ok' => false, 'error' => upload_error_message((int) $file['error'])], 400);
    }

    $size = (int) ($file['size'] ?? 0);
    if ($size <= 0 || $size > QUIZ_HERO_MAX_IMAGE_UPLOAD_BYTES) {
        json_response(['ok' => false, 'error' => 'Das Bild darf maximal 24 MB gross sein.'], 413);
    }

    $tmpName = (string) ($file['tmp_name'] ?? '');
    if ($tmpName === '' || !is_uploaded_file($tmpName)) {
        json_response(['ok' => false, 'error' => 'Upload konnte nicht verarbeitet werden.'], 400);
    }

    $imageInfo = @getimagesize($tmpName);
    if ($imageInfo === false) {
        json_response(['ok' => false, 'error' => 'Die Datei ist kein gueltiges Bild.'], 422);
    }

    $mime = detect_mime_type($tmpName);
    $allowed = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
    ];
    if (!isset($allowed[$mime])) {
        json_response(['ok' => false, 'error' => 'Erlaubt sind JPG, PNG und WebP. SVG/HTML/PHP sind nicht erlaubt.'], 422);
    }

    $baseDir = dirname(__DIR__) . '/images/uploads';
    $categoryDir = $baseDir . '/' . $categoryId;
    if (!is_dir($categoryDir) && !mkdir($categoryDir, 0755, true) && !is_dir($categoryDir)) {
        json_response(['ok' => false, 'error' => 'Upload-Ordner konnte nicht erstellt werden.'], 500);
    }

    $originalName = pathinfo((string) ($file['name'] ?? 'quiz-bild'), PATHINFO_FILENAME);
    $safeName = slugify($originalName);
    $extension = $allowed[$mime];
    $filename = sprintf('%s-%s.%s', $safeName, bin2hex(random_bytes(6)), $extension);
    $target = $categoryDir . '/' . $filename;

    if (!move_uploaded_file($tmpName, $target)) {
        json_response(['ok' => false, 'error' => 'Bild konnte nicht gespeichert werden.'], 500);
    }

    @chmod($target, 0644);

    $relativePath = sprintf('images/uploads/%s/%s', $categoryId, $filename);
    json_response([
        'ok' => true,
        'apiVersion' => QUIZ_HERO_API_VERSION,
        'path' => $relativePath,
        'mimeType' => $mime,
        'size' => $size,
        'width' => (int) ($imageInfo[0] ?? 0),
        'height' => (int) ($imageInfo[1] ?? 0),
    ]);
}

function detect_mime_type(string $path): string
{
    if (class_exists('finfo')) {
        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $mime = $finfo->file($path);
        if (is_string($mime) && $mime !== '') {
            return $mime;
        }
    }

    return (string) (mime_content_type($path) ?: '');
}

function upload_error_message(int $error): string
{
    return match ($error) {
        UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE => 'Das Bild ist zu gross.',
        UPLOAD_ERR_PARTIAL => 'Das Bild wurde nur teilweise hochgeladen.',
        UPLOAD_ERR_NO_TMP_DIR => 'Server-Upload-Ordner fehlt.',
        UPLOAD_ERR_CANT_WRITE => 'Bild konnte nicht auf dem Server gespeichert werden.',
        UPLOAD_ERR_EXTENSION => 'Upload wurde von einer PHP-Erweiterung gestoppt.',
        default => 'Upload fehlgeschlagen.',
    };
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
    $imageUrl = clean_url($data['imageUrl'] ?? '', 500);
    $type = $imageUrl !== '' ? 'image' : 'text';
    $tags = array_values(array_filter(array_map(static fn($tag): string => slugify((string) $tag), explode(',', (string) ($data['tags'] ?? '')))));

    return [
        'category_id' => slugify((string) ($data['categoryId'] ?? '')),
        'question' => clean_string($data['question'] ?? '', 1000),
        'answers_json' => json_encode($answers, JSON_UNESCAPED_UNICODE),
        'correct_index' => $correct,
        'difficulty' => $difficulty,
        'question_type' => $type,
        'image_url' => $imageUrl ?: null,
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
