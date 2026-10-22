<?php
// Runs only in the guarded disposable audit database.
function avatar_definition(string $key): array {
    return array_values(array_filter(request('admin-avatars')['avatars'],fn($a)=>$a['avatar_key']===$key))[0];
}
function edit_avatar(array $row,array $changes=[]): array {
    return request('admin-avatar-save',array_replace(['key'=>$row['avatar_key'],'label'=>$row['label'],'image'=>$row['image_url'],'contentVersion'=>$row['contentVersion']],$changes));
}
$freeKey=$created['key'];
request('account-update',['username'=>$other,'avatarKey'=>$freeKey]);
$disabled=edit_avatar(avatar_definition($freeKey),['enabled'=>false]);
$me=request('account-me',[])['user'];
check($disabled['resetUsers']===1&&$me['avatarKey']==='hero'&&$pdo->query('SELECT avatar_key FROM quiz_users WHERE id='.$owner)->fetchColumn()==='hero','deactivation atomically replaces selected profile with the standard hero');
check(!in_array($freeKey,array_column(request('avatars'),'key'),true)&&!in_array($freeKey,array_column($me['availableAvatars'],'key'),true),'disabled profiles are absent from public and private choices');
check(!in_array($freeKey,array_column(request('account-journey',[])['availableAvatars'],'key'),true),'disabled free profile is absent from the collection');
request('account-update',['username'=>$other,'avatarKey'=>$freeKey],422);
edit_avatar(avatar_definition($freeKey),['enabled'=>true]);
check(in_array($freeKey,array_column(request('avatars'),'key'),true)&&request('account-me',[])['user']['avatarKey']==='hero','reactivation offers the profile without silently restoring an old selection');
check(in_array($freeKey,array_column(request('account-journey',[])['availableAvatars'],'key'),true),'active free profiles automatically appear in the collection');
$reward=request('admin-avatar-save',['label'=>'Hidden reward','image'=>$uploaded['path'],'kind'=>'reward','rewardRule'=>'manual','enabled'=>true]);$rewardKey=$reward['key'];
$me=request('account-me',[])['user'];
check(!in_array($rewardKey,array_column(request('avatars'),'key'),true)&&!in_array($rewardKey,array_column($me['availableAvatars'],'key'),true),'unearned reward profiles are hidden from public and account choices');
check(!in_array($rewardKey,array_column(request('account-journey',[])['availableAvatars'],'key'),true),'unearned reward stays hidden from the collection');
request('account-update',['username'=>$other,'avatarKey'=>$rewardKey],422);
$pdo->prepare('INSERT INTO quiz_user_avatar_unlocks(user_id,avatar_key,rule_key,is_backfill) VALUES(?,?,?,1)')->execute([$owner,$rewardKey,'manual']);
check(in_array($rewardKey,array_column(request('account-me',[])['user']['availableAvatars'],'key'),true),'earned reward appears in the owner choice only');
request('account-update',['username'=>$other,'avatarKey'=>$rewardKey]);
edit_avatar(avatar_definition($rewardKey),['enabled'=>false]);
check(in_array($rewardKey,request('account-me',[])['user']['unlockedAvatarKeys'],true)&&!in_array($rewardKey,array_column(request('account-journey',[])['avatarRewards'],'avatarKey'),true),'deactivation retains reward rights but hides the reward from collection');
edit_avatar(avatar_definition($rewardKey),['enabled'=>true]);
request('account-update',['username'=>$other,'avatarKey'=>$rewardKey]);
$delete=avatar_definition($rewardKey);$deletePayload=['key'=>$rewardKey,'contentVersion'=>$delete['contentVersion'],'confirmation'=>$rewardKey];
request('admin-avatar-delete',$deletePayload,403,'',false);
request('admin-avatar-delete',array_replace($deletePayload,['confirmation'=>'wrong']),422);
$removed=request('admin-avatar-delete',$deletePayload);
check($removed['resetUsers']===1&&request('account-me',[])['user']['avatarKey']==='hero'&&!in_array($rewardKey,request('account-me',[])['user']['unlockedAvatarKeys'],true),'deleting an earned selected reward resets the account and removes its entitlement');
check(!in_array($rewardKey,array_column(request('admin-avatars')['avatars'],'avatar_key'),true),'deleted profile disappears from admin inventory');
request('admin-avatar-delete',$deletePayload,404);request('account-update',['username'=>$other,'avatarKey'=>$rewardKey],422);
$standard=avatar_definition('hero');
request('admin-avatar-delete',['key'=>'hero','contentVersion'=>$standard['contentVersion'],'confirmation'=>'hero'],422);
request('admin-avatar-save',['key'=>'hero','label'=>$standard['label'],'image'=>$standard['image_url'],'enabled'=>false,'contentVersion'=>$standard['contentVersion']],422);
request('admin-avatar-save',['key'=>'hero','label'=>$standard['label'],'image'=>$standard['image_url'],'kind'=>'reward','rewardRule'=>'manual','contentVersion'=>$standard['contentVersion']],422);
request('admin-avatar-delete',['key'=>'HERO','contentVersion'=>$standard['contentVersion'],'confirmation'=>'HERO'],422);
request('admin-avatar-save',['key'=>'HERO','label'=>$standard['label'],'image'=>$standard['image_url'],'enabled'=>false,'contentVersion'=>$standard['contentVersion']],422);
check(in_array('hero',array_column(request('avatars'),'key'),true),'standard hero cannot be disabled, deleted or converted into a reward');
request('account-update',['username'=>$other,'avatarKey'=>$freeKey]);
$converted=edit_avatar(avatar_definition($freeKey),['kind'=>'reward','rewardRule'=>'manual']);
check($converted['resetUsers']===1&&request('account-me',[])['user']['avatarKey']==='hero'&&!in_array($freeKey,array_column(request('avatars'),'key'),true),'free-to-reward conversion removes unearned selections and public availability');
edit_avatar(avatar_definition($freeKey),['kind'=>'free']);
request('account-update',['username'=>$other,'avatarKey'=>$freeKey]);
$freeDelete=avatar_definition($freeKey);request('admin-avatar-delete',['key'=>$freeKey,'contentVersion'=>$freeDelete['contentVersion'],'confirmation'=>$freeKey]);
check(request('account-me',[])['user']['avatarKey']==='hero','deleting a selected free profile also resets its owner');
$seeded=avatar_definition('akuma');request('admin-avatar-delete',['key'=>'akuma','contentVersion'=>$seeded['contentVersion'],'confirmation'=>'akuma']);
execute_sql_file(__DIR__.'/../database/migrations/017_avatar_catalog.sql');
check(!in_array('akuma',array_column(request('avatars'),'key'),true)&&!in_array('akuma',array_column(request('admin-avatars')['avatars'],'avatar_key'),true),'old seed replay cannot resurrect a deleted seeded profile');
