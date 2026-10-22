<?php
declare(strict_types=1);

function unlocked_avatar_keys(PDO $pdo, int $userId): array
{
    $stmt=$pdo->prepare('SELECT avatar_key FROM quiz_user_avatar_unlocks WHERE user_id=?');
    $stmt->execute([$userId]);
    return $stmt->fetchAll(PDO::FETCH_COLUMN);
}

function require_avatar_access(string $key, int $userId=0): void
{
    $avatar=hero_avatars()[$key]??null;
    if(!$avatar)json_response(['ok'=>false,'error'=>'Dieses Profilbild steht nicht mehr zur Verfügung. Bitte wähle ein anderes.'],422);
    if (!empty($avatar['unlockRule']) && ($userId===0 || !in_array($key,unlocked_avatar_keys(db(),$userId),true))) {
        json_response(['ok'=>false,'error'=>'Dieses Heldenbild ist noch nicht freigeschaltet.'],422);
    }
}

/** Caller holds the user's row lock. Only server-scored, frozen difficulty counts. */
function award_avatar_rewards(PDO $pdo, int $userId, ?int $resultId): void
{
    $stmt=$pdo->prepare("SELECT 1 FROM quiz_question_results WHERE user_id=? AND difficulty='hero' AND outcome='first_try'".($resultId===null?'':' AND result_id=?').' LIMIT 1');
    $stmt->execute($resultId===null?[$userId]:[$userId,$resultId]);
    if (!$stmt->fetchColumn()) return;
    $insert=$pdo->prepare('INSERT IGNORE INTO quiz_user_avatar_unlocks(user_id,avatar_key,rule_key,source_result_id,is_backfill) VALUES(?,?,?,?,?)');
    foreach(hero_avatars() as $avatar) {
        if (($avatar['unlockRule']??'')==='hero_first_try') $insert->execute([$userId,$avatar['key'],'hero_first_try',$resultId,(int)($resultId===null)]);
    }
}

function avatar_rewards(PDO $pdo, int $userId, ?int $resultId=null): array
{
    $stmt=$pdo->prepare('SELECT * FROM quiz_user_avatar_unlocks WHERE user_id=?'.($resultId===null?'':' AND source_result_id=?').' ORDER BY awarded_at DESC,avatar_key');
    $stmt->execute($resultId===null?[$userId]:[$userId,$resultId]);
    $catalog=hero_avatars();$rewards=[];
    foreach($stmt as $row) {
        $avatar=$catalog[$row['avatar_key']]??null;
        if($avatar) $rewards[]=['avatarKey'=>$avatar['key'],'title'=>$avatar['label'],'image'=>$avatar['url'],'rule'=>$row['rule_key'],'awardedAt'=>date(DATE_ATOM,strtotime($row['awarded_at'])),'backfilled'=>(bool)$row['is_backfill']];
    }
    return $rewards;
}
