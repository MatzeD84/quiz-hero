import { openDialog, closeDialog } from './dialog.js?v=dev';
import { HERO_AVATARS, loadHeroAvatars } from './config.js?v=dev';
import { ACCOUNT_REMOVED_MESSAGE, SESSION_EXPIRED_MESSAGE, UserService } from './user-service.js?v=dev';
import { applyAccountHeaderLogo } from './account-logo.js?v=dev';
import { initFooter } from './footer.js?v=dev';
import { revealStatus } from './status-navigation.js?v=dev';

const elements = {
    loggedOut: document.querySelector('#js-account-page-logged-out'),
    content: document.querySelector('#js-account-page-content'),
    form: document.querySelector('#js-account-page-form'),
    username: document.querySelector('#js-account-page-username'),
    password: document.querySelector('#js-account-page-password'),
    currentPassword: document.querySelector('#js-account-page-current-password'),
    profileName: document.querySelector('#js-account-profile-name'),
    profileEmail: document.querySelector('#js-account-profile-email'),
    avatarImage: document.querySelector('#js-account-avatar-image'),
    avatarOpen: document.querySelector('#js-account-avatar-open'),
    avatarModal: document.querySelector('#js-account-avatar-modal'),
    avatarModalClose: document.querySelector('#js-account-avatar-close'),
    avatarModalContent: document.querySelector('#js-account-avatar-modal-content'),
    logout: document.querySelector('#js-account-page-logout'),
    deleteAccount: document.querySelector('#js-account-page-delete'),
    status: document.querySelector('#js-account-page-status')
};

const userService = new UserService();
let currentUser = userService.getStoredUser();

initFooter();

const setStatus = (message, type = 'info') => {
    if (!elements.status) return;
    elements.status.textContent = message || '';
    elements.status.dataset.status = message ? type : '';
    revealStatus(elements.status);
};

const render = () => {
    const isLoggedIn = Boolean(currentUser?.id);
    elements.loggedOut?.classList.toggle('u-hidden', isLoggedIn);
    elements.content?.classList.toggle('u-hidden', !isLoggedIn);
    if (!isLoggedIn) {
        applyAccountHeaderLogo(null);
        return;
    }

    const username = currentUser.username || currentUser.name || '';
    if (elements.username) elements.username.value = username;
    if (elements.password) elements.password.value = '';
    if (elements.currentPassword) elements.currentPassword.value = '';
    if (elements.profileName) elements.profileName.textContent = username;
    if (elements.profileEmail) elements.profileEmail.textContent = currentUser.email || '';
    if (elements.avatarImage) {
        elements.avatarImage.src = currentUser.profileImageUrl || 'images/website/avatar/quizo.png';
        elements.avatarImage.alt = `${username} Profilbild`;
    }
    applyAccountHeaderLogo(currentUser);
};

const handleRemovedAccount = (message = ACCOUNT_REMOVED_MESSAGE) => {
    currentUser = null;
    render();
    setStatus(message, 'info');
};

const closeAvatarModal = () => {
    closeDialog(elements.avatarModal);
};

const openAvatarModal = () => {
    if (!elements.avatarModal || !elements.avatarModalContent || !currentUser) return;
    const currentKey = currentUser.avatarKey || 'hero';
    elements.avatarModalContent.innerHTML = '<h2 class="modal__headline">Bild ändern</h2><form id="js-account-avatar-form" class="avatar-modal"><div class="avatar-modal__grid"></div><button class="btn btn--modal" type="submit">Bild speichern</button></form>';
    const grid = elements.avatarModalContent.querySelector('.avatar-modal__grid');
    for (const avatar of HERO_AVATARS) {
        const label = document.createElement('label');
        label.className = 'account-avatar-option account-avatar-option--modal';
        const input = document.createElement('input');
        input.type = 'radio'; input.name = 'avatarKey'; input.value = avatar.key;
        input.checked = avatar.key === currentKey;
        const image = document.createElement('img');
        image.src = avatar.url; image.alt = avatar.label;
        label.append(input, image); grid.append(label);
    }
    openDialog(elements.avatarModal);
};

