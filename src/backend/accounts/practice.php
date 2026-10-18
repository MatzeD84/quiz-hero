<?php
declare(strict_types=1);

/** Only the last actual answer counts; failed image loads never erase a mistake. */
function practice_selections(int $userId, array $catalog, bool $includeQuestionIds = false): array
{
    $stmt = db()->prepare("SELECT r.question_id,r.question_version FROM quiz_question_results r
        WHERE r.user_id=? AND r.outcome='incorrect' AND NOT EXISTS (
            SELECT 1 FROM quiz_question_results newer WHERE newer.user_id=r.user_id
            AND newer.question_id=r.question_id AND newer.outcome<>'skipped'
            AND (newer.created_at>r.created_at OR (newer.created_at=r.created_at AND newer.result_id>r.result_id))
        )");
    $stmt->execute([$userId]);
    $mistakes = [];
    foreach ($stmt->fetchAll() as $row) $mistakes[(int) $row['question_id']] = $row['question_version'];
    $selections = [];
    foreach ($catalog['categories'] as $category) {
        if (!$category['enabled']) continue;
        $ids = [];
        foreach ($category['questions'] as $question) {
            if (isset($mistakes[$question['id']]) && hash_equals($mistakes[$question['id']], question_result_version($question))) $ids[] = $question['id'];
        }
        if ($ids) {
            $selection = ['id'=>$category['id'], 'title'=>$category['title'], 'count'=>count($ids)];
            if ($includeQuestionIds) $selection['questionIds'] = $ids;
            $selections[] = $selection;
        }
    }
    usort($selections, static fn($a, $b) => $b['count'] <=> $a['count'] ?: strcmp($a['title'], $b['title']));
    return $selections;
}
