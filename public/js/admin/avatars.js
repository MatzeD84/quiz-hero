import { createFormGuard } from '../form-guard.js?v=dev';

export function createAvatarAdmin({api,uploadImage,setupDropzone,loadMedia}) {
    const app=document.querySelector('#js-admin-app'),media=document.querySelector('#js-admin-media-panel');
    const tabs=document.createElement('nav');tabs.className='tabs admin-tabs u-hidden';tabs.setAttribute('aria-label','Mediathek-Bereiche');
    tabs.innerHTML='<button type="button" class="tab tab--active" data-media-tab="images" aria-pressed="true">Bilder</button><button type="button" class="tab" data-media-tab="avatars" aria-pressed="false">Profilbilder</button>';
    app.insertBefore(tabs,media);
    const souvenirTab=document.createElement('button');souvenirTab.type='button';souvenirTab.className='tab';souvenirTab.dataset.mediaTab='souvenirs';souvenirTab.setAttribute('aria-pressed','false');souvenirTab.textContent='Souvenir-Bilder';tabs.append(souvenirTab);
    const abilityTab=document.createElement('button');abilityTab.type='button';abilityTab.className='tab';abilityTab.dataset.mediaTab='abilities';abilityTab.setAttribute('aria-pressed','false');abilityTab.textContent='Heldenfähigkeiten';tabs.append(abilityTab);
    const panel=document.createElement('section');panel.className='admin-category-editor avatar-admin u-hidden';
    panel.innerHTML='<h2>Profilbilder</h2><p>Hier verwaltest du die Bilddateien. Name, Verfügbarkeit und Aktivstatus pflegst du unter Helden. Änderungen gelten überall, wo das Profilbild verwendet wird.</p><div class="avatar-admin__toolbar"><label>Suche<input type="search" placeholder="Heldenname suchen"></label><button class="btn" type="button">Profilbild hinzufügen</button></div><p class="avatar-admin__count" role="status"></p><div class="avatar-admin__grid"></div><section class="avatar-admin__editor" hidden><h3>Profilbild bearbeiten</h3><form class="admin-form"><input name="label" type="hidden"><p class="admin-form__hint"></p><img class="admin-dropzone__thumb" alt="Profilbildvorschau" hidden><div id="js-avatar-dropzone" class="admin-dropzone" role="button" tabindex="0"><strong>Profilbild hier ablegen oder auswählen</strong><span>Quadratisches JPG, PNG oder WebP bis 6 MB</span><input id="js-avatar-file" type="file" name="file" accept="image/jpeg,image/png,image/webp" aria-label="Profilbild hochladen"></div><input name="image" type="hidden"><button class="btn btn--modal" type="submit">Profilbild speichern</button></form><p class="avatar-admin__status" role="status"></p></section>';
    app.append(panel);
    const editor=panel.querySelector('.avatar-admin__editor'),form=panel.querySelector('form'),status=panel.querySelector('.avatar-admin__status'),count=panel.querySelector('.avatar-admin__count');
    const grid=panel.querySelector('.avatar-admin__grid'),search=panel.querySelector('input[type=search]'),preview=panel.querySelector('img');
    grid.classList.add('admin-media-grid');
    const field=name=>form.elements.namedItem(name);let rows=[],current=null,busy=false,subTab='images';
    const deleteButton=document.createElement('button');deleteButton.type='button';deleteButton.className='account-action-link avatar-admin__delete';deleteButton.textContent='Profilbild löschen';editor.append(deleteButton);
    const updatePreview=()=>{preview.hidden=!field('image').value;if(field('image').value)preview.src='../'+field('image').value;else preview.removeAttribute('src');};
    const guard=createFormGuard([form],status,updatePreview);
    function render(){
        const term=search.value.trim().toLocaleLowerCase('de');const visible=rows.filter(r=>r.label.toLocaleLowerCase('de').includes(term));
        count.textContent=`${visible.length} von ${rows.length} Profilbildern`;grid.replaceChildren();
        for(const row of visible){
            const button=document.createElement('button');button.type='button';button.className='avatar-admin__card admin-media-card';button.classList.toggle('admin-media-card--active',row.avatar_key===current?.avatar_key);button.setAttribute('aria-pressed',String(row.avatar_key===current?.avatar_key));button.setAttribute('aria-label',`${row.label} bearbeiten`);
            const image=document.createElement('img');image.src='../'+row.image_url;image.alt='';image.width=112;image.height=112;image.loading='lazy';
            const name=document.createElement('strong');name.className='admin-media-card__name';name.textContent=row.label;name.title=row.label;
            const type=document.createElement('span');type.className='admin-media-card__meta';type.textContent=`${Number(row.enabled)?'Aktiv':'Deaktiviert'} · ${row.unlock_rule?'Belohnung':'Frei verfügbar'}`;
            button.append(image,name,type);
            button.addEventListener('click',()=>{if(busy||!guard.confirm())return;fill(row);editor.hidden=false;editor.scrollIntoView({block:'start'});panel.querySelector('#js-avatar-dropzone').focus({preventScroll:true});});grid.append(button);
        }
        if(!visible.length){const empty=document.createElement('p');empty.textContent='Keine passenden Profilbilder gefunden.';grid.append(empty);}
    }
    function fill(row=null){
        current=row;form.reset();field('label').value=row?.label||'';field('image').value=row?.image_url||'';status.textContent='';
        deleteButton.hidden=!row||row.avatar_key==='hero';
        editor.querySelector('h3').textContent=row?'Profilbild bearbeiten':'Neues Profilbild';
        form.querySelector('.admin-form__hint').textContent=row?'Hier kannst du das Bild austauschen. Weitere Einstellungen findest du unter Helden.':'Neue Bilder erhalten den Dateinamen als vorläufigen Heldennamen und sind zunächst inaktiv. Unter Helden benennen und aktivieren.';
        updatePreview();guard.clean(form);render();
    }
    async function load(key){
        const result=await api('admin-avatars');if(!result.ok)throw new Error(result.error||'Profilbilder konnten nicht geladen werden.');
        rows=result.avatars;fill(rows.find(row=>row.avatar_key===key)||null);
    }
    function setBusy(value){busy=value;form.inert=value;form.setAttribute('aria-busy',String(value));panel.querySelectorAll('button').forEach(button=>{button.disabled=value;});}
    search.addEventListener('input',render);
    deleteButton.addEventListener('click',async()=>{
        if(busy||!current||current.avatar_key==='hero')return;
        if(!window.confirm(`„${current.label}“ wirklich löschen? Nutzer mit diesem Profilbild erhalten den Standardhelden. Vorhandene Freischaltungen für dieses Bild werden entfernt.`))return;
        setBusy(true);
        try{const result=await api('admin-avatar-delete',{key:current.avatar_key,contentVersion:current.contentVersion,confirmation:current.avatar_key});if(!result.ok)throw new Error(result.error);await load();editor.hidden=true;count.textContent+=` · Profilbild gelöscht, ${result.resetUsers} Accounts umgestellt.`;}
        catch(error){status.textContent=error.message;}finally{setBusy(false);}
    });
    panel.querySelector('.avatar-admin__toolbar button').addEventListener('click',()=>{if(busy||!guard.confirm())return;fill();editor.hidden=false;editor.scrollIntoView({block:'start'});panel.querySelector('#js-avatar-dropzone').focus({preventScroll:true});});
    setupDropzone({dropzoneSelector:'#js-avatar-dropzone',fileInputSelector:'#js-avatar-file',onFile:async file=>{
        if(!file||busy)return;setBusy(true);
        try{const result=await uploadImage({file,context:'avatar'});field('image').value=result.path;if(!current)field('label').value=file.name.replace(/\.[^.]+$/, '').slice(0,80);field('file').value='';updatePreview();guard.refresh();status.textContent='Bild hochgeladen. Zum Übernehmen noch das Profilbild speichern.';}
        catch(error){status.textContent=error.message;}finally{setBusy(false);}
    }});
    form.addEventListener('submit',async event=>{
        event.preventDefault();if(busy)return;if(!field('image').value){status.textContent='Bitte zuerst ein quadratisches Profilbild hochladen.';return;}
        setBusy(true);
        try{const result=await api('admin-avatar-save',{key:current?.avatar_key||'',label:field('label').value,image:field('image').value,...(current?{}:{kind:'free',enabled:false}),contentVersion:current?.contentVersion||''});if(!result.ok)throw new Error(result.error);guard.clean(form);await load(result.key);status.textContent=`Profilbild gespeichert.${result.resetUsers?` ${result.resetUsers} Accounts wurden auf den Standardhelden umgestellt.`:''}`;}
        catch(error){status.textContent=error.message;}finally{setBusy(false);}
    });
    async function show(active){
        tabs.classList.toggle('u-hidden',!active);panel.classList.toggle('u-hidden',!active||subTab!=='avatars');media.classList.toggle('u-hidden',!active||subTab==='avatars');
        if(!active)return;
        try{if(subTab==='avatars')await load(current?.avatar_key);else await loadMedia(subTab);}
        catch(error){if(subTab==='avatars')count.textContent=error.message;else throw error;}
    }
    tabs.querySelectorAll('button').forEach(button=>button.addEventListener('click',()=>{
        if(busy||!guard.confirm())return;subTab=button.dataset.mediaTab;
        tabs.querySelectorAll('button').forEach(item=>{const active=item===button;item.classList.toggle('tab--active',active);item.setAttribute('aria-pressed',String(active));});
        show(true).catch(error=>{count.textContent=error.message;});
    }));
    return {show,confirmLeave:()=>!busy&&guard.confirm()};
}
