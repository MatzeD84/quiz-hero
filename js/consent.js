import { CONFIG } from './config.js';

const CONSENT_KEY = 'analytics_consent';

export function initConsent() {
    const banner = document.querySelector('#js-consent-banner');
    const acceptBtn = document.querySelector('.js-consent-accept');
    const declineBtn = document.querySelector('.js-consent-decline');

    if (!banner || !acceptBtn || !declineBtn) {
        return;
    }

    const stored = localStorage.getItem(CONSENT_KEY);
    if (stored === 'granted') {
        loadGoogleAnalytics();
    } else if (stored !== 'denied') {
        banner.classList.remove('hide');
    }

    const showBanner = () => {
        banner.classList.remove('hide');
    };

    acceptBtn.addEventListener('click', () => {
        const previous = localStorage.getItem(CONSENT_KEY);
        localStorage.setItem(CONSENT_KEY, 'granted');
        banner.classList.add('hide');
        if (previous !== 'granted') {
            loadGoogleAnalytics();
        }
    });

    declineBtn.addEventListener('click', () => {
        const previous = localStorage.getItem(CONSENT_KEY);
        localStorage.setItem(CONSENT_KEY, 'denied');
        banner.classList.add('hide');
        if (previous === 'granted') {
            location.reload();
        }
    });

    document.addEventListener('click', event => {
        const target = event.target.closest('.js-consent-manage');
        if (!target) {
            return;
        }
        event.preventDefault();
        showBanner();
    });
}

function loadGoogleAnalytics() {
    const gaId = CONFIG.analytics?.googleAnalyticsId;
    if (!gaId || document.querySelector('#js-ga-loader')) {
        return;
    }

    const script = document.createElement('script');
    script.async = true;
    script.id = 'js-ga-loader';
    script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    function gtag() {
        window.dataLayer.push(arguments);
    }
    gtag('js', new Date());
    gtag('config', gaId);
}
