<?php
// Rules and histories here belong exclusively to the disposable audit database.
$builderName='builder'.$suffix;$builderPassword='Builder-test-password-2026!';
$pdo->prepare('INSERT INTO quiz_users(username,email,password_hash,avatar_key,email_verified_at) VALUES(?,?,?,?,NOW())')->execute([$builderName,$builderName.'@example.test',password_hash($builderPassword,PASSWORD_DEFAULT),'hero']);
$builderUser=(int)$pdo->lastInsertId();request('account-login',['identifier'=>$builderName,'password'=>$builderPassword]);
function builder_owned(PDO $pdo,int $user): array { $stmt=$pdo->prepare('SELECT avatar_key FROM quiz_user_avatar_unlocks WHERE user_id=?');$stmt->execute([$user]);return $stmt->fetchAll(PDO::FETCH_COLUMN); }
function builder_rule(string $key,array $changes=[]): array {
    $rows=array_column(request('admin-avatar-rewards')['rules'],null,'avatar_key');$avatar=avatar_definition($key);
    return array_replace(['avatarKey'=>$key,'avatarRevision'=>(int)$avatar['revision'],'contentVersion'=>$rows[$key]['contentVersion']??'','target'=>3,'difficulty'=>'hero','attempts'=>'any','withoutHelp'=>true,'categoryId'=>null,'period'=>'total','state'=>'active'],$changes);
}
function builder_hero(string $label): string {
    return request('admin-avatar-save',['label'=>$label,'image'=>'images/website/avatar/astra-v1.png','kind'=>'reward','rewardRule'=>'manual','enabled'=>true])['key'];
}
function builder_round(array $ids,array $outcomes): array {
    global $abilityCat;
    $round=request('start-round',['categoryId'=>$abilityCat,'questionIds'=>$ids]);
    return ['payload'=>['roundId'=>$round['roundId'],'answers'=>array_map(static fn($id,$answers)=>['questionId'=>$id,'selectedAnswers'=>$answers],$ids,$outcomes)]];
}
$totalHero=builder_hero('Total '.$suffix);$roundHero=builder_hero('Single round '.$suffix);$firstHero=builder_hero('First try '.$suffix);
$repeatHero=builder_hero('Distinct '.$suffix);request('admin-avatar-reward-save',builder_rule($repeatHero,['target'=>4]));
request('admin-avatar-reward-save',builder_rule($totalHero));
request('admin-avatar-reward-save',builder_rule($roundHero,['period'=>'round']));
request('admin-avatar-reward-save',builder_rule($firstHero,['attempts'=>'first']));
check(!in_array($totalHero,array_column(request('avatars'),'key'),true),'configured reward heroes remain hidden from registration');
$builderHeroQuestions=[];$builderEasyQuestions=[];
foreach(['hero','hero','hero','easy','easy','easy'] as $n=>$difficulty){$q=request('admin-question-save',['categoryId'=>$abilityCat,'question'=>'Builder '.$n.' '.$suffix,'answers'=>['A','B','C','D'],'correct'=>0,'difficulty'=>$difficulty,'active'=>true,'worldIds'=>[]])['id'];if($difficulty==='hero')$builderHeroQuestions[]=$q;else $builderEasyQuestions[]=$q;}
$r=builder_round([$builderHeroQuestions[0],$builderHeroQuestions[1],...$builderEasyQuestions],[[0],[1,0],[0],[0],[0]]);request('save-result',$r['payload']);
check(!in_array($totalHero,builder_owned($pdo,$builderUser),true),'partial lifetime progress does not unlock a hero early');
$r=builder_round([$builderHeroQuestions[1],$builderHeroQuestions[2],...$builderEasyQuestions],[[1,0],[1,0],[0],[0],[0]]);$saved=request('save-result',$r['payload']);
$owned=builder_owned($pdo,$builderUser);
check(in_array($totalHero,$owned,true)&&!in_array($roundHero,$owned,true),'lifetime counts three distinct questions across rounds but single-round progress cannot be added');
check(!in_array($firstHero,$owned,true),'first-try rule excludes second-try correct answers');
check(!in_array($repeatHero,$owned,true),'four correct appearances of only three distinct questions do not reach a four-question target');
check(count(array_filter($saved['avatarRewards'],static fn($a)=>$a['avatarKey']===$totalHero))===1,'new configured hero is included in quiz result reward metadata');
check(request('save-result',$r['payload'])['avatarRewards']===$saved['avatarRewards'],'result replay cannot duplicate configured hero rewards');
$r=builder_round([...$builderHeroQuestions,...array_slice($builderEasyQuestions,0,2)],array_fill(0,5,[0]));request('save-result',$r['payload']);
$owned=builder_owned($pdo,$builderUser);check(in_array($roundHero,$owned,true)&&in_array($firstHero,$owned,true),'three matching answers in one round unlock the round rule and first-try rule');
// Supported answers: isolate their category from earlier correct answers.
$helpCategory=request('admin-category-save',['title'=>'Builder help '.$suffix,'enabled'=>true,'worldIds'=>['italien']])['id'];$helpQuestions=[];
for($n=0;$n<5;$n++)$helpQuestions[]=request('admin-question-save',['categoryId'=>$helpCategory,'question'=>'Builder help '.$n.' '.$suffix,'answers'=>['A','B','C','D'],'correct'=>0,'difficulty'=>'medium','active'=>true,'worldIds'=>[]])['id'];
$helpAllowed=builder_hero('Help allowed '.$suffix);$helpExcluded=builder_hero('No help '.$suffix);
$categoryHero=builder_hero('Category '.$suffix);request('admin-avatar-reward-save',builder_rule($categoryHero,['target'=>1,'categoryId'=>$helpCategory]));
$helpRule=['target'=>1,'difficulty'=>'medium','categoryId'=>$helpCategory];
request('admin-avatar-reward-save',builder_rule($helpAllowed,$helpRule+['withoutHelp'=>false]));request('admin-avatar-reward-save',builder_rule($helpExcluded,$helpRule));
$pdo->prepare("INSERT IGNORE INTO quiz_user_abilities(user_id,ability_id,hero_key) VALUES(?,'schutzschild','hero')")->execute([$builderUser]);
$r=request('start-round',['categoryId'=>$helpCategory,'questionIds'=>$helpQuestions]);
request('use-round-ability',['roundId'=>$r['roundId'],'actionId'=>str_repeat('8',32),'abilityId'=>'schutzschild','position'=>0,'answers'=>[['questionId'=>$helpQuestions[0],'selectedAnswers'=>[1]]]]);
$pdo->prepare("UPDATE quiz_questions SET difficulty='hero',category_id=? WHERE id=?")->execute([$abilityCat,$helpQuestions[0]]);
$answers=array_map(static fn($id)=>['questionId'=>$id,'selectedAnswers'=>[]],$helpQuestions);$answers[0]['selectedAnswers']=[1,0];request('save-result',['roundId'=>$r['roundId'],'answers'=>$answers]);
$owned=builder_owned($pdo,$builderUser);check(in_array($helpAllowed,$owned,true)&&!in_array($helpExcluded,$owned,true),'difficulty and category use frozen answers; supported answers count only when help is allowed');
check(!in_array($categoryHero,$owned,true),'correct Hero questions from another category cannot satisfy a category-specific reward');
$backfillHero=builder_hero('Backfill '.$suffix);request('admin-avatar-reward-save',builder_rule($backfillHero,['target'=>2]));request('account-souvenir-sync',[]);
check(in_array($backfillHero,builder_owned($pdo,$builderUser),true),'active builder rules backfill provable saved answers through the existing collection sync');
$draftHero=builder_hero('Draft '.$suffix);$archiveHero=builder_hero('Archived '.$suffix);
request('admin-avatar-reward-save',builder_rule($draftHero,['target'=>1,'state'=>'draft']));request('admin-avatar-reward-save',builder_rule($archiveHero,['target'=>1,'state'=>'archived']));request('account-souvenir-sync',[]);
$owned=builder_owned($pdo,$builderUser);check(!in_array($draftHero,$owned,true)&&!in_array($archiveHero,$owned,true),'draft and archived definitions never award a hero');
$oldSnapshot=$pdo->query("SELECT rule_snapshot FROM quiz_user_avatar_unlocks WHERE user_id=$builderUser AND avatar_key=".$pdo->quote($totalHero))->fetchColumn();
$oldReasons=array_column(request('account-journey',[])['avatarRewards'],'reason','avatarKey');
check(str_contains($oldReasons[$totalHero],'3 unterschiedliche Hero-Fragen insgesamt')&&str_contains($oldReasons[$totalHero],'ohne Hilfe'),'award reason explains the historical cumulative criteria');
check(str_contains($oldReasons[$roundHero],'in einer Questrunde'),'award reason distinguishes a single round from cumulative progress');
$stale=builder_rule($totalHero,['target'=>100,'state'=>'archived']);request('admin-avatar-reward-save',$stale);request('admin-avatar-reward-save',$stale,409);request('account-souvenir-sync',[]);
check(in_array($totalHero,builder_owned($pdo,$builderUser),true)&&$oldSnapshot===$pdo->query("SELECT rule_snapshot FROM quiz_user_avatar_unlocks WHERE user_id=$builderUser AND avatar_key=".$pdo->quote($totalHero))->fetchColumn(),'editing or archiving preserves earned heroes and immutable award conditions');
check(array_column(request('account-journey',[])['avatarRewards'],'reason','avatarKey')[$totalHero]===$oldReasons[$totalHero],'changing the current rule does not rewrite the reason for an existing award');
request('admin-avatar-reward-save',builder_rule($draftHero),403,'',false);
foreach([['target'=>0],['target'=>1.5],['period'=>'month'],['withoutHelp'=>'true'],['categoryId'=>'missing-builder-category']] as $bad)request('admin-avatar-reward-save',builder_rule($draftHero,$bad),422);
request('admin-avatar-reward-save',builder_rule('hero'),422);
check(true,'builder rejects missing CSRF, invalid criteria, stale writes and conversion of the standard free hero');
edit_avatar(avatar_definition($draftHero),['enabled'=>false]);
request('admin-avatar-reward-save',builder_rule($draftHero),422);
check(true,'an inactive reward profile cannot be activated through the rule builder');
$before=request('admin-avatar-rewards')['rules'];execute_sql_file(__DIR__.'/../database/migrations/025_avatar_reward_rules.sql');
check($before===request('admin-avatar-rewards')['rules'],'migration replay preserves edited builder definitions');
$savedCookies=$cookies;$cookies=[];request('admin-avatar-rewards',null,401);$cookies=$savedCookies;
check(true,'reward definitions are admin-only');
$selected=request('account-update',['username'=>$builderName,'avatarKey'=>$totalHero])['user'];
check($selected['avatarKey']===$totalHero&&in_array($totalHero,array_column(request('account-journey',[])['avatarRewards'],'avatarKey'),true),'configured earned hero appears in the collection and can be selected in the account');
request('account-update',['username'=>$builderName,'avatarKey'=>'hero']);

