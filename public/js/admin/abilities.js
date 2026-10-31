import { createFormGuard } from '../form-guard.js?v=dev';
import { openDialog, closeDialog, completeDialogSave } from '../dialog.js?v=dev';

export function createAbilityAdmin({ api, uploadImage, setupDropzone }) {
    const tab = document.createElement('button');tab.className = 'tab';tab.type = 'button';tab.dataset.adminTab = 'abilities';tab.setAttribute('aria-pressed', 'false');tab.textContent = 'Helden';document.querySelector('.admin-tabs').append(tab);
    const panel = document.createElement('section');panel.className = 'admin-category-editor hero-abilities-admin u-hidden';
    panel.innerHTML = '<h2>Heldenfähigkeiten</h2><p>Fähigkeiten mit 0 Runden stehen sofort bereit; andere werden im Spiel erlernt. Eine Runde zählt ab fünf beantworteten Fragen. Jede verfügbare Fähigkeit ist automatisch einmal je Runde nutzbar.</p><p role="status"></p><label class="hero-abilities-admin__picker">Fähigkeit bearbeiten<select data-ability-select></select></label><form class="admin-form hero-abilities-admin__form"><label>Name<input name="title" maxlength="120" required></label><label>Beschreibung<textarea name="description" maxlength="500" required></textarea></label><p>Hier bearbeitest du vorhandene, fest implementierte Fähigkeiten. Neue Wirkungen werden in der Entwicklung ergänzt.</p><label>Abgeschlossene Runden zur Freischaltung<input name="target" type="number" min="0" max="100" required value="3" aria-describedby="ability-rounds-hint"></label><p id="ability-rounds-hint" class="admin-form__hint">0 Runden = Startfähigkeit für alle zugeordneten Helden. Ab 1 Runde muss sie je Held erlernt werden.</p><label class="admin-checkbox-inline"><input name="enabled" type="checkbox" checked>Aktiv</label><button class="btn btn--modal" type="submit">Fähigkeit speichern</button></form><section class="hero-abilities-admin__heroes"><h3>Helden verwalten</h3><p>Wähle einen Helden, um Name, Verfügbarkeit, Aktivstatus und bis zu drei Fähigkeiten zu pflegen. Startfähigkeiten stehen sofort bereit; weitere persönliche Freischaltungen erfolgen im Spiel.</p><div class="profile-avatar__grid"></div></section>';
    panel.querySelector('h2').textContent = 'Helden';
    const heroes = panel.querySelector('.hero-abilities-admin__heroes');heroes.id = 'admin-heroes';heroes.tabIndex = -1;
    const editor = document.createElement('section');editor.id = 'admin-ability-editor';editor.className = 'hero-abilities-admin__editor';editor.tabIndex = -1;
    const editorHeading = document.createElement('h3');editorHeading.textContent = 'Heldenfähigkeiten bearbeiten';
    editor.append(editorHeading, panel.querySelector('h2 + p'), panel.querySelector('[data-ability-select]').closest('label'), panel.querySelector('form'));
    const jumps = document.createElement('nav');jumps.className = 'hero-abilities-admin__jump-links';jumps.setAttribute('aria-label', 'Bereiche der Heldenverwaltung');
    jumps.innerHTML = '<a href="#admin-heroes" data-ability-jump>Helden verwalten</a><a href="#admin-ability-editor" data-ability-jump>Fähigkeiten bearbeiten</a>';
    panel.replaceChildren(panel.querySelector('h2'), jumps, panel.querySelector('[role=status]'), heroes, editor);
    document.querySelector('#js-admin-app').append(panel);
    const dialog = document.createElement('dialog');dialog.id = 'js-admin-hero-abilities-modal';dialog.className = 'modal u-hidden';
    dialog.innerHTML = '<div class="modal__content hero-abilities-admin__dialog"><button class="modal__close modal__close-button" type="button" aria-label="Dialog schließen">×</button><header class="hero-abilities-admin__hero-heading"><img width="112" height="112" alt=""><h2 class="modal__headline"></h2></header><p>Jede freigeschaltete Fähigkeit steht einmal pro Runde bereit. Entfernen einer Zuordnung sperrt die weitere Nutzung in neuen Runden, löscht aber keine persönliche Freischaltung.</p><form class="admin-form hero-abilities-admin__form"><fieldset class="hero-abilities-admin__choices"><legend>Fähigkeiten auswählen (maximal drei)</legend><div></div></fieldset><p class="modal__status" role="status" aria-live="polite"></p><div class="admin-actions"><button class="btn btn--modal" type="submit">Zuordnung speichern</button><button class="account-action-link" type="button" data-cancel>Abbrechen</button></div></form></div>';
    document.body.append(dialog);
    const profileForm = document.createElement('form');profileForm.className='admin-form hero-abilities-admin__form';
    profileForm.innerHTML='<h3>Held bearbeiten</h3><label>Name<input name="label" maxlength="80" required></label><label>Verfügbarkeit<select name="kind"><option value="free">Frei verfügbar</option><option value="reward">Belohnung</option></select></label><label class="admin-checkbox-inline"><input name="enabled" type="checkbox">Aktiv</label><p>Deaktivieren stellt betroffene Accounts auf den Standardhelden um. Belohnungshelden sind erst nach Freischaltung auswählbar. Individuelle Bedingungen pflegst du unter Belohnungen.</p><button class="btn btn--modal" type="submit">Held speichern</button>';
    dialog.querySelector('header').after(profileForm);
    const assignmentForm=dialog.querySelector('form.hero-abilities-admin__form:last-child');
    const submitButton=profileForm.querySelector('[type=submit]');
    const assignmentHint=profileForm.nextElementSibling;
    profileForm.insertBefore(assignmentHint,submitButton);
    profileForm.insertBefore(assignmentForm.querySelector('fieldset'),submitButton);
    profileForm.insertBefore(assignmentForm.querySelector('[role=status]'),submitButton);
    const cancelButton=assignmentForm.querySelector('[data-cancel]');profileForm.append(cancelButton);assignmentForm.remove();
    const form = panel.querySelector('form');
    const motif = document.createElement('div');motif.className = 'hero-abilities-admin__motif';
    motif.innerHTML = '<label>Motiv aus der Mediathek<select name="image"></select></label><img class="hero-abilities-admin__motif-preview" alt="Vorschau des Fähigkeitsmotivs" width="144" height="144" hidden><div id="js-ability-dropzone" class="admin-dropzone" role="button" tabindex="0"><strong>Fähigkeitsmotiv hier ablegen oder auswählen</strong><span>JPG, PNG oder WebP bis 6 MB</span><input id="js-ability-file" name="upload" type="file" accept="image/jpeg,image/png,image/webp" aria-label="Fähigkeitsmotiv hochladen"></div>';
    form.elements.namedItem('description').closest('label').after(motif);
    const status = panel.querySelector('[role=status]'), dialogStatus = dialog.querySelector('[role=status]');
    const picker = panel.querySelector('[data-ability-select]'), grid = panel.querySelector('.profile-avatar__grid'), list = dialog.querySelector('fieldset > div');
    const field = name => form.elements.namedItem(name);
    let data = { abilities: [], heroes: [] }, current = null, hero = null, busy = false, loading = false;
    const profileField=name=>profileForm.elements.namedItem(name);
    let avatars=[];
    const profileGuard=createFormGuard([profileForm],dialogStatus,updateLimit);
    const guard = createFormGuard([form], status, preview);
    function preview() {
        const image = motif.querySelector('img');image.hidden = !field('image').value;
        if (field('image').value) image.src = '../' + field('image').value;else image.removeAttribute('src');
    }
    field('image').addEventListener('change', preview);
    setupDropzone?.({ dropzoneSelector: '#js-ability-dropzone', fileInputSelector: '#js-ability-file', onFile: async file => {
        if (!file || busy || loading) return;busy = true;panel.inert = true;status.textContent = 'Fähigkeitsmotiv wird hochgeladen …';
        try {
            const result = await uploadImage({ file, context: 'ability' });
            field('image').append(new Option(file.name, result.path));field('image').value = result.path;field('upload').value = '';preview();guard.refresh();status.textContent = 'Motiv hochgeladen. Zum Übernehmen noch die Fähigkeit speichern.';
        } catch (error) { status.textContent = error.message; }
        finally { busy = false;panel.inert = false; }
    } });
    function fill(id) {
        current = data.abilities.find(a => a.id === id) || data.abilities[0] || null;picker.value = current?.id || '';form.reset();form.hidden = !current;
        for (const name of ['title', 'description']) field(name).value = current?.[name] || '';
        field('target').value = current?.rounds_required ?? 3;field('enabled').checked = current ? Boolean(Number(current.enabled)) : true;
        field('image').value = current?.image_url || '';preview();guard.clean(form);
    }
    function updateLimit() {
        const globals = data.abilities.filter(a => a.scope === 'global' && Number(a.enabled)).length;
        const selected = list.querySelectorAll('input:checked').length;
        for (const input of list.querySelectorAll('input')) input.disabled = !input.checked && selected >= Math.max(0, 3 - globals);
    }
    function renderHeroes() {
        grid.replaceChildren();
        for (const row of data.heroes) {
            const button = document.createElement('button');button.type = 'button';button.className = 'profile-avatar__card hero-abilities-admin__hero-card';button.dataset.heroKey = row.avatar_key;
            button.setAttribute('aria-haspopup', 'dialog');button.setAttribute('aria-controls', dialog.id);button.setAttribute('aria-expanded', String(dialog.open && row.avatar_key === hero?.avatar_key));button.setAttribute('aria-label', `${row.label}: Held bearbeiten`);
            const image = document.createElement('img');image.src = '../' + row.image_url;image.alt = '';image.width = 112;image.height = 112;image.loading = 'lazy';
            image.className='hero-abilities-admin__hero-image';image.classList.toggle('hero-abilities-admin__hero-image--inactive',!Number(row.enabled));
            const name = document.createElement('strong');name.textContent = row.label;
            const summary = document.createElement('span');summary.className = 'profile-avatar__state';summary.textContent = `${row.abilityIds.length===0?'Keine Fähigkeiten':row.abilityIds.length===1?'1 Fähigkeit':`${row.abilityIds.length} Fähigkeiten`}${Number(row.enabled)?'':' · Inaktiv'}`;
            const names=document.createElement('span');names.className='hero-abilities-admin__ability-labels';
            for(const id of row.abilityIds){
                const label=document.createElement('span');label.className='hero-abilities-admin__ability-label';label.textContent=data.abilities.find(a=>a.id===id)?.title||id;names.append(label);
            }
            button.append(image,name);
            if(avatars.find(a=>a.avatar_key===row.avatar_key)?.unlock_rule){
                const tag=document.createElement('span');tag.className='profile-avatar__reward-tag';tag.textContent='Belohnung';button.append(tag);
            }
            button.append(summary);if(row.abilityIds.length)button.append(names);
            button.addEventListener('click', () => {
                if (busy || loading || !guard.confirm()) return;
                fillHero(row.avatar_key);button.setAttribute('aria-expanded', 'true');openDialog(dialog);
            });grid.append(button);
        }
        if (!data.heroes.length) grid.textContent = 'Keine Helden vorhanden.';
    }
    function fillHero(key) {
        hero = data.heroes.find(h => h.avatar_key === key) || null;list.replaceChildren();
        dialog.querySelector('h2').textContent = hero?.label || 'Held';
        const avatar=avatars.find(a=>a.avatar_key===key);
        profileForm.reset();profileField('label').value=avatar?.label||'';profileField('kind').value=avatar?.unlock_rule?'reward':'free';profileField('enabled').checked=Boolean(Number(avatar?.enabled));
        profileField('kind').disabled=profileField('enabled').disabled=key==='hero';profileGuard.clean(profileForm);
        const image = dialog.querySelector('header img');image.hidden = !hero;if (hero) image.src = '../' + hero.image_url;
        for (const a of data.abilities.filter(item => item.scope === 'hero')) {
            const label = document.createElement('label'), input = document.createElement('input');input.type = 'checkbox';input.name = 'abilityIds';input.value = a.id;input.checked = Boolean(hero?.abilityIds.includes(a.id));
            label.append(input, document.createTextNode(`${a.title} · ${Number(a.rounds_required)===0?'Startfähigkeit':`${a.rounds_required} ${Number(a.rounds_required)===1?'Runde':'Runden'}`}${Number(a.enabled) ? '' : ' (inaktiv)'}`));list.append(label);
        }
        dialogStatus.textContent = '';dialogStatus.dataset.status = '';updateLimit();profileGuard.clean(profileForm);
    }
    async function load(id = current?.id) {
        const [result, media, catalog] = await Promise.all([api('admin-abilities'), api('admin-media-list'),api('admin-avatars')]);if (!result.ok || !media.ok || !catalog.ok) throw new Error(result.error || media.error || catalog.error);data = result;avatars=catalog.avatars;
        const paths = [...new Set([...(media.media || []).filter(m => m.mediaKind === 'abilities').map(m => m.path), ...data.abilities.map(a => a.image_url).filter(Boolean)])];
        field('image').replaceChildren(new Option('Kein Motiv', ''), ...paths.map(path => new Option(path.split('/').pop(), path)));
        picker.replaceChildren(...data.abilities.map(a => new Option(a.title, a.id)));fill(id);renderHeroes();status.textContent = '';
    }
    function requestClose() {
        if (busy || !profileGuard.confirm()) return;
        closeDialog(dialog);
    }
    dialog.querySelector('[aria-label="Dialog schließen"]').addEventListener('click', requestClose);
    dialog.querySelector('[data-cancel]').addEventListener('click', requestClose);
    dialog.addEventListener('cancel', event => { event.preventDefault();requestClose(); });
    dialog.addEventListener('click', event => { if (event.target === dialog) requestClose(); });
    dialog.addEventListener('close', () => {
        for (const button of grid.querySelectorAll('button')) button.setAttribute('aria-expanded', 'false');
        Array.from(grid.querySelectorAll('button')).find(button => button.dataset.heroKey === hero?.avatar_key)?.focus({ preventScroll: true });
    });
    list.addEventListener('change', updateLimit);
    picker.addEventListener('change', () => { if (!guard.confirm()) { picker.value = current?.id || '';return; }fill(picker.value); });
    async function save(action, payload) {
        if (busy) return;busy = true;panel.inert = true;profileForm.inert=true;
        let savedDialog=false;
        const target = action === 'admin-hero-abilities-save' || action==='admin-avatar-save' ? dialogStatus : status;
        dialog.querySelectorAll('button').forEach(button => { button.disabled = true; });target.textContent = 'Wird gespeichert …';target.dataset.status = '';
        try {
            const result = await api(action, payload);if (!result.ok) throw new Error(result.error);
            // Mark the successful write clean before a reload; do not invite a duplicate save.
            if(action==='admin-avatar-save')profileGuard.clean(profileForm);else guard.clean(form);
            if(action==='admin-avatar-save'){
                savedDialog=true;
                completeDialogSave(dialog,`Held gespeichert.${result.resetUsers?` ${result.resetUsers} Accounts wurden auf den Standardhelden umgestellt.`:''}`);
            }
            await load(result.id || current?.id);
            if (dialog.open && hero) {
                hero=data.heroes.find(row=>row.avatar_key===hero.avatar_key)||hero;
                dialog.querySelector('h2').textContent=hero.label;
                dialogStatus.textContent=action==='admin-avatar-save'
                    ? `Held gespeichert.${result.resetUsers?` ${result.resetUsers} Accounts wurden auf den Standardhelden umgestellt.`:''}`
                    : 'Zuordnung gespeichert. Bestehende Freischaltungen bleiben erhalten.';
            } else status.textContent = 'Gespeichert. Bestehende Freischaltungen bleiben erhalten.';
        } catch (error) {
            if(savedDialog){status.textContent='Held gespeichert. Die Ansicht konnte nicht aktualisiert werden. Bitte lade die Seite neu.';status.dataset.status='info';}
            else {target.textContent=error.message;target.dataset.status='error';}
        }
        finally {
            busy=false;panel.inert=false;profileForm.inert=false;dialog.querySelectorAll('button').forEach(button=>{button.disabled=false;});
            if(savedDialog)Array.from(grid.querySelectorAll('button')).find(button=>button.dataset.heroKey===hero?.avatar_key)?.focus({preventScroll:true});
        }
    }
    form.addEventListener('submit', event => {
        event.preventDefault();if (busy || !current) return;
        save('admin-ability-save', { id: current.id, contentVersion: current.contentVersion, title: field('title').value, description: field('description').value, image: field('image').value, roundsRequired: Number(field('target').value), enabled: field('enabled').checked });
    });
    profileForm.addEventListener('submit',event=>{
        event.preventDefault();if(busy||!hero)return;
        const avatar=avatars.find(a=>a.avatar_key===hero.avatar_key);if(!avatar)return;
        save('admin-avatar-save',{key:avatar.avatar_key,label:profileField('label').value,image:avatar.image_url,kind:profileField('kind').value,rewardRule:avatar.unlock_rule||'configured',enabled:profileField('enabled').checked,contentVersion:avatar.contentVersion,assignmentVersion:hero.contentVersion,abilityIds:Array.from(list.querySelectorAll('input:checked'),input=>input.value)});
    });
    return {
        confirmLeave: () => !busy && !loading && guard.confirm() && (!dialog.open || profileGuard.confirm()),
        async show(visible) {
            panel.classList.toggle('u-hidden', !visible);if (!visible) { if (dialog.open) closeDialog(dialog);return; }
            loading = true;panel.inert = true;status.textContent = 'Fähigkeiten werden geladen …';
            try { await load(); } catch (error) { status.textContent = error.message; } finally { loading = false;panel.inert = false; }
        }
    };
}
