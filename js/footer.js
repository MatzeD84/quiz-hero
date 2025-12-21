export function initFooter() {
    const footerYear = document.querySelector('.js-footer-year');
    if (footerYear) {
        footerYear.textContent = new Date().getFullYear();
    }

    initFooterModal();
}

function initFooterModal() {
    const modal = document.querySelector('#js-footer-modal');
    const modalContent = document.querySelector('#js-footer-modal-content');
    const closeButton = document.querySelector('#js-footer-modal-close');
    const links = Array.from(document.querySelectorAll('.js-footer-modal-link'));
    const contentCache = new Map();

    if (!modal || !modalContent || !closeButton || links.length === 0) {
        return;
    }

    const closeModal = () => {
        modal.classList.add('hide');
        modalContent.innerHTML = '';
    };

    const openModal = async url => {
        if (!url) {
            return;
        }
        if (contentCache.has(url)) {
            modalContent.innerHTML = contentCache.get(url);
            modal.classList.remove('hide');
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
            modal.classList.remove('hide');
        } catch (error) {
            modalContent.innerHTML = '<p>Inhalt konnte nicht geladen werden.</p>';
            modal.classList.remove('hide');
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
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
            closeModal();
        }
    });
    modal.addEventListener('click', event => {
        if (event.target === modal) {
            closeModal();
        }
    });
}
