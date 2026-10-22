import { openDialog, closeDialog } from './dialog.js?v=dev';
import { HERO_AVATARS, loadHeroAvatars } from './config.js?v=dev';
import { ACCOUNT_REMOVED_MESSAGE, SESSION_EXPIRED_MESSAGE, UserService } from './user-service.js?v=dev';
import { applyAccountHeaderLogo } from './account-logo.js?v=dev';
import { initFooter } from './footer.js?v=dev';
import { revealStatus } from './status-navigation.js?v=dev';
import { isAvatarAvailable } from './avatar-policy.js?v=dev';

const elements = {
    loggedOut: document.querySelector('#js-account-page-logged-out'),
    content: document.querySelector('#js-account-page-content'),
    form: document.querySelector('#js-account-page-form'),
    username: document.querySelector('#js-account-page-username'),
    usernameEdit: document.querySelector('#js-username-edit'),
    usernameCancel: document.querySelector('#js-username-cancel'),
    usernameActions: document.querySelector('#js-username-actions'),
    usernameHint: document.querySelector('#js-username-hint'),
    passwordForm: document.querySelector('#js-password-form'),
    passwordSection: document.querySelector('#js-password-section'),
    passwordRepeat: document.querySelector('#js-password-repeat'),
    passwordCancel: document.querySelector('#js-password-cancel'),
    deleteModal: document.querySelector('#js-account-delete-modal'),
    deleteForm: document.querySelector('#js-account-delete-form'),
    deletePassword: document.querySelector('#js-account-delete-password'),
    deleteConfirm: document.querySelector('#js-account-delete-confirm'),
    deleteStatus: document.querySelector('#js-account-delete-status'),
    deleteClose: document.querySelector('#js-account-delete-close'),
    deleteCancel: document.querySelector('#js-account-delete-cancel'),
    password: document.querySelector('#js-account-page-password'),
    currentPassword: document.querySelector('#js-account-page-current-password'),
    profileName: document.querySelector('#js-account-profile-name'),
    profileEmail: document.querySelector('#js-account-profile-email'),
    avatarImage: document.querySelector('#js-account-avatar-image'),
    avatarSection: document.querySelector('#js-account-avatar-section'),
    avatarContent: document.querySelector('#js-account-avatar-content'),
    logout: document.querySelector('#js-account-page-logout'),
    deleteAccount: document.querySelector('#js-account-page-delete'),
    status: document.querySelector('#js-account-page-status')
};

const userService = new UserService();
let currentUser = null;
let updating = false;

initFooter();

function setBusy(busy) {
    updating = busy;
    for (const root of [elements.content, elements.avatarSection, elements.deleteModal]) {
        root?.querySelectorAll('button, input').forEach(control => { control.disabled = busy || control.dataset.rewardLocked === 'true'; });
    }
}

function setUsernameEditing(editing) {
    elements.username.readOnly = !editing;
    elements.usernameEdit.hidden = editing;
    elements.usernameEdit.setAttribute('aria-expanded', String(editing));
    elements.usernameActions.hidden = !editing;
    elements.usernameHint.textContent = editing ? 'Gib deinen neuen Benutzernamen ein und speichere die Änderung.' : '';
    if (editing) elements.username.focus();
    else elements.username.value = currentUser?.username || currentUser?.name || '';
}

function resetPasswordForm() {
    elements.passwordForm.reset();
    elements.passwordRepeat.setCustomValidity('');
    elements.passwordSection.open = false;
}

function handleUpdateError(error, fallback) {
    if ([ACCOUNT_REMOVED_MESSAGE, SESSION_EXPIRED_MESSAGE].includes(error.message)) handleRemovedAccount(error.message);
    else setStatus(error.message || fallback, 'error');
}

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
        elements.avatarSection.open = false;
        elements.avatarContent.replaceChildren();
        setUsernameEditing(false);
        resetPasswordForm();
        applyAccountHeaderLogo(null);
        return;
    }

    const username = currentUser.username || currentUser.name || '';
    if (elements.username?.readOnly) elements.username.value = username;
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

const closeAvatarPicker = () => {
    elements.avatarSection.open = false;
    elements.avatarContent.replaceChildren();
};

