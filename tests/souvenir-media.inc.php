<?php
// Media partitioning is tested in the disposable audit database only.
$entries=array_column(request('admin-media-list')['media'],null,'path');
$motif='images/souvenirs/florenz-stamp-v1.png';
check(isset($entries[$motif])&&$entries[$motif]['mediaKind']==='souvenirs'&&$entries[$motif]['souvenirUsed'],'existing souvenir definitions classify their motifs into the souvenir media tab');
check($entries[$oldMediaPath]['mediaKind']==='images','normal question images remain in the general media tab');
replace_media(['path'=>$motif,'version'=>$entries[$motif]['version']],$png,422);
check(true,'used souvenir motifs cannot be silently replaced outside versioned souvenir editing');
$motifUpload=replace_media(['context'=>'souvenir'],$png,200,true,'admin-image-upload');$mediaTestFiles[]=QUIZ_HERO_PUBLIC_ROOT.'/'.$motifUpload['path'];
$newEntry=array_column(request('admin-media-list')['media'],null,'path')[$motifUpload['path']];
check(str_starts_with($motifUpload['path'],'images/uploads/souvenirs/')&&$newEntry['mediaKind']==='souvenirs'&&!$newEntry['souvenirUsed'],'new unassigned souvenir uploads are already classified as souvenir images');
$swapped=replace_media(['path'=>$newEntry['path'],'version'=>$newEntry['version']],$png);$mediaTestFiles[]=QUIZ_HERO_PUBLIC_ROOT.'/'.$swapped['path'];
check(str_starts_with($swapped['path'],'images/uploads/souvenirs/'),'replacing an unused souvenir image preserves its media category');
