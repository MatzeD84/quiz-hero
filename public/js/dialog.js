import { showSaveNotice } from './save-notice.js?v=dev';
// Native modal dialogs provide focus containment and make the background inert.
const initialized = new WeakSet();
// One icon source for every standard modal, including dynamically created dialogs.
const closeIcon = '<svg class="icon-button__icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m12 10.93 5.719-5.72a.75.75 0 0 1 1.062 1.062L13.06 12l5.72 5.719a.75.75 0 0 1-1.062 1.062L12 13.06l-5.719 5.72a.75.75 0 0 1-1.062-1.062L10.94 12l-5.72-5.719a.75.75 0 0 1 1.062-1.062z"/></svg>';
export function openDialog(dialog) {
    if (!dialog || dialog.open) return;
    const opener = document.activeElement;
    if (!initialized.has(dialog)) {
        for (const button of dialog.querySelectorAll('.modal__close-button')) {
            button.innerHTML = closeIcon;
            button.classList.add('icon-button');
            if (!button.hasAttribute('aria-label') && !button.hasAttribute('aria-labelledby')) button.setAttribute('aria-label', 'Dialog schließen');
        }
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

/** Call only after the server has confirmed the write. Errors stay in the dialog. */
export function completeDialogSave(dialog,message='Daten gespeichert.') {
    closeDialog(dialog);showSaveNotice(message);
}
