import { openDialog, closeDialog, completeDialogSave } from './dialog.js?v=dev';
import { normalizeAvatarUrl } from './config.js?v=dev';
import { createLoadingStatus } from './admin/loading-status.js?v=dev';

export function createHeroPreview({ load, onSelect, isSelected = () => false, savedMessage = null }) {
    const dialog = document.createElement('dialog');dialog.id = 'hero-preview';dialog.className = 'modal u-hidden';
    dialog.innerHTML = '<div class="modal__content hero-preview"><div class="modal__close"><button type="button" class="modal__close-button icon-button" aria-label="Dialog schließen"></button></div><header class="hero-preview__header"><img width="112" height="112" alt=""><h2 class="modal__headline"></h2></header><p class="hero-preview__hint">Jede Fähigkeit ist einmal pro Questrunde nutzbar.</p><div class="hero-preview__abilities"></div><p role="status" aria-live="polite"></p><button type="button" class="btn" data-select>Helden auswählen</button></div>';
    document.body.append(dialog);
    const status = dialog.querySelector('[role=status]'), select = dialog.querySelector('[data-select]'), list = dialog.querySelector('.hero-preview__abilities'), close = dialog.querySelector('[aria-label]');
    const loading = createLoadingStatus();let generation = 0, busy = false, hero = null;
    const requestClose = () => { if (!busy) closeDialog(dialog); };
    close.addEventListener('click', requestClose);
    dialog.addEventListener('click', event => { if (event.target === dialog) requestClose(); });
    dialog.addEventListener('cancel', event => { if (busy) event.preventDefault(); });
    dialog.addEventListener('close', () => { if (!dialog.open) generation++; });
    select.addEventListener('click', async () => {
        if (busy || select.disabled || !hero) return;
        busy = true;select.disabled = true;close.disabled = true;status.textContent = 'Dein Held wird übernommen …';
        try { await onSelect(hero);if(savedMessage)completeDialogSave(dialog,savedMessage);else closeDialog(dialog); }
        catch (error) { status.textContent = error.message || 'Dein Held konnte nicht übernommen werden.'; }
        finally { busy = false;select.disabled = !hero || isSelected(hero);close.disabled = false; }
    });
    return { async open(avatar) {
        if (busy) return;
        const request = ++generation;hero = null;select.disabled = true;list.replaceChildren();status.textContent = 'Fähigkeiten werden geladen …';
        list.hidden=true;dialog.querySelector('.hero-preview__hint').hidden=true;
        dialog.querySelector('.hero-preview__description')?.remove();
        dialog.querySelector('h2').textContent = avatar.label;dialog.querySelector('header img').src = normalizeAvatarUrl(avatar.url);openDialog(dialog);
        try {
            const data = await loading.track('Heldenfähigkeiten werden geladen …', () => load(avatar.key));
            if (request !== generation || !dialog.open) return;
            hero = data.hero;
            dialog.querySelector('.hero-preview__description')?.remove();
            const description = document.createElement('div');description.className = 'hero-preview__description';description.id = 'hero-preview-description';description.hidden = true;description.setAttribute('aria-live', 'polite');
            const descriptionTitle = document.createElement('p');descriptionTitle.className = 'hero-preview__description-title';
            const descriptionText = document.createElement('p');descriptionText.className = 'hero-preview__description-text';description.append(descriptionTitle, descriptionText);list.after(description);
            for (const ability of (data.items || []).filter(item=>item.unlocked===true)) {
                const button = document.createElement('button');button.type = 'button';button.className = 'hero-preview__ability';button.setAttribute('aria-expanded', 'false');button.setAttribute('aria-controls', description.id);
                if (ability.image) { const image = document.createElement('img');image.src = normalizeAvatarUrl(ability.image);image.alt = '';image.width = 40;image.height = 40;button.append(image); }
                const label = document.createElement('span');label.textContent = ability.title;button.append(label);list.append(button);
                button.addEventListener('click', () => {
                    const open = button.getAttribute('aria-expanded') !== 'true';
                    for (const other of list.children) other.setAttribute('aria-expanded', 'false');
                    button.setAttribute('aria-expanded', String(open));descriptionTitle.textContent = `${ability.title} · Deine Fähigkeit`;descriptionText.textContent = ability.description;description.hidden = !open;
                });
            }
            list.hidden=!list.children.length;dialog.querySelector('.hero-preview__hint').hidden=!list.children.length;
            status.textContent = list.children.length ? '' : 'Fähigkeiten werden im Spiel freigeschaltet.';select.disabled = isSelected(hero);
        } catch (error) { if (request === generation && dialog.open) status.textContent = error.message || 'Fähigkeiten konnten nicht geladen werden. Bitte den Dialog erneut öffnen.'; }
    } };
}
