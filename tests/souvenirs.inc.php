<?php
// Included only by integration.php in its guarded disposable database.
require_once __DIR__.'/../src/backend/admin/souvenirs.php';
$oldSite=getenv('SITE_URL');$oldReset=getenv('QUIZ_HERO_ENABLE_TEST_RESET');
putenv('QUIZ_HERO_ENABLE_TEST_RESET=true');putenv('SITE_URL=https://quiz-hero.de');
check(!test_reset_allowed(['email'=>'audit@example.test']),'test reset stays blocked on production even with an accidentally enabled flag');
putenv('SITE_URL=http://localhost:8081');putenv('QUIZ_HERO_ENABLE_TEST_RESET=false');
check(!test_reset_allowed(['email'=>'audit@example.test']),'test reset requires an explicit local enable flag');
putenv('QUIZ_HERO_ENABLE_TEST_RESET=true');
check(!test_reset_allowed(['email'=>'real@example.com']),'local test reset excludes ordinary email accounts');
putenv($oldSite===false?'SITE_URL':'SITE_URL='.$oldSite);putenv($oldReset===false?'QUIZ_HERO_ENABLE_TEST_RESET':'QUIZ_HERO_ENABLE_TEST_RESET='.$oldReset);
$admin=request('admin-login',['username'=>$env['QUIZ_HERO_ADMIN_USER'],'password'=>$password]);$csrf=$admin['csrfToken'];
$pdo->exec("INSERT INTO quiz_categories(id,title,enabled) VALUES('rom','Rom',1)");
$romIds=[];$insert=$pdo->prepare('INSERT INTO quiz_questions(category_id,question,answers_json,correct_index,tags_json) VALUES(?,?,?,?,?)');
for($i=0;$i<21;$i++){$insert->execute(['rom','Souvenir question '.$i,'["A","B","C","D"]',0,'["Antike"]']);$romIds[]=(int)$pdo->lastInsertId();}
$su='souvenir'.$suffix;
$pdo->prepare('INSERT INTO quiz_users(username,email,password_hash,avatar_key,email_verified_at) VALUES(?,?,?,?,NOW())')->execute([$su,$su.'@example.test',password_hash($password,PASSWORD_DEFAULT),'hero']);$souvenirUser=(int)$pdo->lastInsertId();
request('account-login',['identifier'=>$su,'password'=>$password]);
$souvenirCookies=$cookies;$souvenirCsrf=$userCsrf;
request('account-souvenir-sync',[],403,'',false);
$empty=request('account-souvenir-sync',[])['souvenirs'];
check(count($empty['earned'])===0&&count($empty['goals'])===2,'empty collection exposes two Rom goals without invented awards');
function souvenir_round(array $ids,array $outcomes,string $selection='categoryId'): array {
    $round=request('start-round',[$selection=>$selection==='categoryId'?'rom':'Antike','questionIds'=>$ids]);
    $answers=[];foreach($ids as $i=>$id)$answers[]=['questionId'=>$id,'selectedAnswers'=>$outcomes[$i]];
    return ['round'=>$round,'payload'=>['roundId'=>$round['roundId'],'answers'=>$answers]];
}
$skipped=souvenir_round([$romIds[0]],[[]]);request('save-result',$skipped['payload']);
check(count(request('account-journey',[])['souvenirs']['earned'])===0,'all-skipped completed city round earns no stamp');
$wrong=souvenir_round([$romIds[1]],[[1,2]],'tagId');request('save-result',$wrong['payload']);
check(max(array_column(request('account-journey',[])['souvenirs']['goals'],'current'))===0,'incorrect answers do not advance explorer progress');
$attempts=array_fill(0,20,[0]);$attempts[1]=[1,0];$attempts[19]=[];
$topic=souvenir_round(array_slice($romIds,0,20),$attempts,'tagId');
$pdo->prepare("UPDATE quiz_questions SET category_id='audit' WHERE id=?")->execute([$romIds[0]]);
request('save-result',$topic['payload']);
$collection=request('account-journey',[])['souvenirs'];
check(count($collection['earned'])===0&&max(array_column($collection['goals'],'current'))===19,'first and second try correct topic answers count once; skipped questions excluded; topic alone gives no stamp');
check($pdo->query('SELECT category_id_at_play FROM quiz_question_results WHERE result_id=(SELECT result_id FROM quiz_rounds WHERE id='.$pdo->quote($topic['round']['roundId']).') AND question_id='.$romIds[0])->fetchColumn()==='rom','question category is frozen before a catalog move during a topic round');
$visit=souvenir_round([$romIds[1]],[[1,2]]);$visitResult=request('save-result',$visit['payload']);
check(count($visitResult['souvenirs'])===1&&$visitResult['souvenirs'][0]['rule']==='first_visit','first category visit awards stamp even after incorrect answers');
$final=souvenir_round([$romIds[20]],[[0]]);$finalResult=request('save-result',$final['payload']);
check(count($finalResult['souvenirs'])===1&&$finalResult['souvenirs'][0]['rule']==='discover','twentieth unique correctly answered question awards the explorer souvenir');
$retry=request('save-result',$final['payload']);
check($retry['souvenirs']===$finalResult['souvenirs']&&(int)$pdo->query('SELECT COUNT(*) FROM quiz_user_souvenirs WHERE user_id='.$souvenirUser)->fetchColumn()===2,'lost save response retry returns same awards without duplicate grants');
$another=souvenir_round([$romIds[1]],[[0]]);request('save-result',$another['payload']);
check((int)$pdo->query('SELECT COUNT(DISTINCT question_id) FROM quiz_question_results WHERE user_id='.$souvenirUser." AND outcome IN ('first_try','second_try')")->fetchColumn()===20,'repeated question contributes no new discovery');
$originalAwards=request('account-journey',[])['souvenirs']['earned'];
$definition=array_values(array_filter(request('admin-souvenirs')['definitions'],fn($d)=>$d['souvenir_key']==='rom-discoverer'))[0];
$edit=['key'=>$definition['souvenir_key'],'contentVersion'=>$definition['contentVersion'],'categoryId'=>'rom','title'=>'Future explorer','rule'=>'discover','target'=>20,'description'=>'Future version','image'=>'images/souvenirs/rom-token-v1.png','state'=>'draft'];
request('admin-souvenir-save',$edit,403,'',false);request('admin-souvenir-save',$edit);
check((int)$pdo->query("SELECT COUNT(*) FROM quiz_souvenir_definitions WHERE state='active' AND category_id='rom'")->fetchColumn()===2&&request('account-journey',[])['souvenirs']['earned']===$originalAwards,'draft edits keep live rules and existing earned titles/images immutable');
request('admin-souvenir-save',$edit,409);
$latest=array_values(array_filter(request('admin-souvenirs')['definitions'],fn($d)=>$d['souvenir_key']==='rom-discoverer'))[0];
$edit['contentVersion']=$latest['contentVersion'];$edit['state']='active';$edit['target']=999;request('admin-souvenir-save',$edit,422);
check(true,'admin definitions enforce CSRF, optimistic version and reachable goals');
$pdo->exec("UPDATE quiz_categories SET enabled=0 WHERE id='rom'");
$archived=request('account-journey',[])['souvenirs'];check(count($archived['earned'])===2&&count($archived['goals'])===0,'archived category retains earned collectibles without new playable goals');
$pdo->exec("UPDATE quiz_categories SET enabled=1 WHERE id='rom'");
$legacyName='souvenirlegacy'.$suffix;
$pdo->prepare('INSERT INTO quiz_users(username,email,password_hash,avatar_key,email_verified_at) VALUES(?,?,?,?,NOW())')->execute([$legacyName,$legacyName.'@example.test',password_hash($password,PASSWORD_DEFAULT),'hero']);$legacyUser=(int)$pdo->lastInsertId();
$pdo->prepare('INSERT INTO quiz_results(user_id,category_id,score,max_score,solved,total_questions) VALUES(?,?,?,?,?,?)')->execute([$legacyUser,'rom',2,10,1,5]);
request('account-login',['identifier'=>$legacyName,'password'=>$password]);$backfill=request('account-souvenir-sync',[])['souvenirs'];
check(count($backfill['earned'])===1&&$backfill['earned'][0]['backfilled']&&$backfill['goals'][0]['current']===0,'legacy solved city round grants only provable visit, not invented distinct discoveries');
request('account-souvenir-sync',[]);check((int)$pdo->query('SELECT COUNT(*) FROM quiz_user_souvenirs WHERE user_id='.$legacyUser)->fetchColumn()===1,'legacy reconciliation is idempotent and isolated per user');
$cookies=$souvenirCookies;$userCsrf=$souvenirCsrf;
$pending=souvenir_round([$romIds[1]],[[0]]);
request('admin-user-reset',['id'=>$souvenirUser,'confirmation'=>'wrong'],422);
request('admin-user-reset',['id'=>$souvenirUser,'confirmation'=>'RESET '.$su]);
request('save-result',$pending['payload'],401);
check((int)$pdo->query('SELECT COUNT(*) FROM quiz_results WHERE user_id='.$souvenirUser)->fetchColumn()===0&&(int)$pdo->query('SELECT COUNT(*) FROM quiz_user_souvenirs WHERE user_id='.$souvenirUser)->fetchColumn()===0,'local test reset erases progress and revokes sessions; pending rounds cannot restore it');
request('account-login',['identifier'=>$su,'password'=>$password]);
check(count(request('account-souvenir-sync',[])['souvenirs']['earned'])===0,'reset keeps credentials usable and backfill does not recreate removed progress');
request('account-delete',['confirm'=>'DELETE','currentPassword'=>$password]);
check((int)$pdo->query('SELECT COUNT(*) FROM quiz_user_souvenirs WHERE user_id='.$souvenirUser)->fetchColumn()===0,'account deletion clears personal souvenir grants');

