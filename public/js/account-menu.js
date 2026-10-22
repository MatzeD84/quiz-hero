// Shared disclosure navigation. Account access remains protected by the session/API.
const menus = new WeakMap();
export function accountMenuLinks(user) {
    return user?.id
        ? [{ label: 'Mein Konto', href: 'account.html' }, { label: 'Reisepass', href: 'reisepass.html' }, { label: 'Souvenirs', href: 'souvenirs.html' }]
        : [{ label: 'Login', href: 'login.html' }, { label: 'Registrieren', href: 'login.html?view=register' }];
}
export function closeAccountMenus() {
    document.querySelectorAll('.site-account-nav').forEach(root => menus.get(root)?.close());
}
export function placeAccountMenu() {
    const header = document.querySelector('.main-section:not(.u-hidden) > .main-header')
        || document.querySelector('.question-count:not(.u-hidden) > .question-count__header')
        || document.querySelector('.container > .main-header');
    if (!header) return;
    document.querySelectorAll('.site-account-nav').forEach(root => {
        if (root.parentElement !== header) { menus.get(root)?.close(); header.append(root); }
    });
}
function menuIcon(href) {
    const paths = {
        'account.html': 'M20 21v-2a6 6 0 0 0-6-6h-4a6 6 0 0 0-6 6v2M16 6a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
        'reisepass.html': 'M5 3h14v18H5zM5 17h14M15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0M12 7v6M9 10h6',
        'souvenirs.html': 'M8 3h8l-1 6H9zM12 9a6 6 0 1 0 0 12 6 6 0 0 0 0-12M12 12v6M9 15h6',
        'login.html': 'M14 3h6v18h-6M3 12h12M10 7l5 5-5 5',
        'login.html?view=register': 'M14 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0M2 21v-2a6 6 0 0 1 6-6h4M19 14v8M15 18h8'
    };
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24'); svg.setAttribute('aria-hidden', 'true');
    svg.classList.add('site-account-nav__item-icon');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', paths[href] || paths['reisepass.html']); svg.append(path); return svg;
}
function initMenu(root, index) {
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'site-account-nav__toggle';
    button.setAttribute('aria-label', 'Kontomenü öffnen'); button.setAttribute('aria-expanded', 'false');
    const id = `js-account-menu-${index}`;
    button.setAttribute('aria-controls', id);
    button.innerHTML = '<svg class="site-account-nav__icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg>';
    const panel = document.createElement('div'); panel.id = id; panel.className = 'site-account-nav__panel'; panel.hidden = true;
    const backdrop = document.createElement('div');
    backdrop.className = 'site-account-nav__backdrop'; backdrop.hidden = true; backdrop.setAttribute('aria-hidden', 'true');
    root.replaceChildren(backdrop, button, panel);
    const close = (restoreFocus = false) => {
        panel.hidden = true; backdrop.hidden = true;
        button.setAttribute('aria-expanded', 'false'); button.setAttribute('aria-label', 'Kontomenü öffnen');
        if (restoreFocus) button.focus();
    };
    button.addEventListener('click', () => {
        const opening = panel.hidden;
        closeAccountMenus();
        panel.hidden = !opening; backdrop.hidden = !opening;
        button.setAttribute('aria-expanded', String(opening));
        button.setAttribute('aria-label', opening ? 'Kontomenü schließen' : 'Kontomenü öffnen');
    });
    backdrop.addEventListener('click', () => close(true));
    root.addEventListener('keydown', event => {
        if (event.key === 'Escape' && !panel.hidden) { event.preventDefault(); close(true); }
    });
    document.addEventListener('pointerdown', event => { if (!root.contains(event.target)) close(); });
    document.addEventListener('focusin', event => { if (!root.contains(event.target)) close(); });
    const menu = { panel, close, state: null }; menus.set(root, menu); return menu;
}
export function renderAccountMenu(user) {
    document.querySelectorAll('.site-account-nav').forEach((root, index) => {
        const menu = menus.get(root) || initMenu(root, index);
        const state = Boolean(user?.id);
        if (state === menu.state) return;
        menu.state = state; menu.close();
        const links = accountMenuLinks(user).map(entry => {
            const link = document.createElement('a'); link.className = 'site-account-nav__item';
            link.href = entry.href;
            const label = document.createElement('span'); label.textContent = entry.label;
            link.append(menuIcon(entry.href), label);
            link.addEventListener('click', () => {
                menu.close();

            });
            return link;
        });
        menu.panel.replaceChildren(...links);
    });
    placeAccountMenu();
}

if (typeof document !== 'undefined') renderAccountMenu(null);
