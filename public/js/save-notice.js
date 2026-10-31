let notice, timer;

export function viewportStatusRoot() {
    let root=document.querySelector('.viewport-status');
    if(!root){root=document.createElement('div');root.className='viewport-status';document.body.append(root);}
    return root;
}

export function showSaveNotice(message='Daten gespeichert.') {
    if(!notice?.isConnected){
        notice=document.createElement('div');notice.className='save-notice';notice.hidden=true;
        notice.setAttribute('role','status');notice.setAttribute('aria-live','polite');notice.setAttribute('aria-atomic','true');
        viewportStatusRoot().append(notice);
    }
    clearTimeout(timer);notice.textContent=message;notice.hidden=false;
    timer=setTimeout(()=>{notice.hidden=true;},4000);
}
