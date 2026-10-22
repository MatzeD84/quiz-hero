<?php
declare(strict_types=1);

function admin_souvenirs(): void
{
    require_method('GET');require_admin();
    $definitions=db()->query('SELECT d.* FROM quiz_souvenir_definitions d JOIN (SELECT souvenir_key,MAX(revision) AS rev FROM quiz_souvenir_definitions GROUP BY souvenir_key) v ON v.souvenir_key=d.souvenir_key AND v.rev=d.revision ORDER BY d.id')->fetchAll();
    $counts=db()->query("SELECT category_id,COUNT(*) AS total FROM quiz_questions WHERE active=1 GROUP BY category_id")->fetchAll(PDO::FETCH_KEY_PAIR);
    foreach($definitions as &$d){$d['contentVersion']=content_version($d);$d['availableQuestions']=(int)($counts[$d['category_id']]??0);}
    json_response(['ok'=>true,'definitions'=>$definitions]);
}

function admin_souvenir_save(): void
{
    require_method('POST');require_admin_csrf();$data=read_json_body();
    $title=clean_string($data['title']??'',120);$category=clean_string($data['categoryId']??'',120);
    if($category==='test')json_response(['ok'=>false,'error'=>'Die interne Testkategorie erhält keine Souvenirs.'],422);
    $rule=$data['rule']??'';$state=$data['state']??'draft';$target=ensure_int($data['target']??1,1,100000);
    $image=clean_url($data['image']??'',500);
    if($title===''||!in_array($rule,['first_visit','discover'],true)||!in_array($state,['draft','active','archived'],true))json_response(['ok'=>false,'error'=>'Name, Regel und Status prüfen.'],422);
    $imagePath=normalize_local_image_path($image);
    $root=realpath(QUIZ_HERO_PUBLIC_ROOT.'/images');$file=$imagePath!==''?realpath(QUIZ_HERO_PUBLIC_ROOT.'/'.$imagePath):false;
    if($imagePath===''||$root===false||$file===false||!str_starts_with($file,$root.DIRECTORY_SEPARATOR)||!in_array(detect_mime_type($file),['image/png','image/jpeg','image/webp'],true))json_response(['ok'=>false,'error'=>'Bitte ein vorhandenes lokales Motiv auswählen oder hochladen.'],422);
    $pdo=db();$pdo->beginTransaction();
    $categoryStmt=$pdo->prepare('SELECT id,enabled FROM quiz_categories WHERE id=? FOR UPDATE');$categoryStmt->execute([$category]);$categoryRow=$categoryStmt->fetch();
    if(!$categoryRow)json_response(['ok'=>false,'error'=>'Kategorie fehlt.'],422);
    $count=$pdo->prepare('SELECT COUNT(*) FROM quiz_questions WHERE category_id=? AND active=1');$count->execute([$category]);
    $availableQuestions=(int)$count->fetchColumn();
    if($state==='active'&&(!$categoryRow['enabled']||$availableQuestions===0||($rule==='discover'&&$target>$availableQuestions)))json_response(['ok'=>false,'error'=>'Das Ziel ist mit dem verfügbaren Fragenbestand nicht erreichbar.'],422);
    $key=clean_string($data['key']??'',120);$row=null;
    if($key!==''){
        $q=$pdo->prepare('SELECT * FROM quiz_souvenir_definitions WHERE souvenir_key=? ORDER BY revision DESC LIMIT 1 FOR UPDATE');$q->execute([$key]);$row=$q->fetch();
        if(!$row)json_response(['ok'=>false,'error'=>'Definition nicht gefunden.'],404);
        assert_content_version($row,$data);
        // Stable identity cannot silently change meaning across categories or reward kinds.
        if($row['category_id']!==$category||$row['rule_type']!==$rule)json_response(['ok'=>false,'error'=>'Kategorie und Regel bleiben für bestehende Belohnungen unverändert. Bitte neu anlegen.'],422);
    }else $key=mb_substr(slugify($title),0,90).'-'.bin2hex(random_bytes(4));
    if($state!=='draft')$pdo->prepare("UPDATE quiz_souvenir_definitions SET state='archived' WHERE souvenir_key=? AND state='active'")->execute([$key]);
    $stmt=$pdo->prepare('INSERT INTO quiz_souvenir_definitions(souvenir_key,revision,category_id,title,description,image_url,rule_type,target,state) VALUES(?,?,?,?,?,?,?,?,?)');
    $stmt->execute([$key,$row?(int)$row['revision']+1:1,$category,$title,clean_string($data['description']??'',1000),$imagePath,$rule,$rule==='first_visit'?1:$target,$state]);
    $pdo->commit();json_response(['ok'=>true,'key'=>$key]);
}

function test_reset_allowed(array $user): bool
{
    $host=strtolower((string)parse_url((string)env_value('SITE_URL',''),PHP_URL_HOST));
    return env_value('QUIZ_HERO_ENABLE_TEST_RESET','false')==='true' && in_array($host,['localhost','127.0.0.1'],true)
        && str_ends_with(strtolower((string)($user['email']??'')),'@example.test');
}

function admin_user_reset(): void
{
    require_method('POST');require_admin_csrf();$data=read_json_body();$id=ensure_int($data['id']??0,1,PHP_INT_MAX);
    $pdo=db();$pdo->beginTransaction();$q=$pdo->prepare('SELECT * FROM quiz_users WHERE id=? AND deleted_at IS NULL FOR UPDATE');$q->execute([$id]);$user=$q->fetch();
    if(!$user||!test_reset_allowed($user))json_response(['ok'=>false,'error'=>'Reset ist nur für lokale Testaccounts aktiviert.'],403);
    if(($data['confirmation']??'')!=='RESET '.$user['username'])json_response(['ok'=>false,'error'=>'Bitte den Reset mit dem angezeigten Text bestätigen.'],422);
    revoke_user_sessions($id);
    $selected=$user['avatar_key']??'hero';
    if(!empty(hero_avatars()[$selected]['unlockRule'])) $pdo->prepare('UPDATE quiz_users SET avatar_key=?,profile_image_url=? WHERE id=?')->execute(['hero',avatar_url('hero'),$id]);
    foreach(['quiz_user_avatar_unlocks','quiz_user_souvenirs','quiz_rounds','quiz_question_results','quiz_results'] as $table)$pdo->prepare("DELETE FROM {$table} WHERE user_id=?")->execute([$id]);
    $pdo->commit();
    error_log(json_encode(['event'=>'local-test-progress-reset','userId'=>$id,'admin'=>$_SESSION['quiz_hero_admin']['username']??'','at'=>gmdate(DATE_ATOM)]));
    json_response(['ok'=>true]);
}
