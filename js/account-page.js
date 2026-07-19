import { HERO_AVATARS, loadHeroAvatars } from './config.js?v=dev';
import { UserService } from './user-service.js?v=dev';
import { applyAccountHeaderLogo } from './account-logo.js?v=dev';
import { initFooter } from './footer.js?v=dev';

const elements = {
    loggedOut: document.querySelector('#js-account-page-logged-out'),
    content: document.querySelector('#js-account-page-content'),
    form: document.querySelector('#js-account-page-form'),
    username: document.querySelector('#js-account-page-username'),
    password: document.querySelector('#js-account-page-password'),
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
};

const render = () => {
    const isLoggedIn = Boolean(currentUser?.id && currentUser?.token);
    elements.loggedOut?.classList.toggle('admin-hidden', isLoggedIn);
    elements.content?.classList.toggle('admin-hidden', !isLoggedIn);
    if (!isLoggedIn) {
        applyAccountHeaderLogo(null);
        return;
    }

    const username = currentUser.username || currentUser.name || '';
    if (elements.username) elements.username.value = username;
    if (elements.password) elements.password.value = '';
    if (elements.profileName) elements.profileName.textContent = username;
    if (elements.profileEmail) elements.profileEmail.textContent = currentUser.email || '';
    if (elements.avatarImage) {
        elements.avatarImage.src = currentUser.profileImageUrl || 'images/website/avatar/quizo.png';
        elements.avatarImage.alt = `${username} Profilbild`;
    }
    applyAccountHeaderLogo(currentUser);
};

const closeAvatarModal = () => {
    elements.avatarModal?.classList.add('hide');
};

const openAvatarModal = () => {
    if (!elements.avatarModal || !elements.avatarModalContent || !currentUser) return;
    const currentKey = currentUser.avatarKey || 'hero';
    const options = HERO_AVATARS.map(avatar => `
        <label class="account-avatar-option account-avatar-option--modal" aria-label="${avatar.label}">
            <input type="radio" name="avatarKey" value="${avatar.key}" ${avatar.key === currentKey ? 'checked' : ''}>
            <img src="${avatar.url}" alt="${avatar.label}" loading="lazy">
        </label>
    `).join('');
    elements.avatarModalContent.innerHTML = `
        <h2 class="modal__headline">Logo ändern</h2>
        <form id="js-account-avatar-form" class="avatar-modal">
            <div class="avatar-modal__grid">${options}</div>
            <button class="btn btn--modal" type="submit">Logo speichern</button>
        </form>
    `;
    elements.avatarModal.classList.remove('hide');
};

elements.form?.addEventListener('submit', async event => {
    event.preventDefault();
    if (!currentUser) return;
    setStatus('Profil wird gespeichert ...', 'info');
    try {
        currentUser = await userService.updateAccount(currentUser, {
            username: elements.username?.value || '',
            password: elements.password?.value || '',
            avatarKey: currentUser.avatarKey || 'hero'
        });
        render();
        setStatus('Profil gespeichert.', 'success');
    } catch (error) {
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
document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
        closeAvatarModal();
    }
});

elements.avatarModalContent?.addEventListener('submit', async event => {
    const form = event.target.closest('#js-account-avatar-form');
    if (!form || !currentUser) return;
    event.preventDefault();
    const formData = new FormData(form);
    const avatarKey = String(formData.get('avatarKey') || 'hero');
    setStatus('Logo wird gespeichert ...', 'info');
    try {
        currentUser = await userService.updateAccount(currentUser, {
            username: currentUser.username || currentUser.name,
            password: '',
            avatarKey
        });
        render();
        closeAvatarModal();
        setStatus('Logo gespeichert.', 'success');
    } catch (error) {
        setStatus(error.message || 'Logo konnte nicht gespeichert werden.', 'error');
    }
});

elements.logout?.addEventListener('click', () => {
    userService.clearUser();
    currentUser = null;
    render();
    setStatus('Du bist ausgeloggt.', 'info');
});

elements.deleteAccount?.addEventListener('click', async () => {
    if (!currentUser) return;
    const confirmValue = window.prompt('Account wirklich löschen? Tippe DELETE zur Bestätigung.');
    if (confirmValue !== 'DELETE') {
        setStatus('Loeschung abgebrochen.', 'info');
        return;
    }
    setStatus('Account wird gelöscht ...', 'info');
    try {
        await userService.deleteAccount(currentUser, confirmValue);
        currentUser = null;
        render();
        setStatus('Account gelöscht. Ergebnisse wurden anonymisiert.', 'success');
    } catch (error) {
        setStatus(error.message || 'Account konnte nicht gelöscht werden.', 'error');
    }
});

// Ensure avatar list is loaded before the first render so the modal shows
// the avatars from `data/avatars.json` (register page already loads them).
loadHeroAvatars().then(() => {
    render();
}).catch(err => {
    console.warn('Fehler beim Laden der Avatar-Config:', err);
    render();
});
