export function createMediaLoading(panel, loading) {
    const nearby = new Set();
    const observed = new Set();
    let finish = null;
    const update = () => {
        for (const img of nearby) if (!img.isConnected || img.complete || img.closest('.u-hidden, [hidden]')) nearby.delete(img);
        const pending = !panel.closest('.u-hidden') && nearby.size > 0;
        if (pending && !finish) finish = loading.begin('Bilder werden geladen …');
        else if (!pending && finish) { finish(); finish = null; }
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
}
