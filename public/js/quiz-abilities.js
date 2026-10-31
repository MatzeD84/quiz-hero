import { abilityUseReason, abilitySymbols } from './hero-abilities.js?v=dev';
import { openDialog, closeDialog } from './dialog.js?v=dev';
import { normalizeAvatarUrl } from './config.js?v=dev';

const views = new WeakMap();
const el = (tag, className, text) => { const node = document.createElement(tag);node.className = className || '';if (text !== undefined) node.textContent = text;return node; };

export function abilityDialogItems({ abilities = [], question, attempts, used = {}, pendingId }) {
    return abilities.filter(a => used[a.id] || (pendingId ? a.id === pendingId : !abilityUseReason(a, question, attempts, false)));
}

export function closeAbilityControls(bar) {
    const view = bar && views.get(bar);if (view) closeDialog(view.dialog);
}

export function renderAbilityControls(bar, options) {
    let view = views.get(bar);
    if (!view) {
        const trigger = el('button', 'hero-abilities__entry');trigger.type = 'button';trigger.setAttribute('aria-haspopup', 'dialog');trigger.setAttribute('aria-controls', 'quiz-hero-abilities');
        trigger.setAttribute('aria-expanded', 'false');
        const portrait = el('img');portrait.alt = '';portrait.width = 28;portrait.height = 28;
        const label = el('span', 'hero-abilities__entry-label', 'Hilfe'), count = el('span', 'hero-abilities__count');trigger.append(portrait, label, count);
        const status = el('p', 'hero-abilities__status');status.setAttribute('role', 'status');bar.replaceChildren(trigger, status);
        const dialog = el('dialog', 'modal u-hidden');dialog.id = 'quiz-hero-abilities';
        dialog.innerHTML = '<div class="modal__content hero-preview"><div class="modal__close"><button type="button" class="modal__close-button icon-button" aria-label="Dialog schließen"></button></div><header class="hero-preview__header"><img width="96" height="96" alt=""><div><h2 class="modal__headline" data-hero-name></h2><p class="hero-preview__hint" data-ability-count></p></div></header><p class="hero-preview__hint">Jede Fähigkeit ist einmal pro Questrunde nutzbar.</p><div class="hero-preview__abilities"></div><div class="hero-preview__description" id="quiz-ability-description" hidden><p class="hero-preview__description-title"></p><p class="hero-preview__description-text"></p><button type="button" class="btn" data-use>Jetzt einsetzen</button></div><p class="hero-abilities__status" data-status role="status" aria-live="polite"></p></div>';
        document.body.append(dialog);
        view = { dialog, trigger, portrait, count, status, selected: null, options, questionId: null };views.set(bar, view);
        const close = () => { if (!view.options.busy) closeDialog(dialog); };
        dialog.querySelector('.modal__close-button').addEventListener('click', close);
        dialog.addEventListener('click', event => { if (event.target === dialog) close(); });
        dialog.addEventListener('cancel', event => { if (view.options.busy) event.preventDefault(); });
        dialog.addEventListener('close', () => { if (!dialog.open) { trigger.setAttribute('aria-expanded', 'false');view.status.hidden = !view.options.message; } });
        trigger.addEventListener('click', () => { if (!view.options.busy) { update(view);openDialog(dialog);trigger.setAttribute('aria-expanded', 'true');view.status.hidden = true; } });
        dialog.querySelector('[data-use]').addEventListener('click', async () => {
            const { selected, options: current } = view;
            if (!selected || current.busy || current.used?.[selected]) return;
            if (!abilityDialogItems(current).some(a => a.id === selected)) return;
            await current.onUse(selected);
            if (view.options.used?.[selected]) { closeDialog(dialog);view.selected = null; }
        });
    }
    view.options = options;
    if (view.questionId !== options.question?.id) { view.questionId = options.question?.id;view.selected = null; }
    if (options.pendingId) view.selected = options.pendingId;
    const items = abilityDialogItems(options), ready = items.filter(a => !options.used?.[a.id]).length;
    const showEntry = ready > 0 || Boolean(options.pendingId);
    bar.hidden = !showEntry && !options.message;
    view.trigger.hidden = !showEntry;view.trigger.disabled = Boolean(options.busy);
    view.count.textContent = options.pendingId ? '· Einsatz prüfen' : `· ${ready} ${ready === 1 ? 'Fähigkeit' : 'Fähigkeiten'} bereit`;
    view.trigger.setAttribute('aria-label', options.pendingId ? 'Heldenfähigkeiten: Einsatz prüfen' : `Heldenfähigkeiten öffnen: ${ready} bereit`);
    view.dialog.querySelector('[data-ability-count]').textContent = `${ready} ${ready === 1 ? 'Heldenfähigkeit' : 'Heldenfähigkeiten'} verfügbar`;
    const hero = options.hero || {};
    view.portrait.src = normalizeAvatarUrl(hero.url || 'images/website/avatar/quizo.png');
    view.dialog.querySelector('header img').src = view.portrait.src;
    view.dialog.querySelector('[data-hero-name]').textContent = hero.label || 'Dein Held';
    view.status.textContent = options.message || '';view.status.hidden = !options.message || view.dialog.open;
    if (!options.abilities?.length && view.dialog.open) closeDialog(view.dialog);
    update(view);
}

function update(view) {
    const { dialog, options, selected } = view;
    const items = abilityDialogItems(options), list = dialog.querySelector('.hero-preview__abilities');list.replaceChildren();
    const selectedAbility = items.find(a => a.id === selected && !options.used?.[a.id]);
    for (const ability of items) {
        const used = Boolean(options.used?.[ability.id]);
        const card = el('button', 'hero-preview__ability' + (used ? ' hero-abilities__spent' : ''));card.type = 'button';card.disabled = used || Boolean(options.busy);card.dataset.abilityId = ability.id;
        card.setAttribute('aria-expanded', String(ability.id === selected && !used));card.setAttribute('aria-controls', 'quiz-ability-description');
        card.setAttribute('aria-label', used ? `${ability.title}: eingesetzt` : ability.title);
        if (ability.image) { const image = el('img');image.src = normalizeAvatarUrl(ability.image);image.alt = '';image.width = 40;image.height = 40;card.append(image); }
        else { const symbol = el('span', '', abilitySymbols[ability.effect] || '✦');symbol.setAttribute('aria-hidden', 'true');card.append(symbol); }
        card.append(el('span', '', ability.title));
        card.addEventListener('click', () => { view.selected = view.selected === ability.id ? null : ability.id;update(view);Array.from(list.children).find(node => node.dataset.abilityId === ability.id)?.focus(); });list.append(card);
    }
    const description = dialog.querySelector('.hero-preview__description');description.hidden = !selectedAbility;
    if (selectedAbility) {
        description.querySelector('.hero-preview__description-title').textContent = `${selectedAbility.title} · Deine Fähigkeit`;
        description.querySelector('.hero-preview__description-text').textContent = selectedAbility.description;
    }
    const activate = dialog.querySelector('[data-use]');activate.textContent = options.pendingId ? 'Einsatz erneut prüfen' : 'Jetzt einsetzen';activate.disabled = Boolean(options.busy) || !selectedAbility;
    dialog.querySelector('.modal__close-button').disabled = Boolean(options.busy);
    dialog.querySelector('[data-status]').textContent = options.message || (!items.length ? 'Gerade keine Fähigkeit einsetzbar.' : '');
}
