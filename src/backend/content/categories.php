<?php
declare(strict_types=1);

function admin_category_save(): void
{
    require_method('POST');
    require_admin_csrf();
    $data = read_json_body();
    $title = clean_string($data['title'] ?? '', 120);
    $automaticId = trim((string) ($data['id'] ?? '')) === '';
    $id = slugify($automaticId ? $title : (string) $data['id']);
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
        'sort_order' => 100,
    ];
    $pdo = db();
    $pdo->beginTransaction();
    if ($automaticId) {
        $base = mb_substr($id, 0, 90);
        $id = $base;
        $probe = $pdo->prepare('SELECT id FROM quiz_categories WHERE id=?');
        for ($suffix = 2; ; $suffix++) {
            $probe->execute([$id]);
            if (!$probe->fetchColumn()) break;
            $id = $base . '-' . $suffix;
        }
        $payload['id'] = $id;
    }
    $existing = $pdo->prepare('SELECT * FROM quiz_categories WHERE id=? FOR UPDATE');
    $existing->execute([$id]);
    $row = $existing->fetch();
    if ($row) {
        $row['worldIds']=category_world_ids($id);
        assert_content_version($row, $data);
    }
    $worldIds=array_key_exists('worldIds',$data) ? $data['worldIds'] : ($row['worldIds'] ?? []);
    $worldErrors=world_id_errors($worldIds,true);
    if ($worldErrors) { $pdo->rollBack();json_response(['ok'=>false,'error'=>implode(' ',$worldErrors)],422); }
    if ($row) $payload['sort_order'] = (int) $row['sort_order'];
    $stmt = $pdo->prepare('INSERT INTO quiz_categories (id, title, description, seo_description, icon, enabled, badge_json, sort_order) VALUES (:id, :title, :description, :seo_description, :icon, :enabled, :badge_json, :sort_order) ON DUPLICATE KEY UPDATE title = VALUES(title), description = VALUES(description), seo_description = VALUES(seo_description), icon = VALUES(icon), enabled = VALUES(enabled), badge_json = VALUES(badge_json), sort_order = VALUES(sort_order)');
    if ($automaticId) {
        // A concurrent creation must never overwrite a category with the same generated ID.
        $stmt = $pdo->prepare('INSERT INTO quiz_categories (id, title, description, seo_description, icon, enabled, badge_json, sort_order) VALUES (:id, :title, :description, :seo_description, :icon, :enabled, :badge_json, :sort_order)');
    }
    try {
        $stmt->execute($payload);
    } catch (PDOException $error) {
        $pdo->rollBack();
        if ($automaticId && ($error->errorInfo[1] ?? null) === 1062) {
            json_response(['ok' => false, 'error' => 'Eine Kategorie wurde gleichzeitig angelegt. Bitte erneut speichern.'], 409);
        }
        throw $error;
    }
    replace_category_worlds($id,$worldIds);
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
