<?php
declare(strict_types=1);

function public_data(): void
{
    require_method('GET');
    emit_quiz_data(true, true);
}

function admin_data(): void
{
    require_method('GET');
    require_admin();
    emit_quiz_data(false, false);
}

function emit_quiz_data(bool $onlyActive, bool $onlyEnabledCategories): void
{
    json_response(['ok' => true, 'apiVersion' => QUIZ_HERO_API_VERSION] + load_quiz_data($onlyActive, $onlyEnabledCategories));
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
    $worldRows = $pdo->query('SELECT * FROM quiz_worlds ORDER BY title,id')->fetchAll();
    $worlds = array_map(static fn($row) => ['id'=>$row['id'],'title'=>$row['title'],'description'=>$row['description'],'enabled'=>(bool)$row['enabled'],'contentVersion'=>content_version($row)], array_values(array_filter($worldRows,static fn($row)=>!$onlyActive || $row['enabled'])));
    $worldMap = [];
    foreach ($pdo->query('SELECT question_id,world_id FROM quiz_question_worlds ORDER BY world_id')->fetchAll() as $link) $worldMap[(int)$link['question_id']][]=$link['world_id'];
    $categoryWorldMap=[];
    foreach ($pdo->query('SELECT category_id,world_id FROM quiz_category_worlds ORDER BY world_id')->fetchAll() as $link) $categoryWorldMap[$link['category_id']][]=$link['world_id'];

    $categoriesStmt = $pdo->query('SELECT * FROM quiz_categories ORDER BY sort_order ASC, title ASC');
    $categoryRows = array_values(array_filter(
        $categoriesStmt->fetchAll(),
        static fn(array $category): bool => !$onlyEnabledCategories || (bool) $category['enabled']
    ));

    $questionSql = 'SELECT * FROM quiz_questions' . ($onlyActive ? ' WHERE active = 1' : '') . ' ORDER BY category_id ASC, sort_order ASC, id ASC';
    $questionRows = $pdo->query($questionSql)->fetchAll();
    $questionsByCategory = [];
    foreach ($questionRows as $questionRow) {
        $questionRow=question_with_worlds($questionRow,$worldMap[(int)$questionRow['id']] ?? [],$categoryWorldMap[$questionRow['category_id']] ?? []);
        $questionsByCategory[$questionRow['category_id']][] = format_question($questionRow);
    }

    $categories = array_map(
        static fn(array $category): array => format_category($category + ['worldIds'=>$categoryWorldMap[$category['id']] ?? []], $questionsByCategory[$category['id']] ?? []),
        $categoryRows
    );

    $tagsStmt = $pdo->query('SELECT * FROM quiz_tags ORDER BY sort_order ASC, title ASC');
    $tags = array_map(static fn(array $tag): array => [
        'id' => $tag['id'],
        'title' => $tag['title'],
        'description' => $tag['description'] ?? '',
        'icon' => $tag['icon'] ?? '',
        'enabled' => (bool) ($tag['enabled'] ?? true),
        'badge' => decode_json_field($tag['badge_json'] ?? null, ['active' => false, 'text' => '']),
    ], $tagsStmt->fetchAll());

    $feedbackStmt = $pdo->query('SELECT feedback_key, messages_json FROM quiz_feedback');
    $feedback = [];
    foreach ($feedbackStmt->fetchAll() as $entry) {
        $feedback[$entry['feedback_key']] = decode_json_field($entry['messages_json'] ?? null, []);
    }

    return ['worlds' => $worlds, 'categories' => $categories, 'tags' => $tags, 'feedback' => $feedback];
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

function format_question(array $question): array
{
    return [
        'id' => (int) $question['id'],
        'contentVersion' => content_version($question),
        'categoryId' => $question['category_id'],
        'worldIds' => $question['worldIds'] ?? [],
        'directWorldIds' => $question['directWorldIds'] ?? [],
        'inheritedWorldIds' => $question['inheritedWorldIds'] ?? [],
        'question' => $question['question'],
        'answers' => decode_json_field($question['answers_json'] ?? null, []),
        'correct' => (int) $question['correct_index'],
        'difficulty' => $question['difficulty'],
        'type' => $question['question_type'],
        'imageUrl' => $question['image_url'] ?? '',
        'tag' => canonical_question_tags(decode_json_field($question['tags_json'] ?? null, [])),
        'backgroundKnowledge' => $question['background_knowledge'] ?? '',
        ...decode_json_field($question['editorial_json'] ?? null, []),
        'active' => (bool) $question['active'],
        'reviewed' => (bool) ($question['reviewed'] ?? false),
        'sortOrder' => (int) $question['sort_order'],
        'createdAt' => isset($question['created_at']) ? date(DATE_ATOM, strtotime((string) $question['created_at'])) : '',
        'updatedAt' => isset($question['updated_at']) ? date(DATE_ATOM, strtotime((string) $question['updated_at'])) : '',
    ];
}

function content_version(array $row): string
{
    return hash('sha256', json_encode($row, JSON_THROW_ON_ERROR));
}

function assert_content_version(?array $row, array $data): void
{
    if (!$row || !is_string($data['contentVersion'] ?? null) || !hash_equals(content_version($row), $data['contentVersion'])) {
        if (db()->inTransaction()) db()->rollBack();
        json_response(['ok' => false, 'error' => 'Der Eintrag wurde zwischenzeitlich geaendert oder geloescht. Bitte neu laden; deine Eingaben bleiben erhalten.'], 409);
    }
}
