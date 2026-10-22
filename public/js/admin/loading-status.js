// One viewport notice for concurrent dataset requests and visible image loads.
export function createLoadingStatus(root = document.body) {
    const notice = document.createElement('div');
    notice.className = 'admin-media-loading';
    notice.setAttribute('role', 'status');
    notice.setAttribute('aria-live', 'polite');
    notice.hidden = true;
    const spinner = document.createElement('span');
    spinner.className = 'admin-media-loading__spinner';
    spinner.setAttribute('aria-hidden', 'true');
    const label = document.createElement('span');
    notice.append(spinner, label);
    root.append(notice);
    const pending = new Map();
    function update() {
        const messages = [...new Set(pending.values())];
        label.textContent = messages.length > 1 ? 'Daten werden geladen …' : messages[0] || '';
        notice.hidden = pending.size === 0;
    }
    function begin(message = 'Daten werden geladen …') {
        const key = Symbol();
        pending.set(key, message); update();
        return () => { pending.delete(key); update(); };
    }
    return {
        begin,
        async track(message, action) {
            const finish = begin(message);
            try { return await action(); }
            finally { finish(); }
        }
    };
}
