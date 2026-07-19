import { normalizeAvatarUrl } from './config.js?v=20260719f';

const STORAGE_KEY = 'quizHeroUser';

const readStoredUser = () => {
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch (error) {
        return null;
    }
};

const resolveSiteAssetUrl = url => {
    const normalized = normalizeAvatarUrl(url);
    if (!normalized) return '';
    if (/^(https?:)?\/\//i.test(normalized) || normalized.startsWith('data:') || normalized.startsWith('blob:')) {
        return normalized;
    }
    return new URL(`../${normalized.replace(/^\/+/, '')}`, import.meta.url).href;
};

export const applyAccountHeaderLogo = (user = readStoredUser()) => {
    const profileImageUrl = user?.profileImageUrl || '';
    document.querySelectorAll('.main__logo-link .main_image, .main__logo-link .quiz__headerlogo_image').forEach(image => {
        if (!image.dataset.defaultLogoSrc) {
            image.dataset.defaultLogoSrc = image.getAttribute('src') || '';
            image.dataset.defaultLogoAlt = image.getAttribute('alt') || 'Zur Startseite';
        }

        if (profileImageUrl) {
            image.src = resolveSiteAssetUrl(profileImageUrl);
            image.alt = `${user?.username || user?.name || 'Account'} Profilbild`;
            image.classList.add('account-header-logo--account');
            return;
        }

        image.src = image.dataset.defaultLogoSrc;
        image.alt = image.dataset.defaultLogoAlt;
        image.classList.remove('account-header-logo--account');
    });
};