const openAvatarPicker = () => {
    if (!elements.avatarSection || !elements.avatarContent || !currentUser || updating) return;
    const currentKey = currentUser.avatarKey || 'hero';
    elements.avatarContent.innerHTML = '<div class="profile-avatar"><p class="account-page-form__hint">Wähle deinen Helden. Deine Auswahl wird automatisch gespeichert.</p><p class="user-panel__status" id="js-avatar-save-status" role="status" aria-live="polite"></p><div class="profile-avatar__grid" role="radiogroup" aria-label="Helden auswählen"></div></div>';
    const grid = elements.avatarContent.querySelector('.profile-avatar__grid');
    for (const avatar of currentUser.availableAvatars || HERO_AVATARS) {
        if(!isAvatarAvailable(avatar,currentUser))continue;
        const label=document.createElement('label');label.className='profile-avatar__card';
        const input=document.createElement('input');input.type='radio';input.name='avatarKey';input.value=avatar.key;input.checked=avatar.key===currentKey;
        const image=document.createElement('img');image.src=avatar.url;image.alt='';image.width=112;image.height=112;image.loading='lazy';
        const name=document.createElement('strong');name.textContent=avatar.label;
        const state=document.createElement('span');state.className='profile-avatar__state';
        const updateState=()=>{state.textContent=input.checked?'Ausgewählt':avatar.unlockRule?'Freigeschaltet':'Verfügbar';};
        input.addEventListener('change',()=>grid.querySelectorAll('input').forEach(radio=>radio.dispatchEvent(new Event('avatar-state'))));
        input.addEventListener('avatar-state',updateState);updateState();
        label.append(input,image,name,state);grid.append(label);
    }
    elements.avatarSection.open = true;
};

elements.usernameEdit?.addEventListener('click', () => setUsernameEditing(true));
elements.usernameCancel?.addEventListener('click', () => {
    setUsernameEditing(false);
    elements.usernameEdit.focus();
});
elements.form?.addEventListener('submit', async event => {
    event.preventDefault();
    if (!currentUser || updating || elements.username.readOnly) return;
    setBusy(true);
    setStatus('Benutzername wird gespeichert ...', 'info');
    try {
        currentUser = await userService.updateAccount(currentUser, { username: elements.username.value, password: '', avatarKey: currentUser.avatarKey || 'hero' });
        setUsernameEditing(false);
        render();
        setStatus('Benutzername gespeichert.', 'success');
    } catch (error) {
        handleUpdateError(error, 'Benutzername konnte nicht gespeichert werden.');
    } finally { setBusy(false); }
});
elements.passwordCancel?.addEventListener('click', () => {
    resetPasswordForm();
    elements.passwordSection.querySelector('summary').focus();
});
elements.passwordRepeat?.addEventListener('input', () => elements.passwordRepeat.setCustomValidity(''));
elements.password?.addEventListener('input', () => elements.passwordRepeat.setCustomValidity(''));
elements.passwordSection?.addEventListener('toggle', () => {
    if (!elements.passwordSection.open) {
        elements.passwordForm.reset();
        elements.passwordRepeat.setCustomValidity('');
    }
});
elements.passwordForm?.addEventListener('submit', async event => {
    event.preventDefault();
    if (!currentUser || updating) return;
    if (elements.password.value !== elements.passwordRepeat.value) {
        elements.passwordRepeat.setCustomValidity('Die neuen Passwörter stimmen nicht überein.');
        elements.passwordRepeat.reportValidity();
        return;
    }
    setBusy(true);
    setStatus('Passwort wird geändert …', 'info');
    try {
        currentUser = await userService.updateAccount(currentUser, { username: currentUser.username || currentUser.name, avatarKey: currentUser.avatarKey || 'hero', password: elements.password.value, currentPassword: elements.currentPassword.value });
        resetPasswordForm();
        render();
        setStatus('Passwort geändert. Andere angemeldete Geräte wurden abgemeldet.', 'success');
    } catch (error) {
        handleUpdateError(error, 'Passwort konnte nicht geändert werden.');
    } finally { setBusy(false); }
});

