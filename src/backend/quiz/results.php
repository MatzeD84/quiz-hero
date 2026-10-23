<?php
declare(strict_types=1);

function question_result_version(array $question): string
{
    return hash('sha256', json_encode([
        $question['question'], $question['answers'], $question['correct'], $question['difficulty'],
    ], JSON_THROW_ON_ERROR));
}

/** Only content from the frozen server round, never client-supplied history. */
function store_question_version(PDO $pdo, array $question): int
{
    $snapshot = [];
    foreach (['question','answers','correct','difficulty','type','imageUrl','imageAlt','backgroundKnowledge'] as $key) {
        $snapshot[$key] = $question[$key] ?? null;
    }
    $json = json_encode($snapshot, JSON_THROW_ON_ERROR);
    $stmt = $pdo->prepare('INSERT INTO quiz_question_versions(question_id,version_hash,snapshot_json) VALUES(?,?,?) ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)');
    $stmt->execute([$question['id'], hash('sha256', $json), $json]);
    return (int) $pdo->lastInsertId();
}

/** A round freezes the question/answer order, including editorial changes during play. */
function start_round(): void
{
    require_method('POST');
    $user = require_account();
    rate_limit('start-round:' . $user['id'], 30, 300);
    $data = read_json_body();
    if (isset($data['practice']) && !is_bool($data['practice'])) json_response(['ok'=>false,'error'=>'Ungueltiger Rundenmodus.'], 422);
    $practice = $data['practice'] ?? false;
    $ids = $data['questionIds'] ?? null;
    $catalog = load_quiz_data(true, true);
    $worldId=$data['worldId'] ?? '';
    if ($worldId === null) $worldId='';
    if (!is_string($worldId)) json_response(['ok'=>false,'error'=>'Ungültige Quizwelt.'],422);
    $worldTitle=null;
    foreach ($catalog['worlds'] as $world) if ($world['id']===$worldId) $worldTitle=$world['title'];
    if ($worldId!=='' && $worldTitle===null) json_response(['ok'=>false,'error'=>'Quizwelt nicht verfügbar.'],422);
    if ($practice) {
        $practiceCategory = clean_string($data['categoryId'] ?? '', 120);
        if ($practiceCategory === '' || !empty($data['tagId'])) json_response(['ok'=>false,'error'=>'Eine Kategorie fuer die Uebungsrunde auswaehlen.'], 422);
        $ids = [];
        foreach (practice_selections((int) $user['id'], $catalog, true) as $selection) {
            if ($selection['id'] === $practiceCategory) $ids = $selection['questionIds'];
        }
        if (!$ids) json_response(['ok'=>false,'error'=>'Hier sind keine Uebungsfragen mehr offen. Bitte den Reisepass neu oeffnen.'], 409);
        shuffle($ids);
        $ids = array_slice($ids, 0, 10);
    }
    if (!is_array($ids) || !array_is_list($ids) || count($ids) < 1 || count($ids) > 500 || count(array_unique($ids, SORT_REGULAR)) !== count($ids)) {
        json_response(['ok' => false, 'error' => 'Ungueltige Fragenliste.'], 422);
    }
    foreach ($ids as $id) if (!is_int($id) || $id < 1) json_response(['ok' => false, 'error' => 'Ungueltige Fragen-ID.'], 422);
    $category = clean_string($data['categoryId'] ?? '', 120);
    $tag = clean_string($data['tagId'] ?? '', 120);
    if (($category === '') === ($tag === '')) json_response(['ok' => false, 'error' => 'Eine Kategorie oder ein Thema auswaehlen.'], 422);
    $available = [];
    $enabledTags = array_column(array_filter($catalog['tags'], static fn($entry) => $entry['enabled']), 'id');
    if ($tag !== '' && !in_array($tag, $enabledTags, true)) json_response(['ok' => false, 'error' => 'Thema nicht verfuegbar.'], 422);
    foreach ($catalog['categories'] as $entry) {
        if ($category !== '' && $entry['id'] !== $category) continue;
        foreach ($entry['questions'] as $question) {
            if ($worldId!=='' && !in_array($worldId,$question['worldIds'],true)) continue;
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
    $categoryTitle = $tagTitle = null;
    foreach ($catalog['categories'] as $entry) if ($entry['id'] === $category) $categoryTitle = $entry['title'];
    foreach ($catalog['tags'] as $entry) if ($entry['id'] === $tag) $tagTitle = $entry['title'];
    $stmt = db()->prepare('INSERT INTO quiz_rounds(id,user_id,category_id,tag_id,category_title,tag_title,questions_json,is_practice,world_id,world_title) VALUES(?,?,?,?,?,?,?,?,?,?)');
    db()->beginTransaction();
    $lock=db()->prepare('SELECT id FROM quiz_users WHERE id=? FOR UPDATE');$lock->execute([$user['id']]);
    require_account();
    $stmt->execute([$roundId, $user['id'], $category ?: null, $tag ?: null, $categoryTitle, $tagTitle, json_encode($questions, JSON_THROW_ON_ERROR), (int) $practice, $worldId ?: null, $worldTitle]);
    db()->commit();
    json_response(['ok' => true, 'roundId' => $roundId, 'questions' => $questions, 'isPractice' => $practice]);
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
    $lock=$pdo->prepare('SELECT id FROM quiz_users WHERE id=? FOR UPDATE');$lock->execute([$user['id']]);
    require_account();
    $stmt = $pdo->prepare('SELECT * FROM quiz_rounds WHERE id=? AND user_id=? FOR UPDATE');
    $stmt->execute([$id, $user['id']]);
    $round = $stmt->fetch();
    if (!$round) { $pdo->rollBack(); json_response(['ok' => false, 'error' => 'Quizrunde nicht gefunden.'], 404); }
    $questions = json_decode($round['questions_json'], true, 512, JSON_THROW_ON_ERROR);
    $score = $maxScore = $solved = 0;
    $questionResults = [];
    $valid = count($answers) === count($questions);
    foreach ($questions as $i => $question) {
        $attempts = $answers[$i]['selectedAnswers'] ?? null;
        if (($answers[$i]['questionId'] ?? null) !== $question['id'] || !is_array($attempts) || !array_is_list($attempts) || count($attempts) > 2 || count(array_unique($attempts, SORT_REGULAR)) !== count($attempts)) { $valid = false; break; }
        $points = ['easy' => 2, 'medium' => 3, 'hero' => 5][$question['difficulty']] ?? 2;
        $maxScore += $points;
        $earned = 0;
        $outcome = count($attempts) === 0 ? 'skipped' : 'incorrect';
        foreach ($attempts as $attempt => $answer) {
            if (!is_int($answer) || $answer < 0 || $answer >= count($question['answers'])) { $valid = false; break; }
            if ($answer === $question['correct']) {
                if ($attempt !== count($attempts) - 1) $valid = false;
                $earned = $attempt === 0 ? $points : 1;
                $score += $earned;
                $outcome = $attempt === 0 ? 'first_try' : 'second_try';
                $solved++;
                break;
            }
        }
        // Empty answers represent an image that failed to load; they award zero points.
        if (count($attempts) === 1 && $attempts[0] !== $question['correct']) $valid = false;
        $version = question_result_version($question);
        $questionResults[] = [$question['id'], $version, $question['difficulty'], $i + 1, json_encode($attempts, JSON_THROW_ON_ERROR), $outcome, $earned, $points];
    }
    if (!$valid) { $pdo->rollBack(); json_response(['ok' => false, 'error' => 'Ungueltige Antworten oder Versuchsfolge.'], 422); }
    $hash = hash('sha256', json_encode($answers, JSON_THROW_ON_ERROR));
    if ($round['completed_at'] !== null) {
        $pdo->rollBack();
        if (!hash_equals($round['submission_hash'], $hash)) json_response(['ok' => false, 'error' => 'Diese Runde wurde bereits abgeschlossen.'], 409);
        json_response(['ok' => true, 'apiVersion' => QUIZ_HERO_API_VERSION, 'resultId' => (int) $round['result_id'], 'souvenirs'=>souvenir_awards($pdo,(int)$user['id'],(int)$round['result_id']), 'avatarRewards'=>avatar_rewards($pdo,(int)$user['id'],(int)$round['result_id'])]);
    }
    if (strtotime($round['created_at']) < time() - 86400) { $pdo->rollBack(); json_response(['ok' => false, 'error' => 'Diese Runde ist abgelaufen.'], 410); }
    $stmt = $pdo->prepare('INSERT INTO quiz_results(user_id,category_id,tag_id,category_title,tag_title,score,max_score,solved,total_questions,is_practice,world_id,world_title) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)');
    $stmt->execute([$user['id'], $round['category_id'], $round['tag_id'], $round['category_title'], $round['tag_title'], $score, $maxScore, $solved, count($questions), (int) $round['is_practice'], $round['world_id'], $round['world_title']]);
    $resultId = (int) $pdo->lastInsertId();
    $detail = $pdo->prepare('INSERT INTO quiz_question_results(result_id,user_id,question_id,question_version,difficulty,position,selected_answers,outcome,score,max_score,version_id,category_id_at_play) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)');
    foreach ($questionResults as $i => $questionResult) {
        $versionId = store_question_version($pdo, $questions[$i]);
        $detail->execute([$resultId, $user['id'], ...$questionResult, $versionId, $questions[$i]['categoryId']??$round['category_id']]);
    }
    $pdo->prepare('UPDATE quiz_rounds SET submission_hash=?,result_id=?,completed_at=NOW() WHERE id=?')->execute([$hash, $resultId, $id]);
    award_souvenirs($pdo,(int)$user['id'],$resultId);
    award_avatar_rewards($pdo,(int)$user['id'],$resultId);
    $souvenirs=souvenir_awards($pdo,(int)$user['id'],$resultId);
    $rewards=avatar_rewards($pdo,(int)$user['id'],$resultId);
    $pdo->commit();
    json_response(['ok' => true, 'apiVersion' => QUIZ_HERO_API_VERSION, 'resultId' => $resultId, 'souvenirs'=>$souvenirs, 'avatarRewards'=>$rewards]);
}
