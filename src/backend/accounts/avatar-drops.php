<?php
declare(strict_types=1);

/** Parse decimal input exactly, accepting the German comma without float rounding. */
function avatar_drop_chance_bp(mixed $value): ?int
{
    if (!is_string($value) && !is_int($value) && !is_float($value)) return null;
    $text = str_replace(',', '.', trim((string) $value));
    if (!preg_match('/^(\d{1,3})(?:\.(\d{1,2}))?$/D', $text, $parts)) return null;
    $bp = (int) $parts[1] * 100 + (int) str_pad($parts[2] ?? '', 2, '0');
    return $bp >= 1 && $bp <= 10000 ? $bp : null;
}

function freeze_avatar_drops(PDO $pdo, string $roundId): void
{
    $drops = $pdo->query("SELECT avatar_key,drop_chance_bp FROM quiz_avatars WHERE unlock_rule='random_drop' AND enabled=1 AND deleted_at IS NULL AND drop_chance_bp>0 ORDER BY avatar_key")->fetchAll();
    $pdo->prepare('UPDATE quiz_rounds SET avatar_drops_json=? WHERE id=?')->execute([json_encode($drops, JSON_THROW_ON_ERROR), $roundId]);
}

/** First successful draw, once per correct position. Optional RNG is for direct unit tests only. */
function avatar_drop_position(array $correct, int $chance, ?callable $draw = null): ?int
{
    if ($chance < 1 || $chance > 10000) return null;
    foreach ($correct as $position) {
        if (($draw ? $draw() : random_int(1, 10000)) <= $chance) return $position;
    }
    return null;
}

/** Called only for a new result, inside its transaction with account and round locked. */
function award_avatar_drops(PDO $pdo, int $userId, int $resultId, array $round): void
{
    $drops = json_decode($round['avatar_drops_json'] ?? 'null', true);
    if (!$drops) return;
    $stmt = $pdo->prepare("SELECT position FROM quiz_question_results WHERE result_id=? AND user_id=? AND outcome IN ('first_try','second_try') ORDER BY position");
    $stmt->execute([$resultId, $userId]);
    $correct = array_map('intval', $stmt->fetchAll(PDO::FETCH_COLUMN));
    if (!$correct) return;
    $available = array_column($pdo->query("SELECT avatar_key FROM quiz_avatars WHERE unlock_rule='random_drop' AND enabled=1 AND deleted_at IS NULL")->fetchAll(), 'avatar_key');
    $owned = unlocked_avatar_keys($pdo, $userId);
    $insert = $pdo->prepare("INSERT IGNORE INTO quiz_user_avatar_unlocks(user_id,avatar_key,rule_key,source_result_id,is_backfill,rule_snapshot) VALUES(?,?,'random_drop',?,0,?)");
    foreach ($drops as $drop) {
        $key = $drop['avatar_key'];
        if (!in_array($key, $available, true) || in_array($key, $owned, true)) continue;
        $chance = (int) $drop['drop_chance_bp'];
        $position = avatar_drop_position($correct, $chance);
        if ($position === null) continue;
        $snapshot = ['type'=>'random_drop', 'chanceBp'=>$chance, 'position'=>$position];
        $insert->execute([$userId, $key, $resultId, json_encode($snapshot, JSON_THROW_ON_ERROR)]);
    }
}
