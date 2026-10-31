<?php
// All fixtures are confined to the guarded disposable audit database.
function set_default_test_target(string $id,int $target,bool $enabled=true): array {
    $a=array_column(request('admin-abilities')['abilities'],null,'id')[$id];
    $payload=['id'=>$id,'contentVersion'=>$a['contentVersion'],'title'=>$a['title'],'description'=>$a['description'],'roundsRequired'=>$target,'enabled'=>$enabled];
    request('admin-ability-save',$payload);return $payload;
}
$defaultHero=request('admin-avatar-save',['label'=>'Starter '.$suffix,'image'=>'images/website/avatar/quizo.png','kind'=>'free','enabled'=>true])['key'];
$h=array_column(request('admin-abilities')['heroes'],null,'avatar_key')[$defaultHero];
request('admin-hero-abilities-save',['heroKey'=>$defaultHero,'contentVersion'=>$h['contentVersion'],'abilityIds'=>['heldenblick','scharfblick']]);
set_default_test_target('heldenblick',0);set_default_test_target('scharfblick',3);
$publicDefault=request('hero-preview&heroKey='.$defaultHero);
check(array_column($publicDefault['items'],'id')===['heldenblick']&&$publicDefault['items'][0]['isDefault']&&$publicDefault['items'][0]['target']===0,'registration preview includes zero-round defaults and hides still-locked abilities');
$defaultName='starter'.$suffix;
$pdo->prepare('INSERT INTO quiz_users(username,email,password_hash,avatar_key,email_verified_at) VALUES(?,?,?,?,NOW())')->execute([$defaultName,$defaultName.'@example.test',password_hash($abilityPassword,PASSWORD_DEFAULT),$defaultHero]);
$defaultUser=(int)$pdo->lastInsertId();request('account-login',['identifier'=>$defaultName,'password'=>$abilityPassword]);
$inv=request('account-abilities',[]);$known=array_column($inv['items'],null,'id');
check($known['heldenblick']['unlocked']&&!$known['scharfblick']['unlocked']&&(int)$pdo->query('SELECT COUNT(*) FROM quiz_user_abilities WHERE user_id='.$defaultUser)->fetchColumn()===0,'a new account immediately has assigned default access without invented earned unlocks');
$r=request('start-round',$powerRound);
check(array_column($r['abilities'],'id')===['heldenblick'],'first quiz round freezes the default ability even with zero completed rounds');
set_default_test_target('heldenblick',0,false);
check(request('hero-preview&heroKey='.$defaultHero)['items']===[],'deactivated default is absent from registration and selection preview');
$use=['roundId'=>$r['roundId'],'abilityId'=>'heldenblick','actionId'=>bin2hex(random_bytes(16)),'position'=>0,'answers'=>[['questionId'=>$powerIds[0],'selectedAnswers'=>[1]]]];
request('use-round-ability',$use);$answers=$roundAnswers($r['questions']);$answers[0]['selectedAnswers']=[1,0];
$saved=request('save-result',['roundId'=>$r['roundId'],'answers'=>$answers]);
check(!in_array('heldenblick',array_column($saved['abilityAwards'],'id'),true),'frozen default stays usable after deactivation but is not announced as newly learned');
set_default_test_target('heldenblick',0);
request('account-update',['username'=>$defaultName,'avatarKey'=>'hero']);
// Remove its association on the other hero to demonstrate that zero does not bypass bindings.
$h=array_column(request('admin-abilities')['heroes'],null,'avatar_key')['hero'];
request('admin-hero-abilities-save',['heroKey'=>'hero','contentVersion'=>$h['contentVersion'],'abilityIds'=>['scharfblick','gluecksanker']]);
check(!in_array('heldenblick',array_column(request('account-abilities',[])['items'],'id'),true),'default availability remains bound to the assigned hero');
request('account-update',['username'=>$defaultName,'avatarKey'=>$defaultHero]);
check(array_column(request('account-hero-preview',['heroKey'=>$defaultHero])['items'],'id')===['heldenblick'],'switching back restores default access without learning again');
set_default_test_target('heldenblick',2);
check(request('account-hero-preview',['heroKey'=>$defaultHero])['items']===[],'raising zero to a positive threshold removes implicit default access without fabricating an earned right');
$pdo->prepare('INSERT INTO quiz_user_abilities(user_id,ability_id,hero_key) VALUES(?,?,?)')->execute([$defaultUser,'heldenblick',$defaultHero]);
check(array_column(request('account-hero-preview',['heroKey'=>$defaultHero])['items'],'id')===['heldenblick'],'actual earned entitlement survives later changes to the threshold');
$bad=array_column(request('admin-abilities')['abilities'],null,'id')['heldenblick'];
foreach([-1,101,0.5] as $target)request('admin-ability-save',['id'=>'heldenblick','contentVersion'=>$bad['contentVersion'],'title'=>$bad['title'],'description'=>$bad['description'],'roundsRequired'=>$target,'enabled'=>true],422);
check(true,'default configuration still rejects negative, fractional and excessive round counts');
