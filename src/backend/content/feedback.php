<?php
declare(strict_types=1);

function question_feedback_save(): void
{
    require_method('POST');
    rate_limit('question-feedback', 20, 300);
    $data = read_json_body();
    $questionId = ensure_int($data['questionId'] ?? 0, 1, PHP_INT_MAX);
    $types = normalize_question_feedback_types($data['types'] ?? []);
    $comment = clean_string($data['comment'] ?? '', 2000);
    if ($types === [] && $comment === '') {
        json_response(['ok' => false, 'error' => 'Bitte wähle mindestens einen Feedback-Typ oder schreibe einen Kommentar.'], 422);
    }

    $pdo = db();
    $stmt = $pdo->prepare('SELECT id, question FROM quiz_questions WHERE id = :id');
    $stmt->execute(['id' => $questionId]);
    $question = $stmt->fetch();
    if (!$question) {
        json_response(['ok' => false, 'error' => 'Frage wurde nicht gefunden.'], 404);
    }

    $userId = null;
    if (current_user_token(false) !== null) {
        $user = require_account();
        $userId = (int) $user['id'];
    }

    $stmt = $pdo->prepare('INSERT INTO quiz_question_feedback (question_id, user_id, types_json, comment, user_agent_hash) VALUES (:question_id, :user_id, :types_json, :comment, :user_agent_hash)');
    $stmt->execute([
        'question_id' => $questionId,
        'user_id' => $userId,
        'types_json' => json_encode($types, JSON_UNESCAPED_UNICODE),
        'comment' => $comment !== '' ? $comment : null,
        'user_agent_hash' => hash('sha256', (string) ($_SERVER['HTTP_USER_AGENT'] ?? '')),
    ]);

    notify_question_feedback_created((string) $question['question'], $types, $comment, $userId);
    json_response(['ok' => true, 'apiVersion' => QUIZ_HERO_API_VERSION]);
}

function admin_question_feedback_list(): void
{
    require_method('GET');
    require_admin();
    $stmt = db()->query('SELECT f.id, f.question_id, f.types_json, f.comment, f.created_at, q.question, q.category_id, u.username, u.email FROM quiz_question_feedback f INNER JOIN quiz_questions q ON q.id = f.question_id LEFT JOIN quiz_users u ON u.id = f.user_id ORDER BY f.created_at DESC, f.id DESC LIMIT 200');
    $items = array_map(static function (array $row): array {
        return [
            'id' => (int) $row['id'],
            'questionId' => (int) $row['question_id'],
            'question' => $row['question'] ?? '',
            'categoryId' => $row['category_id'] ?? '',
            'types' => decode_json_field($row['types_json'] ?? null, []),
            'comment' => $row['comment'] ?? '',
            'createdAt' => isset($row['created_at']) ? date(DATE_ATOM, strtotime((string) $row['created_at'])) : '',
            'user' => $row['username'] || $row['email'] ? [
                'username' => $row['username'] ?? '',
                'email' => $row['email'] ?? '',
            ] : null,
        ];
    }, $stmt->fetchAll());
    json_response(['ok' => true, 'apiVersion' => QUIZ_HERO_API_VERSION, 'feedback' => $items]);
}

function admin_question_feedback_delete(): void
{
    require_method('POST');
    require_admin_csrf();
    $data = read_json_body();
    $id = ensure_int($data['id'] ?? 0, 1, PHP_INT_MAX);
    $stmt = db()->prepare('DELETE FROM quiz_question_feedback WHERE id = :id');
    $stmt->execute(['id' => $id]);
    if ($stmt->rowCount() === 0) {
        json_response(['ok' => false, 'error' => 'Feedback wurde nicht gefunden.'], 404);
    }
    json_response(['ok' => true, 'apiVersion' => QUIZ_HERO_API_VERSION]);
}

function normalize_question_feedback_types(mixed $types): array
{
    if (!is_array($types)) {
        return [];
    }
    $allowed = ['wrong-answer', 'unclear-question', 'image-mismatch', 'spelling', 'other'];
    $normalized = [];
    foreach ($types as $type) {
        $type = clean_string((string) $type, 40);
        if (in_array($type, $allowed, true) && !in_array($type, $normalized, true)) {
            $normalized[] = $type;
        }
    }
    return $normalized;
}
