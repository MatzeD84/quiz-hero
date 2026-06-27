<?php

declare(strict_types=1);

require __DIR__ . '/../api/bootstrap.php';

function read_json_file(string $path): array
{
    $raw = (string) file_get_contents($path);
    $raw = preg_replace('/^\xEF\xBB\xBF/', '', $raw) ?? $raw;
    return json_decode($raw, true, flags: JSON_THROW_ON_ERROR);
}

$root = dirname(__DIR__);
$pdo = db();
$pdo->beginTransaction();

try {
    $categories = read_json_file($root . '/categories.json')['categories'] ?? [];
    $feedback = read_json_file($root . '/feedback.json');
    $tags = read_json_file($root . '/tags.json')['tags'] ?? [];

    $deleteQuestionsStmt = $pdo->prepare('DELETE FROM quiz_questions WHERE category_id = :category_id');
    $categoryStmt = $pdo->prepare('INSERT INTO quiz_categories (id, title, description, seo_description, icon, enabled, badge_json, sort_order) VALUES (:id, :title, :description, :seo_description, :icon, :enabled, :badge_json, :sort_order) ON DUPLICATE KEY UPDATE title = VALUES(title), description = VALUES(description), seo_description = VALUES(seo_description), icon = VALUES(icon), enabled = VALUES(enabled), badge_json = VALUES(badge_json), sort_order = VALUES(sort_order)');
    $questionStmt = $pdo->prepare('INSERT INTO quiz_questions (category_id, question, answers_json, correct_index, difficulty, question_type, image_url, tags_json, background_knowledge, active, sort_order) VALUES (:category_id, :question, :answers_json, :correct_index, :difficulty, :question_type, :image_url, :tags_json, :background_knowledge, 1, :sort_order)');

    foreach ($categories as $sort => $category) {
        $categoryStmt->execute([
            'id' => $category['id'],
            'title' => $category['title'],
            'description' => $category['description'] ?? '',
            'seo_description' => $category['seoDescription'] ?? '',
            'icon' => $category['icon'] ?? null,
            'enabled' => !empty($category['enabled']) ? 1 : 0,
            'badge_json' => json_encode($category['badge'] ?? ['active' => false, 'text' => ''], JSON_UNESCAPED_UNICODE),
            'sort_order' => ($sort + 1) * 10,
        ]);

        $deleteQuestionsStmt->execute(['category_id' => $category['id']]);

        $file = $category['questionsFile'] ?? '';
        if ($file === '' || !is_file($root . '/' . $file)) {
            continue;
        }
        $questions = read_json_file($root . '/' . $file)['questions'] ?? [];
        foreach ($questions as $questionSort => $question) {
            $questionStmt->execute([
                'category_id' => $category['id'],
                'question' => $question['question'],
                'answers_json' => json_encode($question['answers'] ?? [], JSON_UNESCAPED_UNICODE),
                'correct_index' => (int) ($question['correct'] ?? 0),
                'difficulty' => $question['difficulty'] ?? 'easy',
                'question_type' => $question['type'] ?? (!empty($question['imageUrl']) ? 'image' : 'text'),
                'image_url' => $question['imageUrl'] ?? null,
                'tags_json' => json_encode($question['tag'] ?? [], JSON_UNESCAPED_UNICODE),
                'background_knowledge' => $question['backgroundKnowledge'] ?? null,
                'sort_order' => ($questionSort + 1) * 10,
            ]);
        }
    }

    $tagStmt = $pdo->prepare('INSERT INTO quiz_tags (id, title, description, icon, badge_json, sort_order) VALUES (:id, :title, :description, :icon, :badge_json, :sort_order) ON DUPLICATE KEY UPDATE title = VALUES(title), description = VALUES(description), icon = VALUES(icon), badge_json = VALUES(badge_json), sort_order = VALUES(sort_order)');
    foreach ($tags as $sort => $tag) {
        $tagStmt->execute([
            'id' => $tag['id'],
            'title' => $tag['title'],
            'description' => $tag['description'] ?? '',
            'icon' => $tag['icon'] ?? '',
            'badge_json' => json_encode($tag['badge'] ?? ['active' => false, 'text' => ''], JSON_UNESCAPED_UNICODE),
            'sort_order' => ($sort + 1) * 10,
        ]);
    }

    $feedbackStmt = $pdo->prepare('INSERT INTO quiz_feedback (feedback_key, messages_json) VALUES (:feedback_key, :messages_json) ON DUPLICATE KEY UPDATE messages_json = VALUES(messages_json)');
    foreach ($feedback as $key => $messages) {
        $feedbackStmt->execute([
            'feedback_key' => $key,
            'messages_json' => json_encode($messages, JSON_UNESCAPED_UNICODE),
        ]);
    }

    $pdo->commit();
    echo "Seed abgeschlossen.\n";
} catch (Throwable $exception) {
    $pdo->rollBack();
    fwrite(STDERR, $exception->getMessage() . "\n");
    exit(1);
}
