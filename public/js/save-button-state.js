/** Keep record-save actions disabled until values change; preserve independent busy locks. */
export function createSaveButtonState(form, { isChanged, isBlocked = () => false }) {
    const blocked = () => isBlocked() || Boolean(form.closest?.('[inert], [aria-busy="true"]'));
    const update = () => {
        const disabled = !isChanged() || blocked();
        for (const button of form.querySelectorAll?.('button[type="submit"], button:not([type]), input[type="submit"]') || []) {
            if (button.disabled !== disabled) button.disabled = disabled;
        }
    };
    form.addEventListener('input', update);
    form.addEventListener('change', update);
    form.addEventListener('reset', () => queueMicrotask(update));
    form.addEventListener('submit', event => {
        if (!isChanged() || blocked()) {
            event.preventDefault();event.stopImmediatePropagation();update();
        }
    }, true);
    // Some existing busy handlers restore every button. Reconcile without enabling
    // unchanged forms or touching non-save actions such as cancel and delete.
    if (typeof MutationObserver !== 'undefined') {
        const observer = new MutationObserver(update);
        observer.observe(form, { attributes: true, subtree: true, childList: true, attributeFilter: ['disabled', 'inert', 'aria-busy'] });
        for (let parent = form.parentElement; parent; parent = parent.parentElement) {
            observer.observe(parent, { attributes: true, attributeFilter: ['inert', 'aria-busy'] });
        }
    }
    update();
    return { update };
}
