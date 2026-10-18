import { loadHeroAvatars } from './config.js?v=dev';
import { UserService, ACCOUNT_REMOVED_MESSAGE, SESSION_EXPIRED_MESSAGE } from './user-service.js?v=dev';
import { applyAccountHeaderLogo } from './account-logo.js?v=dev';
import { initFooter } from './footer.js?v=dev';
import { renderPassport, renderPassportLoading, renderPassportError } from './passport.js?v=dev';

const root = document.querySelector('#js-account-journey');
const content = document.querySelector('#js-passport-content');
const loggedOut = document.querySelector('#js-passport-logged-out');
const status = document.querySelector('#js-passport-status');
const service = new UserService();
let currentUser = null;
let requestId = 0;
const hadStoredUser = Boolean(service.getStoredUser()?.id);
initFooter();

function showUser(user) {
    currentUser = user;
    content.classList.toggle('u-hidden', !user?.id);
    loggedOut.classList.toggle('u-hidden', Boolean(user?.id));
    if (!user?.id) root.replaceChildren();
    applyAccountHeaderLogo(user);
}
async function loadJourney() {
    if (!currentUser?.id) return;
    const request = ++requestId;
    renderPassportLoading(root);
    try {
        const data = await service.getJourney();
        if (request === requestId && currentUser) renderPassport(root, data, currentUser);
    } catch (error) {
        if (request !== requestId) return;
        if ([ACCOUNT_REMOVED_MESSAGE, SESSION_EXPIRED_MESSAGE].includes(error.message)) {
            showUser(null); status.textContent = error.message;
        } else renderPassportError(root, loadJourney);
    }
}
async function init() {
    status.textContent = 'Deine Anmeldung wird geprüft …';
    await loadHeroAvatars();
    showUser(await service.getCurrentUser(service.getStoredUser()));
    status.textContent = '';
    await loadJourney();
}
init().catch(error => {
    showUser(null);
    if (error.message === SESSION_EXPIRED_MESSAGE && !hadStoredUser) {
        status.textContent = '';
        return;
    }
    status.textContent = [ACCOUNT_REMOVED_MESSAGE, SESSION_EXPIRED_MESSAGE].includes(error.message)
        ? error.message : 'Deine Anmeldung konnte gerade nicht geprüft werden. Bitte lade die Seite erneut.';
});
