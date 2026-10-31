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

/** Count immutable, successfully saved answers; never the mutable question catalog. */
function avatar_rule_progress(PDO $pdo,int $userId,array $rule): int
{
    $where=["q.user_id=?", $rule['attempts']==='first'?"q.outcome='first_try'":"q.outcome IN ('first_try','second_try')"];$params=[$userId];
    if($rule['difficulty']!=='all'){$where[]='q.difficulty=?';$params[]=$rule['difficulty'];}
    if((bool)$rule['without_help'])$where[]='q.assisted_ability IS NULL';
    if($rule['category_id']!==null){$where[]='q.category_id_at_play=?';$params[]=$rule['category_id'];}
    $base='SELECT COUNT(DISTINCT q.question_id) AS n FROM quiz_question_results q WHERE '.implode(' AND ',$where);
    $sql=$rule['period']==='round'?'SELECT COALESCE(MAX(n),0) FROM ('.$base.' GROUP BY q.result_id) counts':$base;
    $stmt=$pdo->prepare($sql);$stmt->execute($params);return (int)$stmt->fetchColumn();
}

/** Caller holds the user row lock. Existing unlocks never change when rules are edited. */
function award_avatar_rewards(PDO $pdo,int $userId,?int $resultId): void
{
    $rules=array_column($pdo->query('SELECT * FROM quiz_avatar_reward_rules')->fetchAll(),null,'avatar_key');
    $categoryTitles=array_column($pdo->query('SELECT id,title FROM quiz_categories')->fetchAll(),'title','id');
    $owned=unlocked_avatar_keys($pdo,$userId);$legacy=null;
    $insert=$pdo->prepare('INSERT IGNORE INTO quiz_user_avatar_unlocks(user_id,avatar_key,rule_key,source_result_id,is_backfill,rule_snapshot) VALUES(?,?,?,?,?,?)');
    foreach(hero_avatars() as $avatar){
        $key=$avatar['key'];$marker=$avatar['unlockRule']??'';
        if(in_array($key,$owned,true))continue;
        if($marker==='configured'){
            $rule=$rules[$key]??null;if(!$rule||$rule['state']!=='active'||avatar_rule_progress($pdo,$userId,$rule)<(int)$rule['target'])continue;
        }elseif($marker==='hero_first_try'){
            if($legacy===null){$stmt=$pdo->prepare("SELECT 1 FROM quiz_question_results WHERE user_id=? AND difficulty='hero' AND outcome='first_try' AND assisted_ability IS NULL".($resultId===null?'':' AND result_id=?').' LIMIT 1');$stmt->execute($resultId===null?[$userId]:[$userId,$resultId]);$legacy=(bool)$stmt->fetchColumn();}
            if(!$legacy)continue;
            $rule=['avatar_key'=>$key,'target'=>1,'difficulty'=>'hero','attempts'=>'first','without_help'=>1,'category_id'=>null,'period'=>'total','state'=>'active','revision'=>0];
        }else continue;
        if($rule['category_id']!==null)$rule['category_title']=$categoryTitles[$rule['category_id']]??$rule['category_id'];
        $insert->execute([$userId,$key,$marker,$resultId,(int)($resultId===null),json_encode($rule,JSON_THROW_ON_ERROR)]);
    }
}

function avatar_reward_reason(array $row,array $categoryTitles=[]): string
{
    $rule=json_decode($row['rule_snapshot']??'null',true);
    // Older fixed-rule awards are known; never infer old builder criteria from today's rule.
    if(!is_array($rule))return ($row['rule_key']??'')==='hero_first_try'?'Eine Hero-Frage im ersten Versuch ohne Hilfe richtig beantwortet.':'';
    $target=(int)($rule['target']??0);
    if($target<1||!in_array($rule['difficulty']??null,['all','easy','medium','hero'],true)||!in_array($rule['period']??null,['total','round'],true)||!in_array($rule['attempts']??null,['first','any'],true))return '';
    $types=['all'=>['Frage','Fragen'],'easy'=>['einfache Frage','einfache Fragen'],'medium'=>['schwere Frage','schwere Fragen'],'hero'=>['Hero-Frage','Hero-Fragen']];
    $text=$target.($target>1?' unterschiedliche':'').' '.$types[$rule['difficulty']][$target===1?0:1];
    if(!empty($rule['category_id']))$text.=' in „'.($rule['category_title']??$categoryTitles[$rule['category_id']]??$rule['category_id']).'“';
    $text.=$rule['period']==='round'?' in einer Questrunde':' insgesamt';
    if($rule['attempts']==='first')$text.=' im ersten Versuch';
    if(!empty($rule['without_help']))$text.=' ohne Hilfe';
    return $text.' richtig beantwortet.';
}

function avatar_rewards(PDO $pdo, int $userId, ?int $resultId=null): array
{
    $stmt=$pdo->prepare('SELECT * FROM quiz_user_avatar_unlocks WHERE user_id=?'.($resultId===null?'':' AND source_result_id=?').' ORDER BY awarded_at DESC,avatar_key');
    $stmt->execute($resultId===null?[$userId]:[$userId,$resultId]);
    $catalog=hero_avatars();$rewards=[];
    $categoryTitles=array_column($pdo->query('SELECT id,title FROM quiz_categories')->fetchAll(),'title','id');
    foreach($stmt as $row) {
        $avatar=$catalog[$row['avatar_key']]??null;
        if($avatar) $rewards[]=['avatarKey'=>$avatar['key'],'title'=>$avatar['label'],'image'=>$avatar['url'],'rule'=>$row['rule_key'],'reason'=>avatar_reward_reason($row,$categoryTitles),'awardedAt'=>date(DATE_ATOM,strtotime($row['awarded_at'])),'backfilled'=>(bool)$row['is_backfill']];
    }
    return $rewards;
}
