import { openDialog, closeDialog } from './dialog.js?v=dev';
import { CONFIG } from './config.js?v=dev';

const CONSENT_KEY = 'analytics_consent';

export function initConsent() {
    const banner = document.querySelector('#js-consent-banner');
    const acceptBtn = document.querySelector('.js-consent-accept');
    const declineBtn = document.querySelector('.js-consent-decline');

    if (!banner || !acceptBtn || !declineBtn) {
        return;
    }

    let stored = null;
    try { stored = localStorage.getItem(CONSENT_KEY); } catch { /* Consent remains per-page when storage is blocked. */ }
    const remember = value => {
        stored = value;
        try { localStorage.setItem(CONSENT_KEY, value); } catch { /* Keep the current choice in memory. */ }
    };
    if (stored === 'granted') {
        loadGoogleAnalytics();
    } else if (stored !== 'denied') {
        openDialog(banner);
    }

    const showBanner = () => {
        closeDialog(document.querySelector('#js-footer-modal'));
        openDialog(banner);
    };

    acceptBtn.addEventListener('click', () => {
        const previous = stored;
        remember('granted');
        closeDialog(banner);
        if (previous !== 'granted') {
            loadGoogleAnalytics();
        }
    });

    declineBtn.addEventListener('click', () => {
        const previous = stored;
        remember('denied');
        try { deleteAnalyticsCookies(); } catch { /* The browser may already block cookies. */ }
        closeDialog(banner);
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

function deleteAnalyticsCookies() {
    const cookieNames = ['_ga', '_gid', '_gat'];
    const gaId = CONFIG.analytics?.googleAnalyticsId || '';
    const measurementId = gaId.replace(/^G-/, '');
    if (measurementId) {
        cookieNames.push(`_ga_${measurementId}`);
    }

    const hostParts = window.location.hostname.split('.');
    const domains = [window.location.hostname];
    if (hostParts.length > 1) {
        domains.push(`.${hostParts.slice(-2).join('.')}`);
    }

    for (const name of cookieNames) {
        document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`;
        for (const domain of domains) {
            document.cookie = `${name}=; Max-Age=0; path=/; domain=${domain}; SameSite=Lax`;
        }
    }
}
