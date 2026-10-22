import { createFormGuard } from '../form-guard.js?v=dev';

export function createSouvenirAdmin({api,getCategories,uploadImage,setupDropzone}) {
    const panel=document.createElement('section');panel.className='admin-category-editor souvenir-admin u-hidden';panel.id='js-admin-souvenir-panel';
    panel.innerHTML='<h2>Meilensteine & Souvenirs</h2><p>Regeln und Motive pflegen. Neue Versionen ändern bereits verdiente Erinnerungsstücke nicht.</p><div class="admin-actions"><select aria-label="Souvenir auswählen"></select><button class="account-action-link" type="button">Neu anlegen</button></div><p class="admin-form__hint js-souvenir-warning"></p><form class="admin-form"><label>Name<input name="title" maxlength="120" required></label><label>Kategorie<select name="categoryId" required></select></label><label>Belohnung und Regel<select name="rule"><option value="first_visit">Reisestempel – erster Besuch</option><option value="discover">Souvenir – unterschiedliche Fragen richtig lösen</option></select></label><label>Zielwert<input name="target" type="number" min="1" max="100000" required></label><label>Beschreibung<textarea name="description" maxlength="1000"></textarea></label><label>Motiv aus der Mediathek<select name="image" required></select></label><img class="admin-dropzone__thumb" alt="Motivvorschau"><div id="js-souvenir-dropzone" class="admin-dropzone" role="button" tabindex="0"><strong>Motiv hier ablegen oder auswählen</strong><span>JPG, PNG oder WebP bis 6 MB</span><input id="js-souvenir-upload" name="upload" type="file" accept="image/png,image/jpeg,image/webp" aria-label="Neues Souvenirmotiv auswählen"></div><label>Status<select name="state"><option value="draft">Entwurf</option><option value="active">Aktiv</option><option value="archived">Archiviert</option></select></label><p class="admin-form__hint">Aktivieren gleicht bestehende Accounts beim nächsten Reisepassbesuch ab. Entwürfe vergeben nichts. Archivieren entzieht keine Belohnungen. Kategorie und Regel bleiben nach dem Anlegen stabil.</p><button class="btn btn--modal" type="submit">Version speichern</button></form><p role="status"></p>';
    document.querySelector('#js-admin-app').append(panel);
    const inventory=document.createElement('div');inventory.className='souvenir-admin__inventory';
    inventory.innerHTML='<div class="souvenir-admin__toolbar"><label>Suche<input type="search" placeholder="Souvenir suchen"></label><label>Kategorie<select aria-label="Souvenirs nach Kategorie filtern"></select></label><label>Status<select aria-label="Souvenirs nach Status filtern"><option value="">Alle Status</option><option value="active">Aktiv</option><option value="draft">Entwurf</option><option value="archived">Archiviert</option></select></label><button class="btn" type="button">Neu anlegen</button></div><p class="souvenir-admin__count" role="status"></p><div class="souvenir-admin__grid"></div>';
    const editor=document.createElement('div');editor.className='souvenir-admin__editor';editor.hidden=true;
    const editorTitle=document.createElement('h3');editorTitle.textContent='Souvenir bearbeiten';editor.append(editorTitle);
    const actions=panel.querySelector('.admin-actions');
    for(const node of [...panel.children].slice(2))editor.append(node);
    const workspace=document.createElement('div');workspace.className='souvenir-admin__workspace';workspace.append(inventory,editor);panel.append(workspace);
    const form=editor.querySelector('form'),status=editor.querySelector('[role=status]'),selector=actions.querySelector('select');
    selector.hidden=true;actions.querySelector('button').hidden=true;
    const search=inventory.querySelector('input'),[categoryFilter,stateFilter]=inventory.querySelectorAll('select');
    const grid=inventory.querySelector('.souvenir-admin__grid'),count=inventory.querySelector('.souvenir-admin__count');
    const states={active:'Aktiv',draft:'Entwurf',archived:'Archiviert'};
    const field=name=>form.elements.namedItem(name);let definitions=[],current=null,busy=false;
    const guard=createFormGuard([form],status,()=>preview());
    const option=(value,label)=>{const o=document.createElement('option');o.value=value;o.textContent=label;return o;};
    function preview(){editor.querySelector('img').src=field('image').value?'../'+field('image').value:'';editor.querySelector('img').hidden=!field('image').value;}
    function renderInventory(){
        const categories=new Map(getCategories().map(c=>[c.id,c.title]));
        const term=search.value.trim().toLocaleLowerCase('de');
        const visible=definitions.filter(d=>(!categoryFilter.value||d.category_id===categoryFilter.value)&&(!stateFilter.value||d.state===stateFilter.value)&&(!term||`${d.title} ${categories.get(d.category_id)||d.category_id}`.toLocaleLowerCase('de').includes(term)));
        count.textContent=`${visible.length} von ${definitions.length} Souvenirs`;
        grid.replaceChildren();
        for(const d of visible){
            const button=document.createElement('button');button.type='button';button.className='souvenir-admin__card';button.setAttribute('aria-pressed',String(current?.souvenir_key===d.souvenir_key));
            const image=document.createElement('img');image.className='souvenir-admin__image';image.src='../'+d.image_url;image.alt='';image.width=112;image.height=112;image.loading='lazy';
            const title=document.createElement('strong');title.textContent=d.title;
            const meta=document.createElement('span');meta.className='souvenir-admin__meta';meta.textContent=`${categories.get(d.category_id)||d.category_id} · ${d.rule_type==='first_visit'?'Reisestempel':`${d.target} Fragen`}`;
            const state=document.createElement('span');state.className='souvenir-admin__state';state.textContent=states[d.state];
            const edit=document.createElement('span');edit.className='souvenir-admin__edit';edit.textContent='Bearbeiten';
            button.append(image,title,meta,state,edit);button.addEventListener('click',()=>{if(busy||!guard.confirm())return;fill(d);editor.hidden=false;editor.scrollIntoView({behavior:'instant',block:'start'});field('title').focus({preventScroll:true});});grid.append(button);
        }
        if(!visible.length){const empty=document.createElement('p');empty.textContent=definitions.length?'Keine passenden Souvenirs gefunden.':'Noch keine Souvenirs angelegt.';grid.append(empty);}
    }
    function fill(d=null){
        editorTitle.textContent=d?'Souvenir bearbeiten':'Neues Souvenir';
        current=d;form.reset();field('title').value=d?.title||'';field('categoryId').value=d?.category_id||getCategories().find(c=>c.id!=='test')?.id||'';field('rule').value=d?.rule_type||'first_visit';field('target').value=d?.target||1;field('description').value=d?.description||'';field('image').value=d?.image_url||'';field('state').value=d?.state||'draft';
        field('categoryId').disabled=Boolean(d);field('rule').disabled=Boolean(d);field('target').readOnly=field('rule').value==='first_visit';selector.value=d?.souvenir_key||'';
        panel.querySelector('.js-souvenir-warning').textContent=d?`Version ${d.revision} · ${d.availableQuestions} aktive Fragen in dieser Kategorie.${d.rule_type==='discover'&&Number(d.target)>d.availableQuestions?' Achtung: Ziel aktuell nicht erreichbar.':''}`:'Neue Belohnung: Kategorie und Regel sorgfältig auswählen.';
        preview();guard.clean(form);renderInventory();
    }
    async function load(key){
        const [data,media]=await Promise.all([api('admin-souvenirs'),api('admin-media-list')]);if(!data.ok||!media.ok)throw new Error(data.error||media.error);
        definitions=data.definitions;selector.replaceChildren(option('','Neue Belohnung'),...definitions.map(d=>option(d.souvenir_key,`${d.title} · ${{active:'Aktiv',draft:'Entwurf',archived:'Archiviert'}[d.state]}`)));
        const selectedCategory=categoryFilter.value;
        const categoryIds=new Set(definitions.map(d=>d.category_id));
        const titles=new Map(getCategories().map(c=>[c.id,c.title]));
        categoryFilter.replaceChildren(option('','Alle Kategorien'),...[...categoryIds].map(id=>option(id,titles.get(id)||id)));categoryFilter.value=selectedCategory;
        field('categoryId').replaceChildren(...getCategories().filter(c=>c.id!=='test').map(c=>option(c.id,c.title)));
        const paths=[...new Set([...media.media.map(m=>m.path),'images/souvenirs/rom-stamp-v1.png','images/souvenirs/rom-token-v1.png',...definitions.map(d=>d.image_url)])];
        field('image').replaceChildren(option('','Motiv auswählen'),...paths.map(p=>option(p,p.split('/').pop())));
        fill(definitions.find(d=>d.souvenir_key===key)||null);
    }
    selector.addEventListener('change',()=>{if(busy)return;if(!guard.confirm()){selector.value=current?.souvenir_key||'';return;}fill(definitions.find(d=>d.souvenir_key===selector.value)||null);});
    inventory.querySelector('button').addEventListener('click',()=>{if(!busy&&guard.confirm()){fill();editor.hidden=false;editor.scrollIntoView({behavior:'instant',block:'start'});field('title').focus({preventScroll:true});}});
    search.addEventListener('input',renderInventory);categoryFilter.addEventListener('change',renderInventory);stateFilter.addEventListener('change',renderInventory);
    field('image').addEventListener('change',preview);
    field('rule').addEventListener('change',()=>{field('target').readOnly=field('rule').value==='first_visit';field('target').value=field('rule').value==='first_visit'?1:20;guard.refresh();});
    const uploadFile=async file=>{
        if(!file||busy)return;busy=true;form.inert=true;
        try{const data=await uploadImage({file,context:'souvenir'});field('image').append(option(data.path,file.name));field('image').value=data.path;field('upload').value='';preview();guard.refresh();}
        catch(e){status.textContent=e.message;}finally{busy=false;form.inert=false;}
    };
    setupDropzone({dropzoneSelector:'#js-souvenir-dropzone',fileInputSelector:'#js-souvenir-upload',onFile:uploadFile});
    form.addEventListener('submit',async event=>{
        event.preventDefault();if(busy)return;busy=true;form.inert=true;
        try{const payload=Object.fromEntries(['title','categoryId','rule','target','description','image','state'].map(n=>[n,field(n).value]));const result=await api('admin-souvenir-save',{...payload,key:current?.souvenir_key||'',contentVersion:current?.contentVersion||''});if(!result.ok)throw new Error(result.error);await load(result.key);status.textContent='Neue Version gespeichert. Bereits erhaltene Souvenirs bleiben erhalten.';}
        catch(e){status.textContent=e.message;}finally{busy=false;form.inert=false;}
    });
    return {confirmLeave:()=>!busy&&guard.confirm(),async show(active){panel.classList.toggle('u-hidden',!active);if(active){try{await load(current?.souvenir_key);}catch(e){count.textContent=e.message;}}}};
}
