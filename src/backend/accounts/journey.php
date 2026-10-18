<?php
declare(strict_types=1);

/** Private journey: identity always comes from the authenticated session. */
function account_journey(): void
{
    require_method('POST');
    $user = require_account();
    $userId = (int) $user['id'];
    $pdo = db();
    $catalog = load_quiz_data(true, false);
    json_response(['ok' => true] + journey_result_summary($pdo, $userId, $catalog) + [
        'difficultyStats' => journey_difficulty_stats($pdo, $userId),
        'practice' => practice_selections($userId, $catalog),
    ]);
}

function journey_difficulty_stats(PDO $pdo, int $userId): array
{
    $difficultyStats = [];
    foreach (['easy', 'medium', 'hero'] as $difficulty) {
        $difficultyStats[$difficulty] = ['solved' => 0, 'total' => 0, 'percent' => null];
    }
    $stmt = $pdo->prepare("SELECT difficulty, COUNT(*) AS total, SUM(outcome IN ('first_try','second_try')) AS solved FROM quiz_question_results WHERE user_id = ? AND difficulty IS NOT NULL GROUP BY difficulty");
    $stmt->execute([$userId]);
    foreach ($stmt->fetchAll() as $row) {
        $total = (int) $row['total'];
        $solved = (int) $row['solved'];
        $difficultyStats[$row['difficulty']] = ['solved' => $solved, 'total' => $total, 'percent' => $total ? (int) round($solved / $total * 100) : null];
    }
    return $difficultyStats;
}

function journey_catalog_selections(array $catalog): array
{
    $selections = [];
    foreach ($catalog['categories'] as $category) {
        $selections['category:' . $category['id']] = [
            'kind' => 'category', 'id' => $category['id'], 'title' => $category['title'], 'image' => $category['icon'] ?? '',
            'available' => (bool) $category['enabled'] && count($category['questions']) > 0, 'rounds' => 0, 'lastPlayed' => null,
        ];
    }
    foreach ($catalog['tags'] as $tag) {
        $available = false;
        foreach ($catalog['categories'] as $category) {
            if (!$category['enabled']) continue;
            foreach ($category['questions'] as $question) {
                if (in_array($tag['id'], $question['tag'] ?? [], true)) { $available = true; break 2; }
            }
        }
        $selections['tag:' . $tag['id']] = [
            'kind' => 'tag', 'id' => $tag['id'], 'title' => $tag['title'], 'image' => $tag['icon'] ?? '',
            'available' => (bool) $tag['enabled'] && $available, 'rounds' => 0, 'lastPlayed' => null,
        ];
    }
    return $selections;
}

function journey_result_summary(PDO $pdo, int $userId, array $catalog): array
{
    $stmt = $pdo->prepare('SELECT category_id, tag_id, category_title, tag_title, COUNT(*) AS rounds, SUM(solved) AS solved, SUM(total_questions) AS total_questions, MAX(created_at) AS last_played, MAX(id) AS last_result FROM quiz_results WHERE user_id = ? GROUP BY category_id, tag_id, category_title, tag_title ORDER BY last_played DESC,last_result DESC');
    $stmt->execute([$userId]);
    $groups = $stmt->fetchAll();
    $selections = journey_catalog_selections($catalog);
    $rounds = $categoryCount = $topicCount = 0;
    foreach ($groups as $group) {
        $kind = $group['category_id'] ? 'category' : (!empty($group['tag_id']) ? 'tag' : 'unknown');
        $id = $group['category_id'] ?: $group['tag_id'];
        $key = $kind . ':' . ($id ?? '');
        $historicalTitle = $kind === 'category' ? $group['category_title'] : $group['tag_title'];
        $selections[$key] ??= ['kind' => $kind, 'id' => $id ?? '', 'title' => $historicalTitle ?: 'Früheres Quiz', 'image' => '', 'available' => false, 'rounds' => 0, 'lastPlayed' => null];
        $selections[$key]['rounds'] += (int) $group['rounds'];
        $selections[$key]['solved'] = ($selections[$key]['solved'] ?? 0) + (int) $group['solved'];
        $selections[$key]['totalQuestions'] = ($selections[$key]['totalQuestions'] ?? 0) + (int) $group['total_questions'];
        $played = date(DATE_ATOM, strtotime($group['last_played']));
        if ($played > ($selections[$key]['lastPlayed'] ?? '')) $selections[$key]['lastPlayed'] = $played;
        $rounds += (int) $group['rounds'];

    }
    foreach ($selections as $selection) {
        if (!$selection['rounds'] || !$selection['id']) continue;
        if ($selection['kind'] === 'category') $categoryCount++; elseif ($selection['kind'] === 'tag') $topicCount++;
    }
    return ['summary' => ['rounds' => $rounds, 'categories' => $categoryCount, 'topics' => $topicCount], 'selections' => array_values($selections)];
}