elements.avatarSection?.addEventListener('toggle', () => {
    if(elements.avatarSection.open && !elements.avatarContent.children.length)openAvatarPicker();
});
elements.avatarContent?.addEventListener('change', async event => {
    const input=event.target.closest('input[name="avatarKey"]');
    if(!input||!currentUser||updating)return;
    const avatarKey=input.value;
    if(avatarKey===(currentUser.avatarKey||'hero'))return;
    const status=elements.avatarContent.querySelector('#js-avatar-save-status');
    const notify=(message,type)=>{status.textContent=message;status.dataset.status=type;};
    setBusy(true);
    elements.avatarContent.setAttribute('aria-busy','true');
    notify('Dein Held wird gespeichert ...','info');
    try {
        currentUser=await userService.updateAccount(currentUser,{
            username:currentUser.username||currentUser.name,
            password:'',avatarKey
        });
        render();
        notify('Dein Held wurde gespeichert.','success');
    } catch(error) {
        if([ACCOUNT_REMOVED_MESSAGE,SESSION_EXPIRED_MESSAGE].includes(error.message)){
            closeAvatarPicker();handleRemovedAccount(error.message);return;
        }
        notify(error.message||'Dein Held konnte nicht gespeichert werden. Bitte erneut auswählen.','error');
    } finally {
        for(const radio of elements.avatarContent.querySelectorAll('input[name="avatarKey"]')){
            radio.checked=radio.value===(currentUser?.avatarKey||'hero');
            radio.dispatchEvent(new Event('avatar-state'));
        }
        elements.avatarContent.removeAttribute('aria-busy');
        setBusy(false);
    }
});

elements.logout?.addEventListener('click', async () => {
    if (updating) return;
    setBusy(true);
    try {
        await userService.logout(currentUser);
        currentUser = null;
        render();
        setStatus('Du bist ausgeloggt.', 'info');
    } catch (error) {
        if (error.message === SESSION_EXPIRED_MESSAGE) handleRemovedAccount(error.message);
        else setStatus(error.message, 'error');
    } finally { setBusy(false); }
});

elements.deleteAccount?.addEventListener('click', () => {
    if (!currentUser || updating) return;
    elements.deleteForm.reset();
    elements.deleteStatus.textContent = '';
    openDialog(elements.deleteModal);
});
const closeDeleteModal = () => {
    if (!updating) closeDialog(elements.deleteModal);
};
elements.deleteClose?.addEventListener('click', closeDeleteModal);
elements.deleteCancel?.addEventListener('click', closeDeleteModal);
elements.deleteModal?.addEventListener('click', event => {
    if (event.target === elements.deleteModal) closeDeleteModal();
});
elements.deleteModal?.addEventListener('cancel', event => { if (updating) event.preventDefault(); });
elements.deleteModal?.addEventListener('close', () => {
    elements.deleteForm.reset();
    elements.deleteStatus.textContent = '';
});
elements.deleteForm?.addEventListener('submit', async event => {
    event.preventDefault();
    if (!currentUser || updating) return;
    setBusy(true);
    elements.deleteStatus.textContent = 'Account wird gelöscht …';
    try {
        await userService.deleteAccount(currentUser, elements.deleteConfirm.value, elements.deletePassword.value);
        closeDialog(elements.deleteModal);
        currentUser = null;
        resetPasswordForm();
        render();
        setStatus('Account gelöscht. Persönliche Frageergebnisse wurden entfernt, Rundensummen anonymisiert.', 'success');
    } catch (error) {
        if ([ACCOUNT_REMOVED_MESSAGE, SESSION_EXPIRED_MESSAGE].includes(error.message)) {
            closeDialog(elements.deleteModal);
            handleRemovedAccount(error.message);
        } else elements.deleteStatus.textContent = error.message || 'Account konnte nicht gelöscht werden.';
    } finally { setBusy(false); }
});

async function init() {
    await loadHeroAvatars();
    {
        const storedUser = userService.getStoredUser();
        const hadCachedUser = Boolean(storedUser);
        try {
            currentUser = await userService.getCurrentUser(storedUser);
        } catch (error) {
            if ([ACCOUNT_REMOVED_MESSAGE, SESSION_EXPIRED_MESSAGE].includes(error.message)) {
                currentUser = null;
                render();
                if (hadCachedUser) setStatus(error.message, 'info');
                return;
            }
            render();
            setStatus('Deine Anmeldung konnte gerade nicht geprüft werden. Bitte versuche es gleich erneut.', 'error');
            return;
        }
    }
    render();
    if(currentUser&&window.location.hash==='#avatar'){
        openAvatarPicker();
        elements.avatarSection.scrollIntoView({block:'start'});
    }
}

// Ensure avatar list is loaded before the first render so the picker shows
// the avatars from the server catalog (register page already loads them).
init().catch(err => {
    console.warn('Fehler beim Laden der Account-Seite:', err);
    render();
});
