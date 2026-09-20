// Native modal dialogs provide focus containment and make the background inert.
const initialized = new WeakSet();
export function openDialog(dialog) {
    if (!dialog || dialog.open) return;
    const opener = document.activeElement;
    if (!initialized.has(dialog)) {
        dialog.addEventListener('close', () => { if (!dialog.open) dialog.classList.add('u-hidden'); });
        initialized.add(dialog);
    }
    const heading = dialog.querySelector('h1, h2, h3');
    if (heading) {
        heading.id ||= `${dialog.id}-title`;
        heading.tabIndex = -1;
        dialog.setAttribute('aria-labelledby', heading.id);
    } else if (!dialog.hasAttribute('aria-label')) {
        dialog.setAttribute('aria-label', 'Information');
    }
    dialog.addEventListener('close', () => {
        if (opener?.isConnected && !opener.closest('.u-hidden')) opener.focus();
        else document.querySelector('main h1, h1')?.focus();
    }, { once: true });
    dialog.classList.remove('u-hidden');
    dialog.showModal();
    (heading || dialog.querySelector('button, a, input'))?.focus();
}

export function closeDialog(dialog) {
    if (dialog?.open) dialog.close();
}
