<?php
declare(strict_types=1);

function hero_ability_assignment(PDO $pdo,string $hero): array {
    $stmt=$pdo->prepare('SELECT ability_id FROM quiz_hero_abilities WHERE avatar_key=? ORDER BY ability_id');$stmt->execute([$hero]);return ['heroKey'=>$hero,'abilityIds'=>$stmt->fetchAll(PDO::FETCH_COLUMN)];
}
function admin_abilities(): void {
    require_method('GET');require_admin();$pdo=db();$rows=ability_catalog($pdo);foreach($rows as &$row)$row['contentVersion']=content_version($row);unset($row);
    $heroes=$pdo->query('SELECT avatar_key,label,image_url,enabled FROM quiz_avatars WHERE deleted_at IS NULL ORDER BY sort_order,avatar_key')->fetchAll();
    foreach($heroes as &$hero){$assignment=hero_ability_assignment($pdo,$hero['avatar_key']);$hero['abilityIds']=$assignment['abilityIds'];$hero['contentVersion']=content_version($assignment);}unset($hero);
    json_response(['ok'=>true,'abilities'=>$rows,'heroes'=>$heroes]);
}
function admin_ability_save(): void {
    require_method('POST');require_admin_csrf();$data=read_json_body();
    $title=clean_string($data['title']??'',120);$description=clean_string($data['description']??'',500);$target=$data['roundsRequired']??null;$enabled=$data['enabled']??null;
    if(!$title||!$description||!is_int($target)||$target<0||$target>100||!is_bool($enabled))json_response(['ok'=>false,'error'=>'Name, Beschreibung, Aktivierung und 0–100 Runden prüfen.'],422);
    $pdo=db();$pdo->beginTransaction();$id=clean_string($data['id']??'',80);
    if(!$id)json_response(['ok'=>false,'error'=>'Bitte eine vorhandene Fähigkeit auswählen. Neue Fähigkeiten werden in der Entwicklung ergänzt.'],422);
    $stmt=$pdo->prepare('SELECT * FROM quiz_abilities WHERE id=? FOR UPDATE');$stmt->execute([$id]);$row=$stmt->fetch();if(!$row)json_response(['ok'=>false,'error'=>'Fähigkeit nicht gefunden.'],404);assert_content_version($row,$data);
    $image=$row['image_url'];
    if(array_key_exists('image',$data)) {
        if(!is_string($data['image']))json_response(['ok'=>false,'error'=>'Ungültiges Fähigkeitsmotiv.'],422);
        $image=normalize_local_image_path($data['image']);
        if($data['image']!==''&&$image==='')json_response(['ok'=>false,'error'=>'Bitte ein lokales Fähigkeitsmotiv wählen.'],422);
        if($image!=='') {
            $root=realpath(QUIZ_HERO_PUBLIC_ROOT.'/images');$file=realpath(QUIZ_HERO_PUBLIC_ROOT.'/'.$image);
            if(!$root||!$file||!str_starts_with($file,$root.DIRECTORY_SEPARATOR)||!is_file($file)||!in_array(detect_mime_type($file),['image/png','image/jpeg','image/webp'],true)||!@getimagesize($file))json_response(['ok'=>false,'error'=>'Bitte ein vorhandenes JPG-, PNG- oder WebP-Motiv auswählen.'],422);
        }
    }
        if((isset($data['scope'])&&$row['scope']!==$data['scope'])||(isset($data['effect'])&&$row['effect']!==$data['effect']))json_response(['ok'=>false,'error'=>'Effekt und Geltung sind fest implementiert und können hier nicht geändert werden.'],422);
        $pdo->prepare('UPDATE quiz_abilities SET title=?,description=?,rounds_required=?,enabled=?,image_url=?,revision=revision+1 WHERE id=?')->execute([$title,$description,$target,(int)$enabled,$image?:null,$id]);
    $pdo->commit();json_response(['ok'=>true,'id'=>$id]);
}
function admin_hero_abilities_save(): void {
    require_method('POST');require_admin_csrf();$data=read_json_body();$hero=$data['heroKey']??'';$ids=$data['abilityIds']??null;
    if(!is_string($hero)||!is_array($ids)||!array_is_list($ids)||count($ids)>3||count(array_filter($ids,'is_string'))!==count($ids)||count(array_unique($ids))!==count($ids))json_response(['ok'=>false,'error'=>'Maximal drei unterschiedliche Heldenfähigkeiten auswählen.'],422);
    $pdo=db();$pdo->beginTransaction();$stmt=$pdo->prepare('SELECT avatar_key FROM quiz_avatars WHERE avatar_key=? AND deleted_at IS NULL FOR UPDATE');$stmt->execute([$hero]);if(!$stmt->fetchColumn())json_response(['ok'=>false,'error'=>'Held nicht gefunden.'],404);
    save_hero_ability_assignment($pdo,$hero,$ids,$data);
    $pdo->commit();json_response(['ok'=>true]);
}

function save_hero_ability_assignment(PDO $pdo,string $hero,mixed $ids,array $data): void {
    if(!is_array($ids)||!array_is_list($ids)||count($ids)>3||count(array_filter($ids,'is_string'))!==count($ids)||count(array_unique($ids))!==count($ids))json_response(['ok'=>false,'error'=>'Maximal drei unterschiedliche Heldenfähigkeiten auswählen.'],422);
    assert_content_version(hero_ability_assignment($pdo,$hero),$data);
    $allowed=array_column(array_filter(ability_catalog($pdo),static fn($a)=>$a['scope']==='hero'), 'id');
    $globals=(int)$pdo->query("SELECT COUNT(*) FROM quiz_abilities WHERE scope='global' AND enabled=1")->fetchColumn();
    if(count($ids)+$globals>3)json_response(['ok'=>false,'error'=>'Globale Fähigkeiten zählen zu den maximal drei Fähigkeiten je Held. Bitte weniger zuweisen.'],422);
    foreach($ids as $id)if(!in_array($id,$allowed,true))json_response(['ok'=>false,'error'=>'Nur heldengebundene Fähigkeiten zuordnen.'],422);
    $pdo->prepare('DELETE FROM quiz_hero_abilities WHERE avatar_key=?')->execute([$hero]);$stmt=$pdo->prepare('INSERT INTO quiz_hero_abilities(avatar_key,ability_id) VALUES(?,?)');foreach($ids as $id)$stmt->execute([$hero,$id]);
}
