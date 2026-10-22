<?php
declare(strict_types=1);

function souvenir_definitions(PDO $pdo): array
{
    return $pdo->query("SELECT * FROM quiz_souvenir_definitions WHERE state='active' ORDER BY category_id,rule_type DESC,id")->fetchAll();
}

function souvenir_progress(PDO $pdo, int $userId): array
{
    $stmt=$pdo->prepare("SELECT category_id_at_play,COUNT(DISTINCT question_id) AS discoveries FROM quiz_question_results WHERE user_id=? AND category_id_at_play IS NOT NULL AND outcome IN ('first_try','second_try') GROUP BY category_id_at_play");
    $stmt->execute([$userId]);
    $progress=[];
    foreach($stmt as $row) $progress[$row['category_id_at_play']]=['discoveries'=>(int)$row['discoveries'],'visited'=>false];
    // Legacy solved totals are evidence of at least one actual answer; topic totals are not city visits.
    $stmt=$pdo->prepare("SELECT DISTINCT r.category_id FROM quiz_results r WHERE r.user_id=? AND r.category_id IS NOT NULL AND (r.solved>0 OR EXISTS(SELECT 1 FROM quiz_question_results q WHERE q.result_id=r.id AND q.outcome<>'skipped'))");
    $stmt->execute([$userId]);
    foreach($stmt as $row){$id=$row['category_id'];$progress[$id]??=['discoveries'=>0,'visited'=>false];$progress[$id]['visited']=true;}
    return $progress;
}

/** Caller holds the user row lock. Award + result are committed together. */
function award_souvenirs(PDO $pdo, int $userId, ?int $resultId): void
{
    $progress=souvenir_progress($pdo,$userId);
    $enabled=$pdo->query('SELECT id FROM quiz_categories WHERE enabled=1')->fetchAll(PDO::FETCH_COLUMN);
    $insert=$pdo->prepare('INSERT IGNORE INTO quiz_user_souvenirs(user_id,souvenir_key,definition_id,source_result_id,is_backfill) VALUES(?,?,?,?,?)');
    foreach(souvenir_definitions($pdo) as $definition){
        if($definition['state']!=='active'||!in_array($definition['category_id'],$enabled,true))continue;
        $p=$progress[$definition['category_id']]??['discoveries'=>0,'visited'=>false];
        if(!$p['visited'] || ($definition['rule_type']==='discover' && $p['discoveries']<(int)$definition['target']))continue;
        $insert->execute([$userId,$definition['souvenir_key'],$definition['id'],$resultId,(int)($resultId===null)]);
    }
}

function souvenir_awards(PDO $pdo,int $userId,?int $resultId=null): array
{
    $sql='SELECT d.*,a.awarded_at,a.source_result_id,a.is_backfill FROM quiz_user_souvenirs a JOIN quiz_souvenir_definitions d ON d.id=a.definition_id WHERE a.user_id=?';
    $args=[$userId];
    if($resultId!==null){$sql.=' AND a.source_result_id=?';$args[]=$resultId;}
    $stmt=$pdo->prepare($sql.' ORDER BY a.awarded_at DESC,d.id');$stmt->execute($args);
    return array_map('format_souvenir',$stmt->fetchAll());
}

function format_souvenir(array $d): array
{
    return ['key'=>$d['souvenir_key'],'title'=>$d['title'],'description'=>$d['description'],'image'=>$d['image_url'],'categoryId'=>$d['category_id'],'rule'=>$d['rule_type'],'target'=>(int)$d['target'],'revision'=>(int)$d['revision'],'awardedAt'=>isset($d['awarded_at'])?date(DATE_ATOM,strtotime($d['awarded_at'])):null,'backfilled'=>(bool)($d['is_backfill']??false)];
}

function souvenir_collection(PDO $pdo,int $userId,?array $catalog=null): array
{
    $awards=souvenir_awards($pdo,$userId);$earned=array_column($awards,null,'key');$progress=souvenir_progress($pdo,$userId);$goals=[];
    $catalog??=load_quiz_data(true,true);
    $available=array_column(array_filter($catalog['categories'],static fn($category)=>(bool)$category['enabled']),null,'id');
    foreach(souvenir_definitions($pdo) as $d){
        if($d['state']!=='active'||isset($earned[$d['souvenir_key']])||empty($available[$d['category_id']]['questions']))continue;
        $p=$progress[$d['category_id']]??['discoveries'=>0,'visited'=>false];
        $goals[]=format_souvenir($d)+['current'=>$d['rule_type']==='first_visit'?($p['visited']?1:0):min((int)$d['target'],$p['discoveries']),'needsVisit'=>!$p['visited']];
    }
    return ['earned'=>$awards,'goals'=>$goals];
}

/** Explicit POST, not a side-effect of reading the passport. Conservative legacy reconciliation. */
function account_souvenir_sync(): void
{
    require_method('POST');$user=require_account();$pdo=db();$pdo->beginTransaction();
    $lock=$pdo->prepare('SELECT id FROM quiz_users WHERE id=? AND deleted_at IS NULL FOR UPDATE');$lock->execute([$user['id']]);
    if(!$lock->fetchColumn()){ $pdo->rollBack();reject_user_session(); }
    require_account();
    award_souvenirs($pdo,(int)$user['id'],null);award_avatar_rewards($pdo,(int)$user['id'],null);$collection=souvenir_collection($pdo,(int)$user['id']);$pdo->commit();
    json_response(['ok'=>true,'souvenirs'=>$collection]);
}