// Additional city thresholds and category isolation, using synthetic history only in the audit DB.
require_once __DIR__.'/../src/backend/accounts/souvenirs.php';
$pdo->exec("INSERT INTO quiz_categories(id,title,enabled) VALUES('neapel','Neapel',1),('florenz','Florenz',1),('amalfi','Amalfi Coast',1)");
foreach(['neapel'=>5,'florenz'=>20,'amalfi'=>20] as $city=>$target){
    $definition=$pdo->query("SELECT * FROM quiz_souvenir_definitions WHERE souvenir_key='".$city."-discoverer' AND state='active'")->fetch();
    check((int)$definition['target']===$target,'reachable seeded discovery threshold for '.$city);
    $pdo->prepare('INSERT INTO quiz_results(user_id,category_id,score,max_score,solved,total_questions) VALUES(?,?,?,?,?,?)')->execute([$legacyUser,$city,0,$target,0,$target]);
    $cityResult=(int)$pdo->lastInsertId();
    $history=$pdo->prepare("INSERT INTO quiz_question_results(result_id,question_id,user_id,question_version,position,selected_answers,outcome,score,max_score,category_id_at_play) VALUES(?,?,?,?,?,'[0]','first_try',1,1,?)");
    for($i=1;$i<$target;$i++)$history->execute([$cityResult,900000+$i,$legacyUser,str_repeat('a',64),$i,$city]);
    $pdo->beginTransaction();$pdo->query('SELECT id FROM quiz_users WHERE id='.$legacyUser.' FOR UPDATE');award_souvenirs($pdo,$legacyUser,$cityResult);$pdo->commit();
    $cityAwards=array_filter(souvenir_awards($pdo,$legacyUser),fn($a)=>$a['categoryId']===$city);
    check(count($cityAwards)===1&&reset($cityAwards)['rule']==='first_visit','city stamp granted before discovery threshold: '.$city);
    $history->execute([$cityResult,900000+$target,$legacyUser,str_repeat('a',64),$target,$city]);
    $pdo->beginTransaction();$pdo->query('SELECT id FROM quiz_users WHERE id='.$legacyUser.' FOR UPDATE');award_souvenirs($pdo,$legacyUser,$cityResult);award_souvenirs($pdo,$legacyUser,$cityResult);$pdo->commit();
    check(count(array_filter(souvenir_awards($pdo,$legacyUser),fn($a)=>$a['categoryId']===$city))===2,'city discovery threshold grants token exactly once: '.$city);
}

// Replaying the city seed must not overwrite later editorial changes or awards.
$pdo->exec("UPDATE quiz_souvenir_definitions SET title='Edited Amalfi token' WHERE souvenir_key='amalfi-discoverer' AND revision=1");
execute_sql_file(__DIR__.'/../database/migrations/019_souvenirs_amalfi.sql');
check($pdo->query("SELECT title FROM quiz_souvenir_definitions WHERE souvenir_key='amalfi-discoverer' AND revision=1")->fetchColumn()==='Edited Amalfi token','Amalfi seed replay preserves admin edits');
check((int)$pdo->query("SELECT COUNT(*) FROM quiz_souvenir_definitions WHERE category_id='amalfi'")->fetchColumn()===2&&count(array_filter(souvenir_awards($pdo,$legacyUser),fn($a)=>$a['categoryId']==='amalfi'))===2,'Amalfi seed replay duplicates neither definitions nor awards');
