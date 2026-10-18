const dateFormat = new Intl.DateTimeFormat('de-DE', { day: 'numeric', month: 'short', year: 'numeric' });
export function passportDate(value) {
    const date = new Date(value);
    return value && Number.isFinite(date.getTime()) ? dateFormat.format(date) : 'Datum unbekannt';
}
export function selectionUrl(selection) {
    if (!selection?.available || !selection.id || !['category', 'tag'].includes(selection.kind)) return null;
    return `index.html?${new URLSearchParams({ [selection.kind]: selection.id })}`;
}
export function difficultySuccessCards(stats = {}) {
    return ['easy', 'medium', 'hero'].map((key, index) => {
        const value = stats[key]?.percent;
        const percent = Number.isFinite(value) ? `${Math.max(0, Math.min(100, value))} %` : '–';
        const total = Math.max(0, Math.trunc(Number(stats[key]?.total) || 0));
        return { key, label: ['Normal', 'Schwer', 'Hero'][index], percent, count: `${total} ${total === 1 ? 'Frage' : 'Fragen'}` };
    });
}
export function buildPassportModel(data) {
    const selections = [...data.selections].sort((a, b) => (b.lastPlayed || '').localeCompare(a.lastPlayed || '') || a.title.localeCompare(b.title, 'de'));
    const available = selections.filter(item => selectionUrl(item));
    return {
        summary: data.summary,
        stations: available.filter(item => item.kind === 'category' || item.rounds > 0)
            .sort((a, b) => b.rounds - a.rounds || a.title.localeCompare(b.title, 'de')),
        next: available.find(item => item.rounds > 0) || available[0] || null,
        discover: available.find(item => item.rounds === 0 && item.kind === 'category') || null
    };
}
const element = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
};
function image(selection, className) {
    if (!selection.image) return null;
    // Only app-local artwork; never embed remote tracking images in the private passport.
    let url;
    try { url = new URL(selection.image, location.href); } catch { return null; }
    if (url.origin !== location.origin || !url.pathname.startsWith('/images/')) return null;
    const img = element('img', className);
    img.src = url.href; img.alt = ''; img.loading = 'lazy'; img.width = 1536; img.height = 1024;
    img.addEventListener('error', () => img.remove(), { once: true });
    return img;
}
function playLink(selection, text, className = 'passport__link') {
    const url = selectionUrl(selection);
    if (!url) return element('span', 'passport__muted', 'Aktuell nicht spielbar');
    const link = element('a', className, text); link.href = url; return link;
}
export function renderPassportLoading(root) {
    root.replaceChildren(element('p', 'passport__muted', 'Dein Reisepass wird geladen …'));
}
export function renderPassportError(root, retry) {
    const section = element('section', 'passport__empty');
    const message = element('p', 'passport__text', 'Dein Reisepass konnte gerade nicht geladen werden. Deine gespeicherten Ergebnisse bleiben erhalten.');
    message.setAttribute('role', 'status');
    const button = element('button', 'passport__link', 'Erneut versuchen'); button.type = 'button'; button.addEventListener('click', retry);
    section.append(message, button); root.replaceChildren(section);
}
export function renderPassport(root, data, user) {
    const model = buildPassportModel(data);
    const welcome = element('section', 'passport__welcome');
    const intro = element('div', 'passport__intro');
    intro.append(element('p', 'passport__eyebrow', 'DEINE REISE DURCH DAS WISSEN'), element('h2', 'passport__greeting', `Hallo, ${user.username || user.name || 'Quiz-Hero'}!`), element('p', 'passport__text', model.summary.rounds ? 'Deine bisherigen Reisen. Dein nächstes Abenteuer.' : 'Dein Reisepass wartet auf sein erstes Abenteuer. Wohin zieht es dich?'));
    const stamp = element('div', 'passport__stamp'); stamp.setAttribute('aria-hidden', 'true'); stamp.append(element('span', '', 'QUIZ-HERO'), element('strong', '', 'REISEPASS'), element('span', '', 'NEUGIER IM GEPÄCK'));
    welcome.append(intro, stamp);
    const stats = element('dl', 'passport__stats');
    for (const [value, label] of [[model.summary.rounds, 'Runden beendet'], [model.summary.categories, 'Kategorien entdeckt'], [model.summary.topics, 'Themen entdeckt']]) {
        const stat = element('div', 'passport__stat'); stat.append(element('dt', '', label), element('dd', '', String(value))); stats.append(stat);
    }
    root.replaceChildren(welcome, stats);
    const success = element('section', 'passport__difficulty');
    success.setAttribute('aria-label', 'Deine Erfolgsquote nach Schwierigkeit');
    success.append(element('h2', 'passport__station-title', 'Deine Erfolgsquote'));
    const difficultyCards = element('div', 'passport__difficulty-grid');
    for (const item of difficultySuccessCards(data.difficultyStats)) {
        const card = element('div', `passport__difficulty-card passport__difficulty-card--${item.key}`);
        card.append(element('h3', 'passport__difficulty-label', item.label), element('strong', 'passport__difficulty-value', item.percent), element('span', 'passport__difficulty-count', item.count));
        difficultyCards.append(card);
    }
    success.append(difficultyCards, element('p', 'passport__muted', 'Normal: einfache Fragen · Schwer: knifflige Fragen · Hero: besonders schwere Fragen'));
    success.title = 'Richtig gelöste Fragen aus beendeten Runden mit gespeichertem Schwierigkeitsgrad. Beide Versuche zählen, Wiederholungen zählen mit. Ältere Runden ohne diese Daten bleiben unberücksichtigt.';
    if (model.next) {
        const adventure = element('section', 'passport__adventure');
        const artwork = image(model.next, 'passport__adventure-image'); if (artwork) adventure.append(artwork);
        const content = element('div', 'passport__adventure-body');
        content.append(element('p', 'passport__eyebrow', 'DEIN NÄCHSTES ABENTEUER'), element('h2', 'passport__heading', model.next.title), element('p', 'passport__text', model.next.rounds ? 'Zuletzt gespielt – bereit für eine neue Runde?' : 'Starte deine erste Runde und fülle deinen Reisepass mit Erlebnissen.'), playLink(model.next, 'Neue Runde starten', 'btn passport__play'));
        if (model.discover && model.discover !== model.next) content.append(playLink(model.discover, `Oder entdecke ${model.discover.title}`));
        adventure.append(content); root.append(adventure);
    }
    root.append(success);
    const practice = element('section', 'passport__practice');
    practice.append(element('h2', 'passport__heading', 'Diese Fragen übe ich noch'));
    const practiceSelections = data.practice || [];
    practice.append(element('p', 'passport__muted', practiceSelections.length
        ? 'Gib kniffligen Fragen eine zweite Chance. Sobald du sie löst, verschwinden sie hier wieder.'
        : 'Hier sammeln sich künftig Fragen, die noch nicht geklappt haben. Aktuell ist keine zum Üben offen.'));
    if (practiceSelections.length) {
        const links = element('div', 'passport__practice-links');
        for (const selection of practiceSelections) {
            const count = selection.count;
            const link = element('a', 'passport__practice-link');
            link.href = `index.html?${new URLSearchParams({ category: selection.id, practice: '1' })}`;
            const category = data.selections.find(item => item.kind === 'category' && item.id === selection.id);
            const artwork = image(category || {}, 'passport__practice-image');
            if (artwork) link.append(artwork);
            const details = element('span', 'passport__practice-details');
            details.append(element('span', 'passport__station-title', selection.title), element('span', 'passport__muted', `${count} ${count === 1 ? 'Frage wartet' : 'Fragen warten'} auf dich`));
            link.append(details, element('span', 'passport__practice-action', 'Üben →'));
            links.append(link);
        }
        practice.append(links, element('p', 'passport__muted', 'Pro Runde bis zu 10 Fragen, jedes Mal neu gemischt.'));
    }
    const stations = element('section', 'passport__section');
    stations.append(element('h2', 'passport__heading', 'Deine Quiz-Reisen'), element('p', 'passport__muted', 'Bekannte Orte, neue Abenteuer. Wohin zieht es dich?'));
    const grid = element('div', 'passport__grid');
    for (const selection of model.stations) {
        const card = element('article', 'passport__station');
        const artwork = image(selection, 'passport__station-image'); if (artwork) card.append(artwork);
        const body = element('div', 'passport__station-body');
        body.append(element('p', 'passport__eyebrow', selection.kind === 'tag' ? 'THEMA' : 'KATEGORIE'), element('h3', 'passport__station-title', selection.title), element('p', 'passport__text', selection.rounds ? `${selection.rounds} ${selection.rounds === 1 ? 'Runde beendet' : 'Runden beendet'}` : 'Dein nächstes Ziel?'));
        if (selection.lastPlayed) body.append(element('p', 'passport__muted', `Zuletzt am ${passportDate(selection.lastPlayed)}`));
        body.append(playLink(selection, selection.rounds ? 'Neu entdecken' : 'Quiz entdecken')); card.append(body); grid.append(card);
    }
    if (!model.stations.length) grid.append(element('p', 'passport__text', 'Gerade sind keine Quizziele verfügbar. Schau bald wieder vorbei.'));
    stations.append(grid); root.append(stations);
    root.append(practice);
}
