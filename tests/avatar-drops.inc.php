<?php
// Included only in the empty, guarded integration database. Never use random odds in assertions.
require_once __DIR__.'/../src/backend/accounts/avatar-drops.php';
require_once __DIR__.'/../src/backend/accounts/avatar-rewards.php';
foreach (['0,05'=>5,'0.5'=>50,'1'=>100,'50,00'=>5000,'100'=>10000] as $input=>$expected) {
    check(avatar_drop_chance_bp($input)===$expected,'drop chance stores exact hundredths: '.$input);
}
foreach (['0','0,001','100,01','-1','1e2','NaN',true,[],null] as $invalid) {
    check(avatar_drop_chance_bp($invalid)===null,'invalid drop probability rejected: '.json_encode($invalid));
}
$draws=0;
check(avatar_drop_position([1,2,3],5,static function()use(&$draws){$draws++;return $draws===2?5:6;})===2 && $draws===2,'each correct answer has its own draw and stops after winning; 0.05 percent exact boundary');
check(avatar_drop_position([1],5000,static fn()=>5001)===null && avatar_drop_position([1],5000,static fn()=>5000)===1,'50 percent boundary is exact');
check(avatar_drop_position([],10000,static function(){throw new RuntimeException('No draw expected');})===null,'no correct answers means no random draw');

$dropName='find'.$suffix;
$pdo->prepare('INSERT INTO quiz_users(username,email,password_hash,avatar_key,email_verified_at) VALUES(?,?,?,?,NOW())')->execute([$dropName,$dropName.'@example.test',password_hash($password,PASSWORD_DEFAULT),'hero']);
$dropUser=(int)$pdo->lastInsertId();request('account-login',['identifier'=>$dropName,'password'=>$password]);
$pdo->exec("INSERT INTO quiz_categories(id,title,enabled) VALUES('find-audit','Find audit',1)");
$pdo->exec("INSERT INTO quiz_questions(category_id,question,answers_json,correct_index,tags_json) VALUES('find-audit','Random find test','[\"A\",\"B\",\"C\",\"D\"]',0,'[]')");
$dropQuestion=(int)$pdo->lastInsertId();
$dropRound=static function(array $attempts)use($dropQuestion){$r=request('start-round',['categoryId'=>'find-audit','questionIds'=>[$dropQuestion]]);return ['roundId'=>$r['roundId'],'answers'=>[['questionId'=>$dropQuestion,'selectedAnswers'=>$attempts]]];};
$avatarRow=static fn(string $key)=>array_values(array_filter(request('admin-avatars')['avatars'],static fn($a)=>$a['avatar_key']===$key))[0];
$dropPayload=static function(string $key,string $chance='100')use($avatarRow){$a=$avatarRow($key);return ['key'=>$key,'label'=>$a['label'],'image'=>$a['image_url'],'kind'=>'drop','dropChance'=>$chance,'enabled'=>true,'contentVersion'=>$a['contentVersion']];};
request('admin-avatar-save',$dropPayload('winterseherin','0,05'));
check((int)$avatarRow('winterseherin')['drop_chance_bp']===5,'admin accepts German decimal probability without rounding');
foreach(['0.001','100.01','0'] as $invalid) request('admin-avatar-save',$dropPayload('winterseherin',$invalid),422);
request('admin-avatar-save',$dropPayload('hero'),422);
request('admin-avatar-save',$dropPayload('winterseherin'),403,'',false);
check(true,'drop editor rejects invalid odds, standard hero and missing CSRF');
request('account-update',['username'=>$dropName,'avatarKey'=>'winterseherin'],422);
check(!in_array('winterseherin',array_column(request('avatars'),'key'),true),'unowned random hero is not freely selectable');

request('admin-avatar-save',$dropPayload('winterseherin'));
foreach([[],[1,2]] as $attempts){$r=$dropRound($attempts);check(request('save-result',$r)['avatarRewards']===[],'skips and wrong answers never award a guaranteed random find');}
$frozen=$dropRound([0]);
request('admin-avatar-save',$dropPayload('winterseherin','0,01'));
$found=request('save-result',$frozen);$reward=array_values(array_filter($found['avatarRewards'],static fn($a)=>$a['avatarKey']==='winterseherin'))[0];
check($reward['rule']==='random_drop'&&$reward['reason']==='Zufallsfund · 100 % Chance je richtiger Antwort.','win uses frozen odds and describes the original chance');
check(request('save-result',$frozen)['avatarRewards']===$found['avatarRewards'],'retry returns the same fund without drawing again');
check(request('save-result',$dropRound([0]))['avatarRewards']===[],'an already owned random hero cannot drop again');
request('account-update',['username'=>$dropName,'avatarKey'=>'winterseherin']);
request('account-souvenir-sync',[]);
check(in_array('winterseherin',request('account-me',[])['user']['unlockedAvatarKeys'],true),'found hero is owned, selectable and retained during collection sync');
$pdo->prepare('DELETE FROM quiz_user_avatar_unlocks WHERE user_id=? AND avatar_key=?')->execute([$dropUser,'winterseherin']);
request('account-souvenir-sync',[]);
check(!in_array('winterseherin',request('account-me',[])['user']['unlockedAvatarKeys'],true),'historical correct answers and collection sync never generate random finds');

request('admin-avatar-save',$dropPayload('winterseherin'));
$second=$dropRound([1,0]);$won=request('save-result',$second);
check(in_array('winterseherin',array_column($won['avatarRewards'],'avatarKey'),true),'correct second attempt is eligible');
$pdo->prepare('DELETE FROM quiz_user_avatar_unlocks WHERE user_id=? AND avatar_key=?')->execute([$dropUser,'winterseherin']);
$legacyDrop=$dropRound([0]);$pdo->prepare('UPDATE quiz_rounds SET avatar_drops_json=NULL WHERE id=?')->execute([$legacyDrop['roundId']]);
check(request('save-result',$legacyDrop)['avatarRewards']===[],'legacy rounds without a drop snapshot cannot roll');
$disabled=$dropRound([0]);$p=$dropPayload('winterseherin');$p['enabled']=false;request('admin-avatar-save',$p);
check(request('save-result',$disabled)['avatarRewards']===[],'a deactivated hero cannot be newly found even in a started round');
request('admin-avatar-save',$dropPayload('winterseherin'));
request('admin-avatar-save',$dropPayload('sternenfunke'));
$multiple=request('save-result',$dropRound([0]));
check(count(array_filter($multiple['avatarRewards'],static fn($a)=>$a['rule']==='random_drop'))===2,'several different heroes may be found independently on one correct answer');
$reason=avatar_reward_reason(['rule_key'=>'random_drop','rule_snapshot'=>json_encode(['chanceBp'=>5])]);
check($reason==='Zufallsfund · 0,05 % Chance je richtiger Antwort.','tiny historical chance uses German decimal formatting');
$again=$dropPayload('winterseherin');$again['kind']='reward';$again['rewardRule']='configured';request('admin-avatar-save',$again);
check($avatarRow('winterseherin')['unlock_rule']==='configured' && in_array('winterseherin',request('account-me',[])['user']['unlockedAvatarKeys'],true),'switching availability retains an earned find');
execute_sql_file(__DIR__.'/../database/migrations/028_avatar_random_finds.sql');
check((int)$avatarRow('winterseherin')['drop_chance_bp']===10000,'migration replay preserves edited probability and availability');
