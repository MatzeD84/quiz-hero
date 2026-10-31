<?php
declare(strict_types=1);

function ability_catalog(PDO $pdo): array {
    return $pdo->query('SELECT * FROM quiz_abilities ORDER BY title,id')->fetchAll();
}
function ability_inventory(PDO $pdo,int $userId,string $hero): array {
    $stmt=$pdo->prepare('SELECT ability_id FROM quiz_hero_abilities WHERE avatar_key=?');$stmt->execute([$hero]);$bindings=$stmt->fetchAll();$assigned=array_column($bindings,'ability_id');
    $stmt=$pdo->prepare('SELECT ability_id,hero_key FROM quiz_user_abilities WHERE user_id=?');$stmt->execute([$userId]);$owned=$stmt->fetchAll();
    $stmt=$pdo->prepare('SELECT hero_key,COUNT(*) AS n FROM quiz_hero_round_history WHERE user_id=? AND answered_count>=5 GROUP BY hero_key');$stmt->execute([$userId]);$progress=array_column($stmt->fetchAll(),'n','hero_key');
    $items=[];
    foreach(ability_catalog($pdo) as $a) {
        if(!(bool)$a['enabled']||($a['scope']!=='global'&&!in_array($a['id'],$assigned,true)))continue;
        $key=$a['scope']==='global'?'':$hero;$isDefault=(int)$a['rounds_required']===0;$unlocked=$isDefault;
        foreach($owned as $entry)if($entry['ability_id']===$a['id']&&$entry['hero_key']===$key)$unlocked=true;
        $current=$a['scope']==='global'?array_sum($progress):(int)($progress[$hero]??0);
        $items[]=['id'=>$a['id'],'revision'=>(int)$a['revision'],'title'=>$a['title'],'image'=>$a['image_url']?:null,'description'=>$a['description'],'effect'=>$a['effect'],'scope'=>$a['scope'],'unlocked'=>$unlocked,'isDefault'=>$isDefault,'current'=>min($current,(int)$a['rounds_required']),'target'=>(int)$a['rounds_required']];
    }
    // Globals count toward the same cap. Code-provided globals take priority.
    usort($items,static fn($a,$b)=>($a['scope']==='global'?0:1)<=>($b['scope']==='global'?0:1));
    return ['heroKey'=>$hero,'items'=>array_slice($items,0,3)];
}
function account_abilities(): void {
    require_method('POST');$user=require_account();json_response(['ok'=>true]+ability_inventory(db(),(int)$user['id'],normalize_avatar_key($user['avatar_key'])));
}
function hero_preview(bool $personal=false): void {
    require_method($personal?'POST':'GET');
    $user=$personal?require_account():null;
    $data=$personal?read_json_body():$_GET;
    $key=$data['heroKey']??'';
    if(!is_string($key)||$key==='')json_response(['ok'=>false,'error'=>'Bitte einen Helden auswählen.'],422);
    $userId=(int)($user['id']??0);
    $avatars=array_column(selectable_avatars($userId),null,'key');
    if(!isset($avatars[$key]))json_response(['ok'=>false,'error'=>'Dieser Held steht nicht zur Auswahl.'],404);
    $inventory=ability_inventory(db(),$userId,$key);
    $inventory['items']=array_values(array_filter($inventory['items'],static fn($ability)=>$ability['unlocked']));
    json_response(['ok'=>true,'hero'=>$avatars[$key]]+$inventory);
}
/** Called inside the same transaction as result storage, holding the user row lock. */
function award_abilities(PDO $pdo,int $userId,string $hero,int $resultId,int $answered,array $context=[]): array {
    $pdo->prepare('INSERT INTO quiz_hero_round_history(result_id,user_id,hero_key,answered_count,ability_json,action_json) VALUES(?,?,?,?,?,?)')->execute([$resultId,$userId,$hero,$answered,json_encode($context['snapshot']['abilities']??[],JSON_THROW_ON_ERROR),json_encode($context['actions']??[],JSON_THROW_ON_ERROR)]);
    $awards=[];
    foreach(ability_inventory($pdo,$userId,$hero)['items'] as $a) {
        if($a['unlocked']||$a['current']<$a['target'])continue;
        $pdo->prepare('INSERT IGNORE INTO quiz_user_abilities(user_id,ability_id,hero_key,source_result_id) VALUES(?,?,?,?)')->execute([$userId,$a['id'],$a['scope']==='global'?'':$hero,$resultId]);
        $awards[]=['id'=>$a['id'],'title'=>$a['title'],'image'=>$a['image']??null,'description'=>$a['description']];
    }
    return $awards;
}
function ability_awards(PDO $pdo,int $userId,int $resultId): array {
    $stmt=$pdo->prepare('SELECT a.id,a.title,a.image_url AS image,a.description FROM quiz_user_abilities u JOIN quiz_abilities a ON a.id=u.ability_id WHERE u.user_id=? AND u.source_result_id=?');$stmt->execute([$userId,$resultId]);return $stmt->fetchAll();
}
function freeze_round_abilities(PDO $pdo,int $userId,string $roundId,string $hero,array $pool,bool $practice,array $questions): array {
    $abilities=[];
    if(count($questions)>=5)foreach(ability_inventory($pdo,$userId,$hero)['items'] as $ability) {
        if(!$ability['unlocked']||($practice&&$ability['effect']==='swap'))continue;
        if($ability['effect']==='swap') {
            $used=array_column($questions,'id');$available=[];
            foreach($questions as $q)foreach($pool as $candidate)if($candidate['categoryId']===$q['categoryId']&&!in_array($candidate['id'],$used,true)){$available[]=$q['id'];break;}
            $ability['swapAvailableIds']=$available;
        }
        $abilities[]=$ability;
    }
    $hasSwap=(bool)array_filter($abilities,static fn($a)=>$a['effect']==='swap');
    $snapshot=['format'=>2,'heroKey'=>$hero,'abilities'=>$abilities,'initialQuestionIds'=>array_column($questions,'id'),'pool'=>$hasSwap?array_values($pool):[]];
    $pdo->prepare('INSERT INTO quiz_round_abilities(round_id,snapshot_json) VALUES(?,?)')->execute([$roundId,json_encode($snapshot,JSON_THROW_ON_ERROR)]);
    return $abilities;
}
/** Normalize older local rounds without changing their frozen rules or usage. */
function ability_actions(?string $json): array {
    if(!$json)return [];$decoded=json_decode($json,true,512,JSON_THROW_ON_ERROR);
    return array_is_list($decoded)?$decoded:[$decoded];
}
function snapshot_abilities(array $snapshot): array {
    return $snapshot['abilities']??(!empty($snapshot['ability'])?[$snapshot['ability']]:[]);
}
function ability_prefix_valid(array $questions,array $answers,int $position): bool {
    if(!array_is_list($answers)||count($answers)!==$position+1)return false;
    foreach($answers as $i=>$entry){
        $q=$questions[$i]??null;$attempts=$entry['selectedAnswers']??null;
        if(!$q||($entry['questionId']??null)!==$q['id']||!is_array($attempts)||!array_is_list($attempts)||count($attempts)>2||count(array_unique($attempts,SORT_REGULAR))!==count($attempts))return false;
        foreach($attempts as $j=>$answer)if(!is_int($answer)||$answer<0||$answer>=count($q['answers'])||($answer===$q['correct']&&$j!==count($attempts)-1))return false;
        if($i<$position&&count($attempts)===1&&$attempts[0]!==$q['correct'])return false;
    }
    return true;
}
function use_round_ability(): void {
    require_method('POST');$user=require_account();rate_limit('ability:'.$user['id'],60,300);$data=read_json_body();$pdo=db();$pdo->beginTransaction();
    if(!is_string($data['roundId']??null)||!preg_match('/^[a-f0-9]{64}$/D',$data['roundId']))json_response(['ok'=>false,'error'=>'Ungültige Runde.'],422);
    $stmt=$pdo->prepare('SELECT id FROM quiz_users WHERE id=? FOR UPDATE');$stmt->execute([$user['id']]);require_account();
    $stmt=$pdo->prepare('SELECT r.*,a.snapshot_json,a.action_json FROM quiz_rounds r JOIN quiz_round_abilities a ON a.round_id=r.id WHERE r.id=? AND r.user_id=? FOR UPDATE');$stmt->execute([$data['roundId']??'',$user['id']]);$round=$stmt->fetch();
    if(!$round||$round['completed_at']!==null||strtotime($round['created_at'])<time()-86400)json_response(['ok'=>false,'error'=>'Diese Runde ist nicht mehr verfügbar.'],409);
    $key=$data['actionId']??'';if(!is_string($key)||!preg_match('/^[a-f0-9]{32}$/D',$key))json_response(['ok'=>false,'error'=>'Ungültige Aktionskennung.'],422);
    $actions=ability_actions($round['action_json']);$abilityId=$data['abilityId']??null;
    foreach($actions as $action)if($action['key']===$key){
        if($abilityId!==null&&$abilityId!==$action['ability']['id'])json_response(['ok'=>false,'error'=>'Diese Aktionskennung gehört zu einer anderen Fähigkeit.'],409);
        $pdo->commit();json_response(['ok'=>true]+$action['response']);
    }
    $snapshot=json_decode($round['snapshot_json'],true);$abilities=snapshot_abilities($snapshot);$ability=null;
    if($abilityId===null&&!isset($snapshot['format'])&&count($abilities)===1)$abilityId=$abilities[0]['id'];
    foreach($abilities as $entry)if($entry['id']===$abilityId)$ability=$entry;
    foreach($actions as $action)if($action['ability']['id']===$abilityId)json_response(['ok'=>false,'error'=>'Diese Fähigkeit wurde in dieser Runde bereits eingesetzt.'],409);
    $position=$data['position']??null;$answers=$data['answers']??null;$questions=json_decode($round['questions_json'],true);
    if(!$ability||!is_int($position)||$position<0||!isset($questions[$position])||!is_array($answers)||!ability_prefix_valid($questions,$answers,$position)||!ability_submission_valid($actions,$answers))json_response(['ok'=>false,'error'=>'Fähigkeit oder Fragezustand ungültig.'],422);
    $question=$questions[$position];$attempts=$answers[$position]['selectedAnswers'];$effect=$ability['effect'];$response=['abilityId'=>$ability['id'],'effect'=>$effect];
    $atPosition=array_filter($actions,static fn($a)=>$a['position']===$position);
    $exclusive=['focus','lucky'];
    if(($atPosition&&in_array($effect,$exclusive,true))||array_filter($atPosition,static fn($a)=>in_array($a['ability']['effect'],['focus','lucky'],true)))json_response(['ok'=>false,'error'=>'Diese Hilfe lässt sich an derselben Frage nicht mit weiteren Fähigkeiten kombinieren.'],422);
    if($effect==='focus'){
        if($attempts||count($question['answers'])!==4)json_response(['ok'=>false,'error'=>'Scharfblick ist nur vor der ersten Antwort bei vier Möglichkeiten einsetzbar.'],422);
        $wrong=array_values(array_filter(array_keys($question['answers']),static fn($i)=>$i!==$question['correct']));
        shuffle($wrong);$response['removedAnswers']=array_slice($wrong,0,2);
    }elseif($effect==='swap'){
        if($attempts||$round['is_practice'])json_response(['ok'=>false,'error'=>'Nur unbeantwortete Fragen außerhalb einer Übungsrunde lassen sich tauschen.'],422);
        $ids=array_merge(array_column($questions,'id'),$snapshot['initialQuestionIds']??[]);
        foreach($actions as $used)if($used['ability']['effect']==='swap')$ids[]=$used['prefix'][$used['position']]['questionId'];
        $candidates=array_values(array_filter($snapshot['pool'],static fn($q)=>$q['categoryId']===$question['categoryId']&&!in_array($q['id'],$ids,true)));
        if(!$candidates)json_response(['ok'=>false,'error'=>'Keine passende Ersatzfrage verfügbar. Dein Einsatz bleibt erhalten.'],409);
        $same=array_values(array_filter($candidates,static fn($q)=>$q['difficulty']===$question['difficulty']));$pool=$same?:$candidates;
        $replacement=$pool[random_int(0,count($pool)-1)];$questions[$position]=$replacement;$response['question']=$replacement;
        $pdo->prepare('UPDATE quiz_rounds SET questions_json=? WHERE id=?')->execute([json_encode($questions,JSON_THROW_ON_ERROR),$round['id']]);
    }else{
        if(count($attempts)!==1||$attempts[0]===$question['correct'])json_response(['ok'=>false,'error'=>'Diese Fähigkeit ist nach dem ersten Fehlversuch einsetzbar.'],422);
        if($effect==='eliminate'){$removed=[];foreach($actions as $used)if($used['position']===$position&&isset($used['response']['removedAnswer']))$removed[]=$used['response']['removedAnswer'];$wrong=array_values(array_filter(array_keys($question['answers']),static fn($i)=>$i!==$question['correct']&&!in_array($i,$attempts,true)&&!in_array($i,$removed,true)));if(!$wrong)json_response(['ok'=>false,'error'=>'Keine weitere falsche Antwort verfügbar.'],422);$response['removedAnswer']=$wrong[random_int(0,count($wrong)-1)];}
        elseif(!in_array($effect,['shield','lucky'],true))throw new RuntimeException('Unknown ability effect');
    }
    $action=['key'=>$key,'position'=>$position,'prefix'=>$answers,'response'=>$response,'ability'=>$ability];
    $actions[]=$action;
    $pdo->prepare('UPDATE quiz_round_abilities SET action_json=? WHERE round_id=?')->execute([json_encode($actions,JSON_THROW_ON_ERROR),$round['id']]);$pdo->commit();json_response(['ok'=>true]+$response);
}
function round_ability_data(PDO $pdo,string $roundId): ?array {
    $stmt=$pdo->prepare('SELECT * FROM quiz_round_abilities WHERE round_id=?');$stmt->execute([$roundId]);$row=$stmt->fetch();if(!$row)return null;
    $snapshot=json_decode($row['snapshot_json'],true);$snapshot['abilities']=snapshot_abilities($snapshot);return ['snapshot'=>$snapshot,'actions'=>ability_actions($row['action_json'])];
}
function ability_submission_valid(array $actions,array $answers): bool {
    foreach($actions as $action){
    foreach($action['prefix'] as $i=>$entry){
        if($i===$action['position']&&$action['ability']['effect']==='swap')continue;
        if(($answers[$i]['questionId']??null)!==$entry['questionId'])return false;
        foreach($entry['selectedAnswers'] as $j=>$value)if(($answers[$i]['selectedAnswers'][$j]??null)!==$value)return false;
    }
    if(isset($action['response']['removedAnswer'])&&in_array($action['response']['removedAnswer'],$answers[$action['position']]['selectedAnswers']??[],true))return false;
    foreach($action['response']['removedAnswers']??[] as $removed)if(in_array($removed,$answers[$action['position']]['selectedAnswers']??[],true))return false;
    }
    return true;
}
