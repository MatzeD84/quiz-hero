import { CONFIG, HERO_AVATARS, loadHeroAvatars } from './config.js?v=20260719f';
import { initFooter } from './footer.js?v=20260705';
import { UserService } from './user-service.js?v=20260719f';
import { applyAccountHeaderLogo } from './account-logo.js?v=20260719f';

const elements = {
    tabs: Array.from(document.querySelectorAll('.js-login-tab')),
    panels: Array.from(document.querySelectorAll('.js-login-panel')),
    loginForm: document.querySelector('#js-login-form'),
    loginIdentifier: document.querySelector('#js-login-identifier'),
    loginPassword: document.querySelector('#js-login-password'),
    devLogin: document.querySelector('#js-login-dev'),
    registerForm: document.querySelector('#js-register-form'),
    registerUsername: document.querySelector('#js-register-username'),
    registerEmail: document.querySelector('#js-register-email'),
    registerPassword: document.querySelector('#js-register-password'),
    registerPrivacy: document.querySelector('#js-register-privacy'),
    avatarGroups: Array.from(document.querySelectorAll('.js-login-avatar-group')),
    resetRequestForm: document.querySelector('#js-reset-request-form'),
    resetEmail: document.querySelector('#js-reset-email'),
    resetForm: document.querySelector('#js-reset-form'),
    resetToken: document.querySelector('#js-reset-token'),
    resetPassword: document.querySelector('#js-reset-password'),
    status: document.querySelector('#js-login-status')
};

const userService = new UserService();

const setStatus = (message, type = 'info') => {
    if (!elements.status) return;
    elements.status.textContent = message || '';
    elements.status.dataset.status = message ? type : '';
};

const showView = view => {
    elements.panels.forEach(panel => {
        panel.classList.toggle('admin-hidden', panel.dataset.loginPanel !== view);
    });
    elements.tabs.forEach(tab => {
        tab.classList.toggle('btn--disabled', tab.dataset.loginView === view);
    });
};

const selectedAvatar = target => {
    const input = document.querySelector(`input[name="login-avatar-${target}"]:checked`);
    return input?.value || HERO_AVATARS[0]?.key || 'hero';
};

const renderAvatarChoices = () => {
    elements.avatarGroups.forEach(group => {
        const target = group.dataset.avatarTarget || 'register';
        group.innerHTML = '<p class="account-avatar-field__title">Hero-Bild</p>';
        HERO_AVATARS.forEach((avatar, index) => {
            const label = document.createElement('label');
            label.className = 'account-avatar-option account-avatar-option--compact';
            label.setAttribute('aria-label', avatar.label);
            const input = document.createElement('input');
            input.type = 'radio';
            input.name = `login-avatar-${target}`;
            input.value = avatar.key;
            input.checked = index === 0;
            const image = document.createElement('img');
            image.src = avatar.url;
            image.alt = avatar.label;
            image.loading = 'lazy';
            label.append(input, image);
            group.appendChild(label);
        });
    });
};

const redirectAfterLogin = () => {
    window.location.href = 'index.html';
};

elements.tabs.forEach(tab => {
    tab.addEventListener('click', () => showView(tab.dataset.loginView));
});

    elements.devLogin?.classList.toggle('admin-hidden', !CONFIG.devMode);

elements.loginForm?.addEventListener('submit', async event => {
    event.preventDefault();
    setStatus('Login wird geprüft ...', 'info');
    try {
        await userService.login({
            identifier: elements.loginIdentifier?.value || '',
            password: elements.loginPassword?.value || ''
        });
        setStatus('Login erfolgreich.', 'success');
        redirectAfterLogin();
    } catch (error) {
        setStatus(error.message || 'Login fehlgeschlagen. Bitte pruefe Username/E-Mail und Passwort.', 'error');
    }
});

elements.devLogin?.addEventListener('click', async () => {
    setStatus('Lokaler Testaccount wird geladen ...', 'info');
    try {
        await userService.devLogin();
        redirectAfterLogin();
    } catch (error) {
        setStatus(error.message || 'Dev-Login nicht verfügbar.', 'error');
    }
});

elements.registerForm?.addEventListener('submit', async event => {
    event.preventDefault();
    setStatus('Registrierung wird gespeichert ...', 'info');
    try {
        await userService.register({
            username: elements.registerUsername?.value || '',
            email: elements.registerEmail?.value || '',
            password: elements.registerPassword?.value || '',
            avatarKey: selectedAvatar('register'),
            privacyAccepted: Boolean(elements.registerPrivacy?.checked)
        });
        showView('login');
        setStatus('Registrierung erfolgreich. Bitte bestätige deine E-Mail. Lokal findest du die Mail in var/mail.log.', 'success');
    } catch (error) {
        setStatus(error.message || 'Registrierung fehlgeschlagen.', 'error');
    }
});

elements.resetRequestForm?.addEventListener('submit', async event => {
    event.preventDefault();
    setStatus('Reset-Link wird vorbereitet ...', 'info');
    try {
        const result = await userService.requestPasswordReset(elements.resetEmail?.value || '');
        setStatus(result.message || 'Falls die E-Mail bekannt ist, wurde ein Reset-Link verschickt.', 'success');
    } catch (error) {
        setStatus(error.message || 'Reset-Link konnte nicht verschickt werden.', 'error');
    }
});

elements.resetForm?.addEventListener('submit', async event => {
    event.preventDefault();
    setStatus('Passwort wird gespeichert ...', 'info');
    try {
        await userService.resetPassword({
            token: elements.resetToken?.value || '',
            password: elements.resetPassword?.value || ''
        });
        setStatus('Passwort gespeichert.', 'success');
        redirectAfterLogin();
    } catch (error) {
        setStatus(error.message || 'Passwort konnte nicht gespeichert werden.', 'error');
    }
});

const handleTokens = async () => {
    const params = new URLSearchParams(window.location.search);
    const verifyToken = params.get('verifyToken');
    const resetToken = params.get('resetToken');
    if (verifyToken) {
        setStatus('E-Mail wird bestätigt ...', 'info');
        try {
            await userService.verifyEmail(verifyToken);
            setStatus('E-Mail bestätigt. Du bist eingeloggt.', 'success');
            params.delete('verifyToken');
            window.history.replaceState({}, '', `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}${window.location.hash}`);
            redirectAfterLogin();
        } catch (error) {
            setStatus(error.message || 'E-Mail konnte nicht bestätigt werden.', 'error');
        }
        return;
    }
    if (resetToken) {
        showView('reset');
        if (elements.resetToken) {
            elements.resetToken.value = resetToken;
        }
        setStatus('Bitte neues Passwort setzen.', 'info');
    }
};

const initialize = async () => {
    await loadHeroAvatars();
    renderAvatarChoices();
    showView('login');
    handleTokens();
};

initFooter();
applyAccountHeaderLogo();
initialize();
