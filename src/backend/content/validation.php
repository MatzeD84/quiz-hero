<?php
declare(strict_types=1);

function question_duplicate_key(string $question): string
{
    $question = mb_strtolower(trim($question), 'UTF-8');
    $question = preg_replace('/\s+/u', ' ', $question) ?? $question;
    return $question;
}

function canonical_question_tags(mixed $tags): array
{
    static $known = null;
    if ($known === null) {
        $known = [];
        foreach (db()->query('SELECT id FROM quiz_tags')->fetchAll(PDO::FETCH_COLUMN) as $id) {
            $known[slugify($id)] = $id;
        }
    }
    $values = is_array($tags) ? $tags : explode(',', (string) $tags);
    $result = [];
    foreach ($values as $tag) {
        if (!is_string($tag)) continue;
        $tag = clean_string($tag, 120);
        if ($tag === '') continue;
        $key = slugify($tag);
        $result[$key] = $known[$key] ?? $tag;
    }
    return array_values($result);
}

function normalize_import_tags(mixed $tags): string
{
    if (is_array($tags)) {
        return implode(',', array_map(static fn($tag): string => (string) $tag, $tags));
    }
    return (string) $tags;
}

function validate_import_question(mixed $entry, int $index, array $categoryIds, array $existingKeys, array &$seenImportKeys): array
{
    $number = $index + 1;
    $errors = [];
    $warnings = [];
    if (!is_array($entry)) {
        return [
            'index' => $index,
            'valid' => false,
            'question' => '',
            'categoryId' => '',
            'errors' => ["Eintrag {$number} ist kein Objekt."],
            'warnings' => [],
            'payload' => null,
        ];
    }

    $categoryRaw = trim((string) ($entry['categoryId'] ?? $entry['category'] ?? ''));
    $categoryId = $categoryRaw === '' ? '' : slugify($categoryRaw);
    $inherited=category_world_ids($categoryId);
    $worldIds=array_key_exists('worldIds',$entry) ? $entry['worldIds'] : ($inherited ? [] : ['italien']);
    if (!array_key_exists('worldIds',$entry) && !$inherited) $warnings[]='Quizwelten fehlen und die Kategorie hat keine Vorgabe: Altimport wird Italien zugeordnet.';
    $errors=array_merge($errors,world_id_errors($worldIds,true));
    if (!$errors && !$worldIds && !$inherited) $errors[]='Mindestens eine direkte oder über die Kategorie geerbte Quizwelt auswählen.';
    $questionText = clean_string($entry['question'] ?? '', 1000);
    $answers = is_array($entry['answers'] ?? null)
        ? array_values(array_map(static fn($answer): string => clean_string((string) $answer, 255), $entry['answers']))
        : [];
    $answers = array_values(array_filter($answers, static fn(string $answer): bool => $answer !== ''));
    $correctRaw = $entry['correct'] ?? 0;
    $correct = filter_var($correctRaw, FILTER_VALIDATE_INT);
    $difficulty = clean_string($entry['difficulty'] ?? 'easy', 20);
    $tags = canonical_question_tags($entry['tags'] ?? $entry['tag'] ?? []);
    $imageUrl = clean_url($entry['imageUrl'] ?? $entry['image'] ?? '', 500);
    if (trim((string) ($entry['imageUrl'] ?? $entry['image'] ?? '')) !== '' && $imageUrl === '') $errors[] = 'Ungültiger Bildpfad.';
    $sortOrder = filter_var($entry['sortOrder'] ?? 100, FILTER_VALIDATE_INT);

    if ($categoryId === '') {
        $errors[] = 'Kategorie fehlt.';
    } elseif (!isset($categoryIds[$categoryId])) {
        $warnings[] = "Kategorie '{$categoryId}' existiert noch nicht und wird automatisch angelegt.";
    }
    if ($questionText === '') {
        $errors[] = 'Fragetext fehlt.';
    }
    if (count($answers) !== 4) {
        $errors[] = 'Es muessen genau vier nicht leere Antworten vorhanden sein.';
    }
    if ($correct === false || $correct < 0 || $correct > 3) {
        $errors[] = 'correct muss eine Zahl zwischen 0 und 3 sein.';
        $correct = 0;
    }
    if (!in_array($difficulty, ['easy', 'medium', 'hero'], true)) {
        $warnings[] = "Unbekannte Schwierigkeit '{$difficulty}' wurde auf easy gesetzt.";
        $difficulty = 'easy';
    }
    if ($sortOrder === false || $sortOrder < 0 || $sortOrder > 100000) {
        $warnings[] = 'Ungültige Sortierung wurde auf 100 gesetzt.';
        $sortOrder = 100;
    }
    if ($questionText !== '') {
        $duplicateKey = question_duplicate_key($questionText);
        if (isset($existingKeys[$duplicateKey])) {
            $errors[] = 'Diese Frage existiert bereits.';
        } elseif (isset($seenImportKeys[$duplicateKey])) {
            $errors[] = 'Diese Frage kommt mehrfach in der Importdatei vor.';
        } else {
            $seenImportKeys[$duplicateKey] = true;
        }
    }

    $payload = null;
    if ($errors === []) {
        $payload = [
            'worldIds' => array_values(array_unique($worldIds)),
            'category_id' => $categoryId,
            'question' => $questionText,
            'answers_json' => json_encode($answers, JSON_UNESCAPED_UNICODE),
            'correct_index' => $correct,
            'difficulty' => $difficulty,
            'question_type' => $imageUrl !== '' ? 'image' : 'text',
            'image_url' => $imageUrl ?: null,
            'tags_json' => json_encode($tags, JSON_UNESCAPED_UNICODE),
            'background_knowledge' => clean_string($entry['backgroundKnowledge'] ?? $entry['background'] ?? '', 2000) ?: null,
            'editorial_json' => json_encode(normalize_editorial($entry), JSON_UNESCAPED_UNICODE),
            'active' => array_key_exists('active', $entry) ? (!empty($entry['active']) ? 1 : 0) : 1,
            'reviewed' => !empty($entry['reviewed']) ? 1 : 0,
            'sort_order' => $sortOrder,
        ];
    }

    return [
        'index' => $index,
        'valid' => $errors === [],
        'question' => $questionText,
        'categoryId' => $categoryId,
        'errors' => $errors,
        'warnings' => $warnings,
        'payload' => $payload,
    ];
}

