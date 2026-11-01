<?php
declare(strict_types=1);

function avatar_reward_rule_rows(PDO $pdo): array {
    return $pdo->query('SELECT r.*,a.label,a.image_url,a.unlock_rule,a.enabled,a.revision AS avatar_revision FROM quiz_avatar_reward_rules r JOIN quiz_avatars a ON a.avatar_key=r.avatar_key WHERE a.deleted_at IS NULL ORDER BY a.label,r.avatar_key')->fetchAll();
}
function admin_avatar_rewards(): void {
    require_method('GET');require_admin();$pdo=db();$rules=avatar_reward_rule_rows($pdo);
    foreach($rules as &$row)$row['contentVersion']=content_version($row);unset($row);
    $avatars=$pdo->query('SELECT avatar_key,label,image_url,enabled,unlock_rule,revision FROM quiz_avatars WHERE deleted_at IS NULL AND unlock_rule IS NOT NULL ORDER BY label,avatar_key')->fetchAll();
    json_response(['ok'=>true,'rules'=>$rules,'avatars'=>$avatars]);
}
function admin_avatar_reward_save(): void {
    require_method('POST');require_admin_csrf();$data=read_json_body();
    $key=$data['avatarKey']??null;$target=$data['target']??null;$difficulty=$data['difficulty']??null;$attempts=$data['attempts']??null;$help=$data['withoutHelp']??null;$period=$data['period']??null;$state=$data['state']??null;$category=$data['categoryId']??null;
    if(!is_string($key)||!is_int($target)||$target<1||$target>10000||!in_array($difficulty,['all','easy','medium','hero'],true)||!in_array($attempts,['first','any'],true)||!is_bool($help)||!in_array($period,['total','round'],true)||!in_array($state,['draft','active','archived'],true)||($category!==null&&!is_string($category)))json_response(['ok'=>false,'error'=>'Bitte alle Bedingungen prüfen (1–10.000 Fragen).'],422);
    $pdo=db();$pdo->beginTransaction();lock_avatar_catalog($pdo);
    $stmt=$pdo->prepare('SELECT * FROM quiz_avatars WHERE avatar_key=? FOR UPDATE');$stmt->execute([$key]);$avatar=$stmt->fetch();
    if(!$avatar||$avatar['deleted_at']!==null||$avatar['unlock_rule']===null||$avatar['unlock_rule']==='random_drop'||$avatar['avatar_key']==='hero')json_response(['ok'=>false,'error'=>'Bitte einen Belohnungshelden unter Helden auswählen. Freie Helden und Zufallsfunde werden hier nicht umgestellt.'],422);
    if($state==='active'&&!(bool)$avatar['enabled'])json_response(['ok'=>false,'error'=>'Diesen Helden zuerst unter Helden aktivieren oder die Regel als Entwurf speichern.'],422);
    $stmt=$pdo->prepare('SELECT * FROM quiz_avatar_reward_rules WHERE avatar_key=? FOR UPDATE');$stmt->execute([$key]);$old=$stmt->fetch();
    if($old) {
        $version=$old+['label'=>$avatar['label'],'image_url'=>$avatar['image_url'],'unlock_rule'=>$avatar['unlock_rule'],'enabled'=>$avatar['enabled'],'avatar_revision'=>$avatar['revision']];
        assert_content_version($version,$data);
    } else {
        if(!empty($data['contentVersion']))json_response(['ok'=>false,'error'=>'Die Regel wurde inzwischen geändert. Bitte neu laden.'],409);
        if(($data['avatarRevision']??null)!==(int)$avatar['revision'])json_response(['ok'=>false,'error'=>'Das Profilbild wurde inzwischen geändert. Bitte neu laden.'],409);
    }
    $category=$category===''?null:$category;
    if($category!==null){$stmt=$pdo->prepare('SELECT id FROM quiz_categories WHERE id=?');$stmt->execute([$category]);if(!$stmt->fetchColumn())json_response(['ok'=>false,'error'=>'Kategorie nicht gefunden.'],422);}
    $stmt=$pdo->prepare('INSERT INTO quiz_avatar_reward_rules(avatar_key,target,difficulty,attempts,without_help,category_id,period,state) VALUES(?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE target=VALUES(target),difficulty=VALUES(difficulty),attempts=VALUES(attempts),without_help=VALUES(without_help),category_id=VALUES(category_id),period=VALUES(period),state=VALUES(state),revision=revision+1');
    $stmt->execute([$avatar['avatar_key'],$target,$difficulty,$attempts,(int)$help,$category,$period,$state]);
    $pdo->prepare("UPDATE quiz_avatars SET unlock_rule='configured',revision=revision+1 WHERE avatar_key=?")->execute([$avatar['avatar_key']]);
    $pdo->commit();json_response(['ok'=>true,'avatarKey'=>$avatar['avatar_key']]);
}
