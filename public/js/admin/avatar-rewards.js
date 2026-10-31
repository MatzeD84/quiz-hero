import { createFormGuard } from '../form-guard.js?v=dev';

export function avatarRewardSummary(rule, category = '') {
    const singular=Number(rule.target)===1;
    const difficulty = ({ all: ['Frage','Fragen'], easy: ['einfache Frage','einfache Fragen'], medium: ['schwere Frage','schwere Fragen'], hero: ['Hero-Frage','Hero-Fragen'] }[rule.difficulty] || ['Frage','Fragen'])[singular?0:1];
    return `Beantworte ${rule.period === 'round' ? 'innerhalb einer einzigen Questrunde' : 'insgesamt'} ${rule.target || '…'}${singular?'':' unterschiedliche'} ${difficulty}${category ? ` in der Kategorie „${category}“` : ''}${rule.attempts === 'first' ? ' im ersten Versuch' : ' im ersten oder zweiten Versuch'}${rule.withoutHelp ? ' ohne Hilfe durch Heldenfähigkeiten' : ' (Heldenfähigkeiten erlaubt)'} richtig.`;
}

export function createAvatarRewardAdmin({ api, getCategories }) {
    const panel = document.createElement('section');panel.className = 'admin-category-editor avatar-reward-admin u-hidden';
    panel.innerHTML = '<h2>Heldenbelohnungen</h2><p>Ein neuer Held als Belohnung: Wähle ein Profilbild und stelle seine Freischaltbedingung zusammen.</p><p class="admin-form__hint">Neue Bilder unter Mediathek → Profilbilder hochladen und anschließend unter Helden als „Belohnung“ einrichten. Freie Profile werden hier nicht umgestellt.</p><div class="admin-actions"><button type="button" class="btn" data-new>Heldenbelohnung anlegen</button><span data-count></span></div><div class="souvenir-admin__grid" data-inventory></div><section class="avatar-reward-admin__editor" hidden><h3>Freischaltregel bearbeiten</h3><form class="admin-form"><label>Belohnungsheld<select name="avatarKey" required></select></label><img class="avatar-reward-admin__preview" alt="Heldenvorschau" width="112" height="112" hidden><p class="admin-form__hint" data-source hidden></p><div class="avatar-reward-admin__fields"><label>Anzahl richtiger Fragen<input name="target" type="number" min="1" max="10000" required value="5"></label><label>Schwierigkeit<select name="difficulty"><option value="hero">Hero-Fragen</option><option value="medium">Schwere Fragen</option><option value="easy">Einfache Fragen</option><option value="all">Alle Schwierigkeiten</option></select></label><label>Antwortversuch<select name="attempts"><option value="any">Erster oder zweiter Versuch</option><option value="first">Nur erster Versuch</option></select></label><label>Heldenfähigkeiten<select name="help"><option value="without">Ohne Hilfe</option><option value="allowed">Hilfe erlaubt</option></select></label><label>Zeitrahmen<select name="period"><option value="total">Über mehrere Questrunden sammeln</option><option value="round">Innerhalb einer einzigen Questrunde</option></select></label><label>Kategorie<select name="categoryId"></select></label></div><div class="avatar-reward-admin__summary" aria-live="polite"><strong>So wird der Held freigeschaltet</strong><p></p></div><p class="admin-form__hint">Jede Frage zählt nur einmal. Es zählen richtige Antworten aus gespeicherten Runden. Ohne Hilfe bezieht sich auf die jeweilige Frage. Bereits verdiente Helden bleiben bei Regeländerungen erhalten.</p><label>Status<select name="state"><option value="draft">Entwurf – noch keine Vergabe</option><option value="active">Aktiv – Vergabe ermöglichen</option><option value="archived">Archiviert – keine neuen Vergaben</option></select></label><p class="admin-form__hint">Aktive Regeln berücksichtigen belegbare frühere Antworten beim nächsten Rundenabschluss oder beim Laden der Sammlung. Es erfolgt keine sofortige Massenvergabe.</p><button class="btn" type="submit">Belohnung speichern</button></form></section><p role="status"></p>';
    document.querySelector('#js-admin-app').append(panel);
    const form=panel.querySelector('form'), editor=panel.querySelector('.avatar-reward-admin__editor'), inventory=panel.querySelector('[data-inventory]'), status=panel.querySelector('[role=status]');
    const field=name=>form.elements.namedItem(name), option=(value,label)=>new Option(label,value);
    let rules=[],avatars=[],current=null,busy=false,loading=false;
    const payload=()=>({avatarKey:field('avatarKey').value,target:Number(field('target').value),difficulty:field('difficulty').value,attempts:field('attempts').value,withoutHelp:field('help').value==='without',categoryId:field('categoryId').value||null,period:field('period').value,state:field('state').value});
    const guard=createFormGuard([form],status,preview);
    function preview(){
        const data=payload(),avatar=avatars.find(a=>a.avatar_key===data.avatarKey),image=panel.querySelector('.avatar-reward-admin__preview');
        image.hidden=!avatar;if(avatar)image.src='../'+avatar.image_url;
        const category=getCategories().find(c=>c.id===data.categoryId)?.title||data.categoryId;
        panel.querySelector('.avatar-reward-admin__summary p').textContent=avatarRewardSummary(data,category);
    }
    form.addEventListener('input',preview);form.addEventListener('change',preview);
    function fill(rule=null){
        current=rule;form.reset();
        field('avatarKey').replaceChildren(option('','Belohnungsheld auswählen'),...avatars.filter(a=>a.avatar_key===rule?.avatar_key||!rules.some(r=>r.avatar_key===a.avatar_key)).map(a=>option(a.avatar_key,a.label+(Number(a.enabled)?'':' (inaktiv)'))));
        field('avatarKey').value=rule?.avatar_key||'';field('avatarKey').disabled=Boolean(rule);
        field('categoryId').replaceChildren(option('','Alle Kategorien'),...getCategories().map(c=>option(c.id,c.title)));
        if(rule?.category_id&&!getCategories().some(c=>c.id===rule.category_id))field('categoryId').append(option(rule.category_id,`Nicht mehr vorhandene Kategorie: ${rule.category_id}`));
        if(rule){for(const name of ['target','difficulty','attempts','period','state'])field(name).value=rule[name];field('help').value=Number(rule.without_help)?'without':'allowed';field('categoryId').value=rule.category_id||'';}
        const source=panel.querySelector('[data-source]');
        source.textContent=rule&&rule.unlock_rule!=='configured'?'Momentan gilt die Freischaltung aus der Heldenverwaltung. Speichern übernimmt stattdessen die hier gezeigte Baukasten-Regel.':'';source.hidden=!source.textContent;
        preview();guard.clean(form);
    }
    function render(){
        inventory.replaceChildren();panel.querySelector('[data-count]').textContent=`${rules.length} Heldenbelohnungen`;
        for(const rule of rules){
            const button=document.createElement('button');button.type='button';button.className='souvenir-admin__card';
            const image=document.createElement('img');image.src='../'+rule.image_url;image.alt='';image.className='souvenir-admin__image';image.loading='lazy';
            const title=document.createElement('strong');title.textContent=rule.label;
            const summary=document.createElement('span');summary.className='souvenir-admin__meta';summary.textContent=avatarRewardSummary({target:rule.target,difficulty:rule.difficulty,attempts:rule.attempts,withoutHelp:Boolean(Number(rule.without_help)),period:rule.period},getCategories().find(c=>c.id===rule.category_id)?.title||rule.category_id);
            const state=document.createElement('span');state.className='souvenir-admin__state';state.textContent={draft:'Entwurf',active:'Aktiv',archived:'Archiviert'}[rule.state]+(!Number(rule.enabled)?' · Held inaktiv':rule.unlock_rule==='manual'?' · In Heldenverwaltung pausiert':rule.unlock_rule==='hero_first_try'?' · Feste Helden-Regel':!rule.unlock_rule?' · Profil frei verfügbar':'');
            button.append(image,title,summary,state);button.addEventListener('click',()=>{if(busy||loading||!guard.confirm())return;fill(rule);editor.hidden=false;editor.scrollIntoView({block:'start'});});inventory.append(button);
        }
        if(!rules.length)inventory.textContent='Noch keine Heldenbelohnungen angelegt.';
    }
    async function load(key=current?.avatar_key){
        const data=await api('admin-avatar-rewards');if(!data.ok)throw Error(data.error);rules=data.rules;avatars=data.avatars;render();fill(rules.find(r=>r.avatar_key===key)||null);
    }
    panel.querySelector('[data-new]').addEventListener('click',()=>{if(busy||loading||!guard.confirm())return;fill();editor.hidden=false;editor.scrollIntoView({block:'start'});});
    form.addEventListener('submit',async event=>{
        event.preventDefault();if(busy||loading)return;busy=true;panel.inert=true;status.textContent='Belohnung wird gespeichert …';
        try{
            const data=payload(),avatar=avatars.find(a=>a.avatar_key===data.avatarKey);
            const result=await api('admin-avatar-reward-save',{...data,contentVersion:current?.contentVersion||'',avatarRevision:Number(avatar?.revision)});if(!result.ok)throw Error(result.error);
            guard.clean(form);await load(result.avatarKey);status.textContent='Belohnung gespeichert. Bereits verdiente Helden bleiben erhalten.';
        }catch(error){status.textContent=error.message||'Speichern fehlgeschlagen.';}finally{busy=false;panel.inert=false;}
    });
    return {panel,confirmLeave:()=>!busy&&!loading&&guard.confirm(),async show(active){panel.classList.toggle('u-hidden',!active);if(!active)return;loading=true;panel.inert=true;status.textContent='Heldenbelohnungen werden geladen …';try{await load();status.textContent='';}catch(error){status.textContent=error.message;}finally{loading=false;panel.inert=false;}}};
}

export function createRewardTabs({ souvenirs, heroes }) {
    const souvenirPanel=document.querySelector('#js-admin-souvenir-panel'),nav=document.createElement('nav');nav.className='tabs admin-tabs u-hidden';nav.setAttribute('aria-label','Belohnungsarten');
    nav.innerHTML='<button type="button" class="tab tab--active" data-reward-tab="souvenirs" aria-pressed="true">Meilensteine & Souvenirs</button><button type="button" class="tab" data-reward-tab="heroes" aria-pressed="false">Neue Helden</button>';
    souvenirPanel.before(nav);let active=false,selected='souvenirs';
    const show=async visible=>{active=visible;nav.classList.toggle('u-hidden',!visible);await Promise.all([souvenirs.show(visible&&selected==='souvenirs'),heroes.show(visible&&selected==='heroes')]);};
    nav.querySelectorAll('button').forEach(button=>button.addEventListener('click',()=>{if(!souvenirs.confirmLeave()||!heroes.confirmLeave())return;selected=button.dataset.rewardTab;nav.querySelectorAll('button').forEach(b=>{const on=b===button;b.classList.toggle('tab--active',on);b.setAttribute('aria-pressed',String(on));});show(active);}));
    return {show};
}
