import { CONFIG, normalizeAvatarUrl } from './config.js?v=dev';

const STORAGE_KEY = 'quizHeroUser';
const CSRF_STORAGE_KEY = 'quizHeroUserCsrf';
const API_VERSION = CONFIG.apiVersion || '1';
export const SESSION_EXPIRED_MESSAGE = 'Deine Anmeldung ist abgelaufen. Bitte melde dich erneut an.';
export const ACCOUNT_REMOVED_MESSAGE = 'Dein Account existiert nicht mehr. Du wurdest ausgeloggt.';

const normalizeUser = user => {
    if (!user || typeof user !== 'object') return user;
    const { token, userToken, csrfToken, ...safeUser } = user;
    return {
        ...safeUser,
        profileImageUrl: normalizeAvatarUrl(safeUser.profileImageUrl)
    };
};

export class UserService {
    constructor({ apiUrl = CONFIG.apiUrl, fetchFn = window.fetch.bind(window) } = {}) {
        this.apiUrl = apiUrl;
        this.fetchFn = fetchFn;
        this.csrfToken = this.readCsrfToken();
    }

    readCsrfToken() {
        try { return window.sessionStorage.getItem(CSRF_STORAGE_KEY) || ''; }
        catch { return ''; }
    }

    storeCsrfToken(token) {
        this.csrfToken = typeof token === 'string' ? token : '';
        try {
            if (this.csrfToken) window.sessionStorage.setItem(CSRF_STORAGE_KEY, this.csrfToken);
            else window.sessionStorage.removeItem(CSRF_STORAGE_KEY);
        } catch { /* The token remains available in memory for this page. */ }
    }

    getStoredUser() {
        try {
            const raw = window.localStorage.getItem(STORAGE_KEY);
            return raw ? normalizeUser(JSON.parse(raw)) : null;
        } catch {
            return null;
        }
    }

    storeUser(user) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeUser(user)));
    }

    clearUser() {
        try { window.localStorage.removeItem(STORAGE_KEY); } catch { /* Storage may be disabled. */ }
        this.storeCsrfToken('');
    }

    async logout(user) {
        if (user?.id) {
            const data = await this.post('account-logout', {}, { csrf: true });
            if (!data.ok) throw new Error(data.error || 'Abmelden fehlgeschlagen. Bitte erneut versuchen.');
        }
        this.clearUser();
    }

    async getCurrentUser(user) {
        if (!user?.id) return null;
        const data = await this.post('account-me', {});
        if (!data.ok) throw new Error(data.error || 'Account konnte nicht geladen werden.');
        const currentUser = normalizeUser(data.user);
        this.storeUser(currentUser);
        return currentUser;
    }

    async register({ username, email, password, avatarKey, privacyAccepted }) {
        const data = await this.post('account-register', { username, email, password, avatarKey, privacyAccepted });
        if (!data.ok) throw new Error(data.error || 'Registrierung fehlgeschlagen.');
        return data;
    }

    async verifyEmail(token) {
        const data = await this.post('account-verify-email', { token });
        if (!data.ok) throw new Error(data.error || 'E-Mail konnte nicht bestaetigt werden.');
        const user = normalizeUser(data.user);
        this.storeUser(user);
        return user;
    }

    async login({ identifier, password }) {
        const data = await this.post('account-login', { identifier, password });
        if (!data.ok) throw new Error(data.error || 'Login fehlgeschlagen.');
        const user = normalizeUser(data.user);
        this.storeUser(user);
        return user;
    }

    async devLogin() {
        const data = await this.post('account-dev-login', {});
        if (!data.ok) throw new Error(data.error || 'Dev-Login ist nicht verfuegbar.');
        const user = normalizeUser(data.user);
        this.storeUser(user);
        return user;
    }

    async requestPasswordReset(email) {
        const data = await this.post('account-request-password-reset', { email });
        if (!data.ok) throw new Error(data.error || 'Reset-Link konnte nicht verschickt werden.');
        return data;
    }

    async resendVerification(email) {
        const data = await this.post('account-resend-verification', { email });
        if (!data.ok) throw new Error(data.error || 'Versand konnte nicht angefordert werden.');
        return data;
    }

    async resetPassword({ token, password }) {
        const data = await this.post('account-reset-password', { token, password });
        if (!data.ok) throw new Error(data.error || 'Passwort konnte nicht gespeichert werden.');
        const user = normalizeUser(data.user);
        this.storeUser(user);
        return user;
    }

    async updateAccount(user, { username, avatarKey, password, currentPassword }) {
        const data = await this.post('account-update', { username, avatarKey, password, currentPassword }, { csrf: true });
        if (!data.ok) throw new Error(data.error || 'Account konnte nicht gespeichert werden.');
        const updatedUser = normalizeUser(data.user);
        this.storeUser(updatedUser);
        return updatedUser;
    }

    async deleteAccount(user, confirm, currentPassword) {
        const data = await this.post('account-delete', { confirm, currentPassword }, { csrf: true });
        if (!data.ok) throw new Error(data.error || 'Account konnte nicht geloescht werden.');
        this.clearUser();
        return data;
    }

    async saveResult(user, stats, context) {
        if (!user?.id) return;
        const data = await this.post('save-result', {
            score: stats.score,
            maxScore: stats.maxScore,
            solved: stats.solved,
            total: stats.total,
            categoryId: context.categoryId || '',
            tagId: context.tagId || ''
        }, { csrf: true });
        if (!data.ok) throw new Error(data.error || 'Ergebnis konnte nicht gespeichert werden.');
    }

    async submitQuestionFeedback(user, { questionId, types, comment }) {
        const data = await this.post('question-feedback-save', { questionId, types, comment }, { csrf: Boolean(user?.id) });
        if (!data.ok) throw new Error(data.error || 'Feedback konnte nicht gesendet werden.');
        return data;
    }

    async post(action, payload, { csrf = false } = {}) {
        const params = new URLSearchParams({ action, v: API_VERSION });
        const headers = { 'Accept': 'application/json', 'Content-Type': 'application/json' };
        if (csrf && this.csrfToken) headers['X-Quiz-Hero-CSRF'] = this.csrfToken;
        const response = await this.fetchFn(`${this.apiUrl}?${params.toString()}`, {
            method: 'POST', headers, credentials: 'same-origin', body: JSON.stringify(payload)
        });
        const text = await response.text();
        let data;
        try {
            data = JSON.parse(text);
        } catch {
            const preview = text.replace(/\s+/g, ' ').slice(0, 220);
            throw new Error(`API antwortet nicht mit JSON (HTTP ${response.status}): ${preview || response.statusText}`);
        }
        if (typeof data.csrfToken === 'string') this.storeCsrfToken(data.csrfToken);
        if (!response.ok && data.ok !== false) throw new Error(data.error || `API-Anfrage fehlgeschlagen (HTTP ${response.status}).`);
        if (data.code === 'SESSION_EXPIRED') {
            this.clearUser();
            throw new Error(SESSION_EXPIRED_MESSAGE);
        }
        if (data.ok === false && data.error === 'Account wurde nicht gefunden.') {
            this.clearUser();
            throw new Error(ACCOUNT_REMOVED_MESSAGE);
        }
        return data;
    }
}
