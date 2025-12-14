export function initFooter() {
    const footerYear = document.querySelector('.js-footer-year');
    if (footerYear) {
        footerYear.textContent = new Date().getFullYear();
    }
}
