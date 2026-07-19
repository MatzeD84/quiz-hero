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
    if (!url) return '';
    if (/^(https?:)?\/\//i.test(url) || url.startsWith('data:') || url.startsWith('blob:')) {
        return url;
    }
    return new URL(`../${url.replace(/^\/+/, '')}`, import.meta.url).href;
};

export const applyAccountHeaderLogo = (user = readStoredUser()) => {
    const profileImageUrl = user?.profileImageUrl || '';
    document.querySelectorAll('.main__logo-link :is(.main_image, .quiz__headerlogo_image)').forEach(image => {
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
