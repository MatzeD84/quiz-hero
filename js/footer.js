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

    if (!modal || !modalContent || !closeButton || links.length === 0) {
        return;
    }

    const closeModal = () => {
        modal.classList.add('hide');
        modalContent.innerHTML = '';
    };

    const openModal = key => {
        const template = document.querySelector(`#footer-modal-${key}`);
        if (!template) {
            return;
        }
        modalContent.innerHTML = template.innerHTML;
        modal.classList.remove('hide');
    };

    links.forEach(link => {
        link.addEventListener('click', event => {
            event.preventDefault();
            const key = link.dataset.footerModal;
            if (key) {
                openModal(key);
            }
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
