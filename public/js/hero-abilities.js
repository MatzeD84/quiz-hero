import { createLoadingStatus } from './admin/loading-status.js?v=dev';

export const abilitySymbols = { eliminate: '◈', shield: '◇', swap: '↻', focus: '◎', lucky: '⚓' };

export function renderAbilityUnlock(card, awards = [], heroName = 'Dein Held') {
    card.querySelector('.hero-abilities__reward')?.remove();
    if (!awards.length) return;
    const notice = document.createElement('section');notice.className = 'souvenir-unlock hero-abilities__reward';notice.setAttribute('role', 'status');
    const count=({1:'eine',2:'zwei',3:'drei'})[awards.length]||String(awards.length);
    const heading = document.createElement('h3');heading.className = 'souvenir-unlock__heading';heading.textContent = `${heroName||'Dein Held'} hat ${count} neue ${awards.length===1?'Heldenfähigkeit':'Heldenfähigkeiten'} erlernt`;notice.append(heading);
    const list = document.createElement('ul');list.className = 'souvenir-unlock__list';
    for (const award of awards) {
        const row = document.createElement('li');row.className = 'souvenir-unlock__item';
        if (award.image) {
            try {
                const url = new URL(award.image, location.href);
                if (url.origin === location.origin && url.pathname.startsWith('/images/')) {
                    const image = document.createElement('img');image.className = 'souvenir-unlock__image';image.src = url.href;image.alt = '';image.width = 112;image.height = 112;image.loading = 'lazy';image.addEventListener('error', () => image.remove(), { once: true });row.append(image);
                }
            } catch { /* Text remains available when a legacy image path is invalid. */ }
        }
        const body = document.createElement('div');body.className = 'souvenir-unlock__body';
        const title = document.createElement('strong');title.className = 'souvenir-unlock__title souvenir__eyebrow hero-abilities__label';title.textContent = award.title;body.append(title);
        if (award.description) { const text = document.createElement('p');text.textContent = award.description;body.append(text); }
        row.append(body);list.append(row);
    }
    notice.append(list);
    const anchor = card.querySelector('[data-result-share]') || card.querySelector('.result-summary__actions');
    if (anchor) anchor.before(notice);else card.append(notice);
}

export function abilityUseReason(ability, question, attempts, used) {
    if (!ability) return 'Keine Fähigkeit für diese Runde verfügbar.';
    if (used) return 'Fähigkeit in dieser Runde eingesetzt.';
    if (!question || question.answeredCorrectly || question.skipped || attempts >= 2) return 'Bei der nächsten Frage wieder verfügbar.';
    if(question.abilityExclusive||(['focus','lucky'].includes(ability.effect)&&question.abilityApplied))return 'An dieser Frage wurde bereits eine andere Hilfe eingesetzt.';
    if(ability.effect==='focus')return attempts===0&&question.answers?.length===4?'':'Nur vor der ersten Antwort bei vier Möglichkeiten einsetzbar.';
    if (ability.effect === 'swap') {
        if (attempts !== 0) return 'Nur vor der ersten Antwort einsetzbar.';
        if (ability.swapAvailableIds && !ability.swapAvailableIds.includes(question.id)) return 'Keine passende Ersatzfrage verfügbar; dein Einsatz bleibt erhalten.';
        return '';
    }
    return attempts === 1 ? '' : 'Nach dem ersten Fehlversuch einsetzbar.';
}

export function createAbilityProfile({ service, anchor }) {
    const loading = createLoadingStatus();
    const root = document.createElement('details');root.className = 'account-security';root.id = 'abilities';
    const heading = document.createElement('summary');heading.className = 'account-security__toggle';heading.textContent = 'Heldenfähigkeiten';
    const content = document.createElement('div');content.className = 'hero-abilities';
    root.append(heading, content);anchor.after(root);
    let generation = 0;
    async function render(user) {
        const request = ++generation;root.hidden = !user;if (!user) { content.replaceChildren();return; }
        content.textContent = 'Fähigkeiten werden geladen …';
        try {
            const data = await loading.track('Heldenfähigkeiten werden geladen …', () => service.abilities());if (request !== generation) return;
            content.replaceChildren();
            const intro = document.createElement('p');intro.textContent = 'Dein Held kann bis zu drei Fähigkeiten erlernen. Jede freigeschaltete Fähigkeit steht im Quiz automatisch einmal pro Runde bereit. Ab fünf Fragen; Fragewechsel nicht in Übungsrunden.';content.append(intro);
            const status = document.createElement('p');status.setAttribute('role', 'status');content.append(status);
            const grid = document.createElement('div');grid.className = 'hero-abilities__grid';content.append(grid);
            for (const ability of data.items) {
                const card = document.createElement('article');card.className = 'hero-abilities__card';card.classList.toggle('hero-abilities__card--learned', ability.unlocked);
                const title = document.createElement('h3');title.textContent = `${abilitySymbols[ability.effect]} ${ability.title}`;
                const description = document.createElement('p');description.textContent = ability.description;
                const state = document.createElement('p');state.textContent = `${ability.scope === 'global' ? 'Für alle Helden' : 'An diesen Helden gebunden'} · ${ability.unlocked ? 'Erlernt – automatisch einmal je Runde nutzbar' : `${ability.current} von ${ability.target} Runden mit mindestens fünf beantworteten Fragen`}`;
                card.append(title, description, state);grid.append(card);
                if (!ability.unlocked) { const progress = document.createElement('progress');progress.max = ability.target;progress.value = ability.current;progress.setAttribute('aria-label', `Lernfortschritt ${ability.title}`);card.append(progress); }
            }
            if (!data.items.length) { const empty = document.createElement('p');empty.textContent = 'Für diesen Helden sind noch keine Fähigkeiten vorgesehen.';content.append(empty); }
        } catch (error) { if (request === generation) { content.textContent = error.message;const retry = document.createElement('button');retry.type = 'button';retry.className = 'account-action-link';retry.textContent = 'Erneut laden';retry.addEventListener('click', () => render(user));content.append(retry); } }
    }
    if (location.hash === '#abilities') root.open = true;
    return { render };
}
