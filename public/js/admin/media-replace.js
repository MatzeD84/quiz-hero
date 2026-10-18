import { openDialog, closeDialog } from '../dialog.js?v=dev';

export function createMediaReplacement({ validateFile, replaceImage }) {
    const dialog = document.createElement('dialog');
    dialog.className = 'modal u-hidden';
    dialog.setAttribute('aria-labelledby', 'media-replace-title');
    dialog.innerHTML = '<div class="modal__content"><div class="modal__close"><button class="modal__close-button icon-button" type="button" aria-label="Dialog schließen"><svg class="icon-button__icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 5 6 6 6-6 1 1-6 6 6 6-1 1-6-6-6 6-1-1 6-6-6-6z"/></svg></button></div><h2 id="media-replace-title" class="modal__headline">Bild austauschen</h2><p class="js-replace-description"></p><form class="admin-form"><div class="admin-dropzone" role="button" tabindex="0" aria-label="Neues Bild auswählen"><strong>Bild hier ablegen oder auswählen</strong><span>JPG, PNG oder WebP bis 6 MB</span><input type="file" accept="image/jpeg,image/png,image/webp" tabindex="-1" aria-label="Neues Bild auswählen"></div><img class="admin-media-detail__image u-hidden" alt="Vorschau des neuen Bildes"><p class="modal__status" role="status"></p><div class="admin-actions"><button class="btn btn--modal" type="submit" disabled>Bild jetzt austauschen</button><button class="account-action-link js-replace-cancel" type="button">Abbrechen</button></div></form></div>';
    document.body.append(dialog);
    const form = dialog.querySelector('form');
    const input = dialog.querySelector('input');
    const dropzone = dialog.querySelector('.admin-dropzone');
    const preview = dialog.querySelector('img');
    const status = dialog.querySelector('[role="status"]');
    const submit = dialog.querySelector('[type="submit"]');
    let item, file, previewUrl;
    let busy = false;
    const clear = () => {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        previewUrl = ''; file = null;
        preview.removeAttribute('src'); preview.classList.add('u-hidden');
        form.reset(); submit.disabled = true; status.textContent = '';
    };
    const close = () => { if (!busy) closeDialog(dialog); };
    dialog.querySelector('.modal__close-button').addEventListener('click', close);
    dialog.querySelector('.js-replace-cancel').addEventListener('click', close);
    dialog.addEventListener('click', event => { if (event.target === dialog) close(); });
    dialog.addEventListener('cancel', event => { if (busy) event.preventDefault(); });
    dialog.addEventListener('close', () => { if (!dialog.open) clear(); });
    const selectFile = candidate => {
        if (busy) return;
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        previewUrl = ''; file = null; submit.disabled = true;
        preview.removeAttribute('src'); preview.classList.add('u-hidden');
        try {
            if (!candidate) return;
            validateFile(candidate);
            file = candidate;
            previewUrl = URL.createObjectURL(file);
            preview.src = previewUrl; preview.classList.remove('u-hidden');
            submit.disabled = false; status.textContent = '';
        } catch (error) { status.textContent = error.message; }
    };
    input.addEventListener('change', () => selectFile(input.files[0]));
    dropzone.addEventListener('click', event => {
        if (!busy && event.target !== input) input.click();
    });
    dropzone.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            if (!busy) input.click();
        }
    });
    for (const name of ['dragenter', 'dragover', 'dragleave', 'drop']) {
        dropzone.addEventListener(name, event => {
            event.preventDefault();
            dropzone.classList.toggle('admin-dropzone--dragover', !busy && ['dragenter', 'dragover'].includes(name));
            if (name === 'drop' && !busy) selectFile(event.dataTransfer?.files?.[0]);
        });
    }
    form.addEventListener('submit', async event => {
        event.preventDefault();
        if (!file || !item || busy) return;
        busy = true;
        dropzone.setAttribute('aria-disabled', 'true');
        dialog.querySelectorAll('button,input').forEach(control => { control.disabled = true; });
        status.textContent = 'Bild wird ausgetauscht …';
        try {
            await replaceImage(item, file);
            closeDialog(dialog);
        } catch (error) { status.textContent = error.message || 'Austausch fehlgeschlagen. Bitte erneut versuchen.'; }
        finally {
            busy = false;
            dropzone.removeAttribute('aria-disabled');
            dialog.querySelectorAll('button,input').forEach(control => { control.disabled = false; });
            submit.disabled = !file;
        }
    });
    return { open(selected) {
        if (busy) return;
        clear(); item = selected;
        dialog.querySelector('.js-replace-description').textContent = `„${item.filename}“ austauschen? Das neue Bild wird automatisch an allen ${item.usage.length} aktuellen Verwendungen eingesetzt. Bestehende Zuordnungen bleiben erhalten.`;
        openDialog(dialog);
    } };
}
