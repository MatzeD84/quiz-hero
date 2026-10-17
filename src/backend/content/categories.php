<?php
declare(strict_types=1);

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
    $icon = clean_url($data['icon'] ?? '', 500);
    if (trim((string) ($data['icon'] ?? '')) !== '' && $icon === '') {
        json_response(['ok' => false, 'error' => 'Ungültiger Kategorie-Bildpfad.'], 422);
    }
    $badgeText = clean_string($data['badgeText'] ?? '', 40);
    if (!empty($data['badgeActive']) && $badgeText === '') {
        json_response(['ok' => false, 'error' => 'Ein aktives Badge benötigt einen Text.'], 422);
    }
    $payload = [
        'id' => $id,
        'title' => $title,
        'description' => clean_string($data['description'] ?? '', 255),
        'seo_description' => clean_string($data['seoDescription'] ?? '', 2000),
        'icon' => $icon ?: null,
        'enabled' => !empty($data['enabled']) ? 1 : 0,
        'badge_json' => json_encode(['active' => !empty($data['badgeActive']), 'text' => $badgeText], JSON_UNESCAPED_UNICODE),
        'sort_order' => ensure_int($data['sortOrder'] ?? 100, 0, 100000),
    ];
    $pdo = db();
    $pdo->beginTransaction();
    $existing = $pdo->prepare('SELECT * FROM quiz_categories WHERE id=? FOR UPDATE');
    $existing->execute([$id]);
    $row = $existing->fetch();
    if ($row) assert_content_version($row, $data);
    $stmt = $pdo->prepare('INSERT INTO quiz_categories (id, title, description, seo_description, icon, enabled, badge_json, sort_order) VALUES (:id, :title, :description, :seo_description, :icon, :enabled, :badge_json, :sort_order) ON DUPLICATE KEY UPDATE title = VALUES(title), description = VALUES(description), seo_description = VALUES(seo_description), icon = VALUES(icon), enabled = VALUES(enabled), badge_json = VALUES(badge_json), sort_order = VALUES(sort_order)');
    $stmt->execute($payload);
    $pdo->commit();
    json_response(['ok' => true, 'apiVersion' => QUIZ_HERO_API_VERSION, 'id' => $id]);
}

function admin_category_delete(): void
{
    require_method('POST');
    require_admin_csrf();
    $data = read_json_body();
    $id = slugify((string) ($data['id'] ?? ''));
    $confirmation = clean_string($data['confirmation'] ?? '', 120);
    $deleteQuestions = ($data['deleteQuestions'] ?? false) === true;
    if ($id === '' || $confirmation !== $id) {
        json_response(['ok' => false, 'error' => 'Die Kategorie-ID wurde nicht korrekt bestätigt.'], 422);
    }

    $pdo = db();
    $pdo->beginTransaction();
    try {
        $categoryStmt = $pdo->prepare('SELECT title FROM quiz_categories WHERE id = :id FOR UPDATE');
        $categoryStmt->execute(['id' => $id]);
        $category = $categoryStmt->fetch();
        if (!$category) {
            $pdo->rollBack();
            json_response(['ok' => false, 'error' => 'Kategorie wurde nicht gefunden.'], 404);
        }

        $countStmt = $pdo->prepare('SELECT COUNT(*) FROM quiz_questions WHERE category_id = :id');
        $countStmt->execute(['id' => $id]);
        $questionCount = (int) $countStmt->fetchColumn();
        if ($questionCount > 0 && !$deleteQuestions) {
            $pdo->rollBack();
            json_response([
                'ok' => false,
                'error' => 'Die Kategorie enthält Fragen. Aktiviere die Checkbox, um diese Fragen mitzulöschen.',
                'questionCount' => $questionCount,
            ], 409);
        }

        $deleteStmt = $pdo->prepare('DELETE FROM quiz_categories WHERE id = :id');
        $deleteStmt->execute(['id' => $id]);
        $pdo->commit();
    } catch (Throwable $error) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $error;
    }
    json_response([
        'ok' => true,
        'apiVersion' => QUIZ_HERO_API_VERSION,
        'deletedQuestionCount' => $questionCount,
    ]);
}
