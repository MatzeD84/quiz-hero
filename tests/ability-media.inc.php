<?php
// Ability artwork uses the existing versioned media lifecycle, in the disposable DB only.
$entries=array_column(request('admin-media-list')['media'],null,'path');
foreach(['heldenblick','schutzschild','neues-abenteuer'] as $key) {
    $path='images/abilities/'.$key.'-v1.png';
    check(isset($entries[$path])&&$entries[$path]['mediaKind']==='abilities'&&$entries[$path]['abilityUsed'],'ability artwork is classified separately: '.$key);
}
$artUpload=replace_media(['context'=>'ability'],$png,200,true,'admin-image-upload');$mediaTestFiles[]=QUIZ_HERO_PUBLIC_ROOT.'/'.$artUpload['path'];
$entry=array_column(request('admin-media-list')['media'],null,'path')[$artUpload['path']];
check(str_starts_with($entry['path'],'images/uploads/abilities/')&&$entry['mediaKind']==='abilities'&&!$entry['abilityUsed'],'unassigned ability uploads belong to their own tab');
$artReplaced=replace_media(['path'=>$entry['path'],'version'=>$entry['version']],$png);$mediaTestFiles[]=QUIZ_HERO_PUBLIC_ROOT.'/'.$artReplaced['path'];
check(str_starts_with($artReplaced['path'],'images/uploads/abilities/'),'unused ability image replacement retains its media group');
$abilityEdit=function(array $extra=[]) {
    $a=array_column(request('admin-abilities')['abilities'],null,'id')['heldenblick'];
    return array_merge(['id'=>$a['id'],'contentVersion'=>$a['contentVersion'],'title'=>$a['title'],'description'=>$a['description'],'roundsRequired'=>(int)$a['rounds_required'],'enabled'=>(bool)$a['enabled']],$extra);
};
foreach(['https://example.test/a.png','images/../../outside.png','images/abilities/missing.png'] as $bad)request('admin-ability-save',$abilityEdit(['image'=>$bad]),422);
request('admin-ability-save',$abilityEdit(['image'=>$artReplaced['path']]));
$staleImageEdit=$abilityEdit(['image'=>'images/abilities/heldenblick-v1.png']);
$items=array_column(request('account-abilities',[])['items'],null,'id');
check($items['heldenblick']['image']===$artReplaced['path'],'account inventory exposes the edited ability artwork');
request('admin-ability-save',$abilityEdit());
request('admin-ability-save',$staleImageEdit,409);
check(array_column(request('admin-abilities')['abilities'],null,'id')['heldenblick']['image_url']===$artReplaced['path'],'legacy edit payload preserves artwork');
$entry=array_column(request('admin-media-list')['media'],null,'path')[$artReplaced['path']];
replace_media(['path'=>$entry['path'],'version'=>$entry['version']],$png,422);
check($entry['abilityUsed'],'used ability artwork is protected from unversioned replacement');
$artRound=request('start-round',$roundPayload);
check(array_column($artRound['abilities'],null,'id')['heldenblick']['image']===$artReplaced['path'],'round freezes its ability artwork');
execute_sql_file(__DIR__.'/../database/migrations/024_ability_images.sql');
check(array_column(request('admin-abilities')['abilities'],null,'id')['heldenblick']['image_url']===$artReplaced['path'],'migration replay preserves administrator artwork');
request('admin-ability-save',$abilityEdit(['image'=>'']));
check(array_column(request('admin-abilities')['abilities'],null,'id')['heldenblick']['image_url']===null,'artwork can deliberately be removed without removing the ability');
$entry=array_column(request('admin-media-list')['media'],null,'path')[$artReplaced['path']];
check(!$entry['abilityUsed']&&$entry['historical']&&!$entry['deletable'],'old ability artwork remains protected by round snapshots');