function combined_hero(string $key): array {return array_values(array_filter(request('admin-abilities')['heroes'],fn($h)=>$h['avatar_key']===$key))[0];}
// The hero editor saves metadata and assignments as one transaction.
$combinedAvatar=avatar_definition($draftHero);
$combinedHero=array_values(array_filter(request('admin-abilities')['heroes'],fn($h)=>$h['avatar_key']===$draftHero))[0];
$combinedPayload=['key'=>$draftHero,'label'=>'Combined hero','image'=>$combinedAvatar['image_url'],'enabled'=>true,'kind'=>'reward','rewardRule'=>'configured','contentVersion'=>$combinedAvatar['contentVersion'],'assignmentVersion'=>$combinedHero['contentVersion'],'abilityIds'=>['heldenblick']];
request('admin-avatar-save',$combinedPayload);
check(avatar_definition($draftHero)['label']==='Combined hero'&&combined_hero($draftHero)['abilityIds']===['heldenblick'],'combined hero save updates metadata and ability assignment together');
$combinedPayload['contentVersion']=avatar_definition($draftHero)['contentVersion'];$combinedPayload['label']='Must not persist';
request('admin-avatar-save',$combinedPayload,409);
check(avatar_definition($draftHero)['label']==='Combined hero','stale assignment version rejects metadata changes as well');
$combinedPayload['assignmentVersion']=combined_hero($draftHero)['contentVersion'];$combinedPayload['abilityIds']=['not-implemented'];
request('admin-avatar-save',$combinedPayload,422);
check(avatar_definition($draftHero)['label']==='Combined hero'&&combined_hero($draftHero)['abilityIds']===['heldenblick'],'invalid combined assignment leaves metadata and abilities unchanged');
$combinedPayload['abilityIds']=[];request('admin-avatar-save',$combinedPayload,403,'',false);
check(combined_hero($draftHero)['abilityIds']===['heldenblick'],'combined hero save requires admin CSRF');
