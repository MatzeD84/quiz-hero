export function createMediaLoading(panel) {
    const notice = document.createElement('div');
    notice.className = 'admin-media-loading';
    notice.setAttribute('role', 'status');
    notice.setAttribute('aria-live', 'polite');
    notice.hidden = true;
    notice.innerHTML = '<span class="admin-media-loading__spinner" aria-hidden="true"></span><span>Bilder werden geladen …</span>';
    document.body.append(notice);
    const nearby = new Set();
    const observed = new Set();
    let requests = 0;
    const update = () => {
        for (const img of nearby) if (!img.isConnected || img.complete) nearby.delete(img);
        notice.hidden = Boolean(panel.closest('.u-hidden')) || (requests === 0 && nearby.size === 0);
    };
    const intersection = new IntersectionObserver(entries => {
        for (const { target, isIntersecting } of entries) {
            if (isIntersecting && !target.complete) nearby.add(target);
            else nearby.delete(target);
        }
        update();
    }, { rootMargin: '200px' });
    const scan = () => {
        for (const img of observed) {
            if (!panel.contains(img)) { intersection.unobserve(img); observed.delete(img); nearby.delete(img); }
        }
        panel.querySelectorAll('img').forEach(img => {
            if (!observed.has(img)) {
                observed.add(img);
                intersection.observe(img);
                const settled = () => { nearby.delete(img); update(); };
                img.addEventListener('load', settled);
                img.addEventListener('error', settled);
            }
        });
        update();
    };
    new MutationObserver(scan).observe(panel, { childList: true, subtree: true, attributes: true, attributeFilter: ['src', 'class'] });
    new MutationObserver(update).observe(panel.parentElement, { attributes: true, attributeFilter: ['class'] });
    scan();
    return { begin() { requests++; update(); }, end() { requests = Math.max(0, requests - 1); scan(); } };
}
