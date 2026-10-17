import { openDialog, closeDialog } from './dialog.js?v=dev';
export function initFooter() {
    const footerYear = document.querySelector('.js-footer-year');
    if (footerYear) {
        footerYear.textContent = new Date().getFullYear();
    }

    initFooterModal();
}

function initFooterModal() {
    let modal = document.querySelector('#js-footer-modal');
    // Existing generated pages can remain live until the next SEO build.
    if (modal && modal.tagName !== 'DIALOG') {
        const dialog = document.createElement('dialog');
        for (const attribute of modal.attributes) dialog.setAttribute(attribute.name, attribute.value);
        dialog.append(...modal.childNodes);
        modal.replaceWith(dialog);
        modal = dialog;
    }
    const modalContent = document.querySelector('#js-footer-modal-content');
    const closeButton = document.querySelector('#js-footer-modal-close');
    const links = Array.from(document.querySelectorAll('.js-footer-modal-link'));
    const contentCache = new Map();

    if (!modal || !modalContent || !closeButton || links.length === 0) {
        return;
    }

    const closeModal = () => {
        closeDialog(modal);
        modalContent.innerHTML = '';
    };

    const openModal = async url => {
        if (!url) {
            return;
        }
        if (contentCache.has(url)) {
            modalContent.innerHTML = contentCache.get(url);
            openDialog(modal);
            return;
        }
        try {
            const response = await fetch(url, { cache: 'no-store' });
            if (!response.ok) {
                throw new Error(`Request failed: ${response.status}`);
            }
            const html = await response.text();
            contentCache.set(url, html);
            modalContent.innerHTML = html;
            openDialog(modal);
        } catch (error) {
            modalContent.innerHTML = '<p>Inhalt konnte nicht geladen werden.</p>';
            openDialog(modal);
            console.error(error);
        }
    };

    links.forEach(link => {
        link.addEventListener('click', async event => {
            event.preventDefault();
            const url = link.dataset.footerModalUrl;
            await openModal(url);
        });
    });

    closeButton.addEventListener('click', closeModal);
    modal.addEventListener('click', event => {
        if (event.target === modal) {
            closeModal();
        }
    });
}
