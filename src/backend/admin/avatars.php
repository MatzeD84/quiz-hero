<?php
declare(strict_types=1);

function admin_avatars(): void
{
    require_method('GET');require_admin();
    $rows=db()->query('SELECT * FROM quiz_avatars WHERE deleted_at IS NULL ORDER BY sort_order,avatar_key')->fetchAll();
    foreach($rows as &$row) $row['contentVersion']=content_version($row);
    json_response(['ok'=>true,'avatars'=>$rows]);
}

function admin_avatar_save(): void
{
    require_method('POST');require_admin_csrf();$data=read_json_body();
    $label=clean_string($data['label']??'',80);
    $path=normalize_local_image_path(clean_url($data['image']??'',500));
    if($label==='')json_response(['ok'=>false,'error'=>'Bitte einen Namen für das Profilbild eingeben.'],422);
    $root=realpath(QUIZ_HERO_PUBLIC_ROOT.'/images');$file=$path!==''?realpath(QUIZ_HERO_PUBLIC_ROOT.'/'.$path):false;
    $size=$file!==false?@getimagesize($file):false;
    if(!$root||!$file||!str_starts_with($file,$root.DIRECTORY_SEPARATOR)||!is_file($file)||!in_array(detect_mime_type($file),['image/png','image/jpeg','image/webp'],true)||!$size||$size[0]!==$size[1]) {
        json_response(['ok'=>false,'error'=>'Bitte ein quadratisches JPG-, PNG- oder WebP-Bild auswählen.'],422);
    }
    // Legacy rule fields are rejected; kind/rewardRule are the supported controls.
    if(array_key_exists('unlockRule',$data)||array_key_exists('unlock_rule',$data))json_response(['ok'=>false,'error'=>'Freischaltregeln können hier nicht geändert werden.'],422);
    $pdo=db();$pdo->beginTransaction();lock_avatar_catalog($pdo);$key=clean_string($data['key']??'',80);$row=null;
    if($key!=='') {
        $stmt=$pdo->prepare('SELECT * FROM quiz_avatars WHERE avatar_key=? FOR UPDATE');$stmt->execute([$key]);$row=$stmt->fetch();
        if(!$row||$row['deleted_at']!==null)json_response(['ok'=>false,'error'=>'Profilbild nicht gefunden.'],404);
        $key=$row['avatar_key'];
        assert_content_version($row,$data);
    }
    $kind=$data['kind']??(!empty($row['unlock_rule'])?'reward':'free');
    $rule=$kind==='reward'?($data['rewardRule']??($row['unlock_rule']??'manual')):null;
    $enabled=$data['enabled']??(bool)($row['enabled']??true);
    if(!in_array($kind,['free','reward'],true)||!is_bool($enabled)||($kind==='reward'&&!in_array($rule,['manual','hero_first_try'],true)))json_response(['ok'=>false,'error'=>'Art, Aktivierung und Freischaltung prüfen.'],422);
    if($key==='hero'&&(!$enabled||$kind!=='free'))json_response(['ok'=>false,'error'=>'Der Standardheld muss aktiv und frei verfügbar bleiben.'],422);
    $reset=0;
    if($row){
        $pdo->prepare('UPDATE quiz_avatars SET label=?,image_url=?,unlock_rule=?,enabled=?,revision=revision+1 WHERE avatar_key=?')->execute([$label,$path,$rule,(int)$enabled,$key]);
        if(!$enabled||$rule!==null)$reset=reset_avatar_users($pdo,$key,!$enabled);
        $pdo->prepare('UPDATE quiz_users SET profile_image_url=? WHERE avatar_key=? AND deleted_at IS NULL')->execute([$path,$key]);
    }else{
        $key=mb_substr(slugify($label),0,60).'-'.bin2hex(random_bytes(4));
        $pdo->prepare('INSERT INTO quiz_avatars(avatar_key,label,image_url,unlock_rule,enabled) VALUES(?,?,?,?,?)')->execute([$key,$label,$path,$rule,(int)$enabled]);
    }
    $pdo->commit();json_response(['ok'=>true,'key'=>$key,'resetUsers'=>$reset]);
}

function reset_avatar_users(PDO $pdo,string $key,bool $all): int
{
    $stmt=$pdo->prepare("UPDATE quiz_users u LEFT JOIN quiz_user_avatar_unlocks a ON a.user_id=u.id AND a.avatar_key=u.avatar_key SET u.avatar_key='hero',u.profile_image_url=? WHERE u.avatar_key=? AND u.deleted_at IS NULL".($all?'':' AND a.user_id IS NULL'));
    $stmt->execute([avatar_url('hero'),$key]);return $stmt->rowCount();
}

function admin_avatar_delete(): void
{
    require_method('POST');require_admin_csrf();$data=read_json_body();$key=clean_string($data['key']??'',80);
    if($key==='hero')json_response(['ok'=>false,'error'=>'Der Standardheld kann nicht gelöscht werden.'],422);
    $pdo=db();$pdo->beginTransaction();lock_avatar_catalog($pdo);
    $stmt=$pdo->prepare('SELECT * FROM quiz_avatars WHERE avatar_key=? FOR UPDATE');$stmt->execute([$key]);$row=$stmt->fetch();
    if(!$row||$row['deleted_at']!==null)json_response(['ok'=>false,'error'=>'Profilbild nicht gefunden.'],404);
    $key=$row['avatar_key'];
    if($key==='hero')json_response(['ok'=>false,'error'=>'Der Standardheld kann nicht gelöscht werden.'],422);
    assert_content_version($row,$data);
    if(($data['confirmation']??'')!==$key)json_response(['ok'=>false,'error'=>'Löschung bitte bestätigen.'],422);
    $reset=reset_avatar_users($pdo,$key,true);
    $pdo->prepare('DELETE FROM quiz_user_avatar_unlocks WHERE avatar_key=?')->execute([$key]);
    $pdo->prepare('UPDATE quiz_avatars SET enabled=0,deleted_at=NOW(),revision=revision+1 WHERE avatar_key=?')->execute([$key]);
    $pdo->commit();json_response(['ok'=>true,'resetUsers'=>$reset]);
}
