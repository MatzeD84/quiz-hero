<?php
declare(strict_types=1);

/** A round freezes the question/answer order, including editorial changes during play. */
function start_round(): void
{
    require_method('POST');
    $user = require_account();
    rate_limit('start-round:' . $user['id'], 30, 300);
    $data = read_json_body();
    $ids = $data['questionIds'] ?? null;
    if (!is_array($ids) || !array_is_list($ids) || count($ids) < 1 || count($ids) > 500 || count(array_unique($ids, SORT_REGULAR)) !== count($ids)) {
        json_response(['ok' => false, 'error' => 'Ungueltige Fragenliste.'], 422);
    }
    foreach ($ids as $id) if (!is_int($id) || $id < 1) json_response(['ok' => false, 'error' => 'Ungueltige Fragen-ID.'], 422);
    $category = clean_string($data['categoryId'] ?? '', 120);
    $tag = clean_string($data['tagId'] ?? '', 120);
    if (($category === '') === ($tag === '')) json_response(['ok' => false, 'error' => 'Eine Kategorie oder ein Thema auswaehlen.'], 422);
    $catalog = load_quiz_data(true, true);
    $available = [];
    $enabledTags = array_column(array_filter($catalog['tags'], static fn($entry) => $entry['enabled']), 'id');
    if ($tag !== '' && !in_array($tag, $enabledTags, true)) json_response(['ok' => false, 'error' => 'Thema nicht verfuegbar.'], 422);
    foreach ($catalog['categories'] as $entry) {
        if ($category !== '' && $entry['id'] !== $category) continue;
        foreach ($entry['questions'] as $question) {
            if ($tag !== '' && !in_array($tag, $question['tag'], true)) continue;
            $available[$question['id']] = $question;
        }
    }
    $questions = [];
    foreach ($ids as $id) {
        if (!isset($available[$id])) json_response(['ok' => false, 'error' => 'Fragen wurden geaendert. Bitte die Seite neu laden.'], 409);
        $questions[] = $available[$id];
    }
    $roundId = bin2hex(random_bytes(32));
    $stmt = db()->prepare('INSERT INTO quiz_rounds(id,user_id,category_id,tag_id,questions_json) VALUES(?,?,?,?,?)');
    $stmt->execute([$roundId, $user['id'], $category ?: null, $tag ?: null, json_encode($questions, JSON_THROW_ON_ERROR)]);
    json_response(['ok' => true, 'roundId' => $roundId, 'questions' => $questions]);
}

/** Recompute points from the frozen round; retries cannot create duplicate results. */
function save_result(): void
{
    require_method('POST');
    $user = require_account();
    rate_limit('save-result', 60, 300);
    $data = read_json_body();
    $id = $data['roundId'] ?? '';
    $answers = $data['answers'] ?? null;
    if (!is_string($id) || !preg_match('/^[a-f0-9]{64}$/D', $id) || !is_array($answers) || !array_is_list($answers)) {
        json_response(['ok' => false, 'error' => 'Eine gestartete Quizrunde mit Antworten ist erforderlich.'], 422);
    }
    $pdo = db();
    $pdo->beginTransaction();
    $stmt = $pdo->prepare('SELECT * FROM quiz_rounds WHERE id=? AND user_id=? FOR UPDATE');
    $stmt->execute([$id, $user['id']]);
    $round = $stmt->fetch();
    if (!$round) { $pdo->rollBack(); json_response(['ok' => false, 'error' => 'Quizrunde nicht gefunden.'], 404); }
    $questions = json_decode($round['questions_json'], true, 512, JSON_THROW_ON_ERROR);
    $score = $maxScore = $solved = 0;
    $valid = count($answers) === count($questions);
    foreach ($questions as $i => $question) {
        $attempts = $answers[$i]['selectedAnswers'] ?? null;
        if (($answers[$i]['questionId'] ?? null) !== $question['id'] || !is_array($attempts) || !array_is_list($attempts) || count($attempts) > 2 || count(array_unique($attempts, SORT_REGULAR)) !== count($attempts)) { $valid = false; break; }
        $points = ['easy' => 2, 'medium' => 3, 'hero' => 5][$question['difficulty']] ?? 2;
        $maxScore += $points;
        foreach ($attempts as $attempt => $answer) {
            if (!is_int($answer) || $answer < 0 || $answer >= count($question['answers'])) { $valid = false; break; }
            if ($answer === $question['correct']) {
                if ($attempt !== count($attempts) - 1) $valid = false;
                $score += $attempt === 0 ? $points : 1;
                $solved++;
                break;
            }
        }
        // Empty answers represent an image that failed to load; they award zero points.
        if (count($attempts) === 1 && $attempts[0] !== $question['correct']) $valid = false;
    }
    if (!$valid) { $pdo->rollBack(); json_response(['ok' => false, 'error' => 'Ungueltige Antworten oder Versuchsfolge.'], 422); }
    $hash = hash('sha256', json_encode($answers, JSON_THROW_ON_ERROR));
    if ($round['completed_at'] !== null) {
        $pdo->rollBack();
        if (!hash_equals($round['submission_hash'], $hash)) json_response(['ok' => false, 'error' => 'Diese Runde wurde bereits abgeschlossen.'], 409);
        json_response(['ok' => true, 'apiVersion' => QUIZ_HERO_API_VERSION, 'resultId' => (int) $round['result_id']]);
    }
    if (strtotime($round['created_at']) < time() - 86400) { $pdo->rollBack(); json_response(['ok' => false, 'error' => 'Diese Runde ist abgelaufen.'], 410); }
    $stmt = $pdo->prepare('INSERT INTO quiz_results(user_id,category_id,tag_id,score,max_score,solved,total_questions) VALUES(?,?,?,?,?,?,?)');
    $stmt->execute([$user['id'], $round['category_id'], $round['tag_id'], $score, $maxScore, $solved, count($questions)]);
    $resultId = (int) $pdo->lastInsertId();
    $pdo->prepare('UPDATE quiz_rounds SET submission_hash=?,result_id=?,completed_at=NOW() WHERE id=?')->execute([$hash, $resultId, $id]);
    $pdo->commit();
    json_response(['ok' => true, 'apiVersion' => QUIZ_HERO_API_VERSION, 'resultId' => $resultId]);
}