elements.form?.addEventListener('submit', async event => {
    event.preventDefault();
    if (!currentUser) return;
    setStatus('Profil wird gespeichert ...', 'info');
    try {
        currentUser = await userService.updateAccount(currentUser, {
            username: elements.username?.value || '',
            password: elements.password?.value || '',
            currentPassword: elements.currentPassword?.value || '',
            avatarKey: currentUser.avatarKey || 'hero'
        });
        render();
        setStatus('Profil gespeichert.', 'success');
    } catch (error) {
        if ([ACCOUNT_REMOVED_MESSAGE, SESSION_EXPIRED_MESSAGE].includes(error.message)) {
            handleRemovedAccount(error.message);
            return;
        }
        setStatus(error.message || 'Profil konnte nicht gespeichert werden.', 'error');
    }
});

elements.avatarOpen?.addEventListener('click', openAvatarModal);
elements.avatarModalClose?.addEventListener('click', closeAvatarModal);
elements.avatarModal?.addEventListener('click', event => {
    if (event.target === elements.avatarModal) {
        closeAvatarModal();
    }
});

elements.avatarModalContent?.addEventListener('submit', async event => {
    const form = event.target.closest('#js-account-avatar-form');
    if (!form || !currentUser) return;
    event.preventDefault();
    const formData = new FormData(form);
    const avatarKey = String(formData.get('avatarKey') || 'hero');
    setStatus('Bild wird gespeichert ...', 'info');
    try {
        currentUser = await userService.updateAccount(currentUser, {
            username: currentUser.username || currentUser.name,
            password: '',
            avatarKey
        });
        render();
        closeAvatarModal();
        setStatus('Bild gespeichert.', 'success');
    } catch (error) {
        if ([ACCOUNT_REMOVED_MESSAGE, SESSION_EXPIRED_MESSAGE].includes(error.message)) {
            closeAvatarModal();
            handleRemovedAccount(error.message);
            return;
        }
        setStatus(error.message || 'Bild konnte nicht gespeichert werden.', 'error');
    }
});

elements.logout?.addEventListener('click', async () => {
    try {
        await userService.logout(currentUser);
        currentUser = null;
        render();
        setStatus('Du bist ausgeloggt.', 'info');
    } catch (error) {
        if (error.message === SESSION_EXPIRED_MESSAGE) handleRemovedAccount(error.message);
        else setStatus(error.message, 'error');
    }
});

elements.deleteAccount?.addEventListener('click', async () => {
    if (!currentUser) return;
    const confirmValue = window.prompt('Account wirklich löschen? Tippe DELETE zur Bestätigung.');
    if (confirmValue !== 'DELETE') {
        setStatus('Löschung abgebrochen.', 'info');
        return;
    }
    setStatus('Account wird gelöscht ...', 'info');
    try {
        await userService.deleteAccount(currentUser, confirmValue, elements.currentPassword?.value || '');
        currentUser = null;
        render();
        setStatus('Account gelöscht. Ergebnisse wurden anonymisiert.', 'success');
    } catch (error) {
        if ([ACCOUNT_REMOVED_MESSAGE, SESSION_EXPIRED_MESSAGE].includes(error.message)) {
            handleRemovedAccount(error.message);
            return;
        }
        setStatus(error.message || 'Account konnte nicht gelöscht werden.', 'error');
    }
});

async function init() {
    await loadHeroAvatars();
    if (currentUser) {
        try {
            currentUser = await userService.getCurrentUser(currentUser);
        } catch (error) {
            if ([ACCOUNT_REMOVED_MESSAGE, SESSION_EXPIRED_MESSAGE].includes(error.message)) {
                handleRemovedAccount(error.message);
                return;
            }
            render();
            setStatus('Deine Anmeldung konnte gerade nicht geprüft werden. Bitte versuche es gleich erneut.', 'error');
            return;
        }
    }
    render();
}

// Ensure avatar list is loaded before the first render so the modal shows
// the avatars from `data/avatars.json` (register page already loads them).
init().catch(err => {
    console.warn('Fehler beim Laden der Account-Seite:', err);
    render();
});