function question_feedback_type_label(string $type): string
{
    return match ($type) {
        'wrong-answer' => 'Antwort falsch',
        'unclear-question' => 'Frage unklar',
        'image-mismatch' => 'Bild passt nicht',
        'spelling' => 'Rechtschreibung',
        'other' => 'Sonstiges',
        default => $type,
    };
}

function normalize_editorial(array $data): array
{
    foreach (['sourceUrl', 'reviewedBy', 'reviewedAt', 'imageAlt'] as $field) {
        if (isset($data[$field]) && !is_string($data[$field])) json_response(['ok' => false, 'error' => 'Ungültiges Textfeld: ' . $field], 422);
    }
    $source = trim((string) ($data['sourceUrl'] ?? $data['meta']['sourceUrl'] ?? ''));
    if ($source !== '' && (!filter_var($source, FILTER_VALIDATE_URL) || !in_array(strtolower((string) parse_url($source, PHP_URL_SCHEME)), ['http', 'https'], true) || parse_url($source, PHP_URL_USER) !== null || strlen($source) > 1000)) {
        json_response(['ok' => false, 'error' => 'Quelle muss eine gültige HTTP(S)-URL ohne Zugangsdaten sein.'], 422);
    }
    $date = trim((string) ($data['reviewedAt'] ?? ''));
    if ($date !== '' && (!preg_match('/^\d{4}-\d{2}-\d{2}$/D', $date) || !checkdate((int) substr($date,5,2), (int) substr($date,8,2), (int) substr($date,0,4)) || $date > gmdate('Y-m-d'))) {
        json_response(['ok' => false, 'error' => 'Prüfdatum muss ein gültiges Datum sein und darf nicht in der Zukunft liegen.'], 422);
    }
    return ['sourceUrl' => $source, 'reviewedBy' => clean_string($data['reviewedBy'] ?? '', 120), 'reviewedAt' => $date, 'imageAlt' => clean_string($data['imageAlt'] ?? '', 500)];
}

function normalize_question_payload(array $data): array
{
    foreach (['categoryId', 'question', 'difficulty', 'imageUrl', 'backgroundKnowledge'] as $field) {
        if (isset($data[$field]) && !is_string($data[$field])) json_response(['ok' => false, 'error' => 'Ungültiges Textfeld: ' . $field], 422);
    }
    if (trim($data['question'] ?? '') === '' || trim($data['categoryId'] ?? '') === '') {
        json_response(['ok' => false, 'error' => 'Frage und Kategorie müssen ausgefüllt sein.'], 422);
    }
    if (!is_array($data['answers'] ?? null) || count($data['answers']) !== 4 || array_filter($data['answers'], static fn($answer): bool => !is_string($answer)) !== []) {
        json_response(['ok' => false, 'error' => 'Vier Antworten als Text erforderlich.'], 422);
    }
    $categoryCheck = db()->prepare('SELECT id FROM quiz_categories WHERE id = ?');
    $categoryCheck->execute([$data['categoryId']]);
    if (!$categoryCheck->fetchColumn()) json_response(['ok' => false, 'error' => 'Kategorie existiert nicht.'], 422);
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
    if (trim((string) ($data['imageUrl'] ?? '')) !== '' && $imageUrl === '') {
        json_response(['ok' => false, 'error' => 'Ungültiger Bildpfad. Die Frage wurde nicht gespeichert.'], 422);
    }
    $type = $imageUrl !== '' ? 'image' : 'text';
    $tags = canonical_question_tags($data['tags'] ?? []);

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
        'editorial_json' => json_encode(normalize_editorial($data), JSON_UNESCAPED_UNICODE),
        'active' => !empty($data['active']) ? 1 : 0,
        'reviewed' => !empty($data['reviewed']) ? 1 : 0,
        'sort_order' => ensure_int($data['sortOrder'] ?? 100, 0, 100000),
    ];
}

function format_category(array $category, array $questions): array
{
    return [
        'id' => $category['id'],
        'contentVersion' => content_version($category),
        'worldIds' => $category['worldIds'] ?? [],
        'title' => $category['title'],
        'enabled' => (bool) $category['enabled'],
        'icon' => $category['icon'] ?? '',
        'description' => $category['description'] ?? '',
        'seoDescription' => $category['seo_description'] ?? '',
        'sortOrder' => (int) $category['sort_order'],
        'questionsFile' => null,
        'badge' => decode_json_field($category['badge_json'] ?? null, ['active' => false, 'text' => '']),
        'questions' => $questions,
    ];
}
