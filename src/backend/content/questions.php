<?php
declare(strict_types=1);

function admin_question_save(): void
{
    require_method('POST');
    require_admin_csrf();
    $data = read_json_body();
    $question = normalize_question_payload($data);
    $pdo = db();

    $pdo->beginTransaction();
    $categoryLock=$pdo->prepare('SELECT id FROM quiz_categories WHERE id=? FOR UPDATE');
    $categoryLock->execute([$question['category_id']]);
    if (!$categoryLock->fetchColumn()) { $pdo->rollBack();json_response(['ok'=>false,'error'=>'Kategorie existiert nicht mehr.'],422); }
    $inherited=category_world_ids($question['category_id']);
    $hasWorldIds = array_key_exists('worldIds',$data);
    $worldIds = $hasWorldIds ? $data['worldIds'] : null;
    if (!empty($data['id'])) {
        $existing = $pdo->prepare('SELECT * FROM quiz_questions WHERE id=? FOR UPDATE');
        $existing->execute([ensure_int($data['id'], 1, PHP_INT_MAX)]);
        $row=$existing->fetch() ?: null;
        if ($row) $row=question_with_worlds($row,question_world_ids((int)$row['id']),category_world_ids($row['category_id']));
        assert_content_version($row, $data);
        if (!$hasWorldIds) $worldIds=$row['directWorldIds'] ?: ($inherited ? [] : ['italien']);
        $stmt = $pdo->prepare('UPDATE quiz_questions SET category_id = :category_id, question = :question, answers_json = :answers_json, correct_index = :correct_index, difficulty = :difficulty, question_type = :question_type, image_url = :image_url, tags_json = :tags_json, background_knowledge = :background_knowledge, editorial_json = :editorial_json, active = :active, reviewed = :reviewed, sort_order = :sort_order WHERE id = :id');
        $question['id'] = ensure_int($data['id'], 1, PHP_INT_MAX);
    } else {
        $stmt = $pdo->prepare('INSERT INTO quiz_questions (category_id, question, answers_json, correct_index, difficulty, question_type, image_url, tags_json, background_knowledge, editorial_json, active, reviewed, sort_order) VALUES (:category_id, :question, :answers_json, :correct_index, :difficulty, :question_type, :image_url, :tags_json, :background_knowledge, :editorial_json, :active, :reviewed, :sort_order)');
    }
    if (!$hasWorldIds && $worldIds === null) $worldIds=$inherited ? [] : ['italien'];
    $worldErrors=world_id_errors($worldIds,true);
    if (!$worldErrors && !$worldIds && !$inherited) $worldErrors[]='Mindestens eine direkte oder über die Kategorie geerbte Quizwelt auswählen.';
    if ($worldErrors) { $pdo->rollBack(); json_response(['ok'=>false,'error'=>implode(' ',$worldErrors)],422); }
    $stmt->execute($question);
    $savedId = !empty($question['id']) ? $question['id'] : (int) $pdo->lastInsertId();
    replace_question_worlds($savedId,$worldIds);
    $pdo->commit();

    json_response(['ok' => true, 'apiVersion' => QUIZ_HERO_API_VERSION, 'id' => $savedId]);
}

function admin_question_import(): void
{
    require_method('POST');
    require_admin_csrf();
    $data = read_json_body();
    $rawQuestions = $data['questions'] ?? null;
    if (!is_array($rawQuestions)) {
        json_response(['ok' => false, 'error' => 'Import erwartet ein Array "questions".'], 422);
    }
    if (count($rawQuestions) === 0) {
        json_response(['ok' => false, 'error' => 'Die Importdatei enthält keine Fragen.'], 422);
    }
    if (count($rawQuestions) > 200) {
        json_response(['ok' => false, 'error' => 'Maximal 200 Fragen pro Import.'], 422);
    }

    $pdo = db();
    $categoryIds = array_fill_keys($pdo->query('SELECT id FROM quiz_categories')->fetchAll(PDO::FETCH_COLUMN), true);
    $existingKeys = [];
    foreach ($pdo->query('SELECT question FROM quiz_questions')->fetchAll(PDO::FETCH_COLUMN) as $questionText) {
        $existingKeys[question_duplicate_key((string) $questionText)] = true;
    }

    $seenImportKeys = [];
    $validQuestions = [];
    $results = [];
    foreach (array_values($rawQuestions) as $index => $entry) {
        $result = validate_import_question($entry, $index, $categoryIds, $existingKeys, $seenImportKeys);
        if ($result['valid']) {
            $validQuestions[] = $result['payload'];
        }
        unset($result['payload']);
        $results[] = $result;
    }

    if ($validQuestions === []) {
        json_response([
            'ok' => false,
            'apiVersion' => QUIZ_HERO_API_VERSION,
            'error' => 'Keine gültige Frage zum Importieren gefunden.',
            'results' => $results,
        ], 422);
    }

    $stmt = $pdo->prepare('INSERT INTO quiz_questions (category_id, question, answers_json, correct_index, difficulty, question_type, image_url, tags_json, background_knowledge, editorial_json, active, reviewed, sort_order) VALUES (:category_id, :question, :answers_json, :correct_index, :difficulty, :question_type, :image_url, :tags_json, :background_knowledge, :editorial_json, :active, :reviewed, :sort_order)');
    $categoryStmt = $pdo->prepare('INSERT IGNORE INTO quiz_categories (id, title, description, seo_description, icon, enabled, badge_json, sort_order) VALUES (:id, :title, "", "", NULL, 1, :badge_json, 100)');
    $pdo->beginTransaction();
    try {
        foreach ($validQuestions as $question) {
            $worldIds=$question['worldIds'];unset($question['worldIds']);
            if (!isset($categoryIds[$question['category_id']])) {
                $categoryStmt->execute([
                    'id' => $question['category_id'],
                    'title' => $question['category_id'],
                    'badge_json' => json_encode(['active' => false, 'text' => ''], JSON_UNESCAPED_UNICODE),
                ]);
                $categoryIds[$question['category_id']] = true;
            }
            $categoryLock=$pdo->prepare('SELECT id FROM quiz_categories WHERE id=? FOR UPDATE');
            $categoryLock->execute([$question['category_id']]);
            if (!$worldIds && !category_world_ids($question['category_id'])) {
                $pdo->rollBack();
                json_response(['ok'=>false,'error'=>'Die geerbten Quizwelten wurden geändert. Import bitte erneut prüfen.'],409);
            }
            $stmt->execute($question);
            replace_question_worlds((int)$pdo->lastInsertId(),$worldIds);
        }
        $pdo->commit();
    } catch (Throwable $exception) {
        $pdo->rollBack();
        throw $exception;
    }

    json_response([
        'ok' => true,
        'apiVersion' => QUIZ_HERO_API_VERSION,
        'importedCount' => count($validQuestions),
        'skippedCount' => count($rawQuestions) - count($validQuestions),
        'results' => $results,
    ]);
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
