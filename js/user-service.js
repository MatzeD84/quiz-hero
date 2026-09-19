import { CONFIG, normalizeAvatarUrl } from './config.js?v=dev';

const STORAGE_KEY = 'quizHeroUser';
const API_VERSION = CONFIG.apiVersion || '1';
export const SESSION_EXPIRED_MESSAGE = 'Deine Anmeldung ist abgelaufen. Bitte melde dich erneut an.';
export const ACCOUNT_REMOVED_MESSAGE = 'Dein Account existiert nicht mehr. Du wurdest ausgeloggt.';

const normalizeUser = user => {
    if (!user || typeof user !== 'object') return user;
    return {
        ...user,
        profileImageUrl: normalizeAvatarUrl(user.profileImageUrl)
    };
};

export class UserService {
    constructor({ apiUrl = CONFIG.apiUrl, fetchFn = window.fetch.bind(window) } = {}) {
        this.apiUrl = apiUrl;
        this.fetchFn = fetchFn;
    }

    getStoredUser() {
        try {
            const raw = window.localStorage.getItem(STORAGE_KEY);
            return raw ? normalizeUser(JSON.parse(raw)) : null;
        } catch (error) {
            return null;
        }
    }

    storeUser(user) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeUser(user)));
    }

    clearUser() {
        window.localStorage.removeItem(STORAGE_KEY);
    }

    async logout(user) {
        if (user?.id && user?.token) {
            const data = await this.post('account-logout', { userId: user.id, userToken: user.token });
            if (!data.ok) throw new Error(data.error || 'Abmelden fehlgeschlagen. Bitte erneut versuchen.');
        }
        this.clearUser();
    }

    async getCurrentUser(user) {
        if (!user?.id || !user?.token) return null;
        const data = await this.post('account-me', {
            userId: user.id,
            userToken: user.token
        });
        if (!data.ok) {
            throw new Error(data.error || 'Account konnte nicht geladen werden.');
        }
        this.storeUser(data.user);
        return data.user;
    }

    async register({ username, email, password, avatarKey, privacyAccepted }) {
        const data = await this.post('account-register', { username, email, password, avatarKey, privacyAccepted });
        if (!data.ok) {
            throw new Error(data.error || 'Registrierung fehlgeschlagen.');
        }
        return data;
    }

    async verifyEmail(token) {
        const data = await this.post('account-verify-email', { token });
        if (!data.ok) {
            throw new Error(data.error || 'E-Mail konnte nicht bestaetigt werden.');
        }
        this.storeUser(data.user);
        return data.user;
    }

    async login({ identifier, password }) {
        const data = await this.post('account-login', { identifier, password });
        if (!data.ok) {
            throw new Error(data.error || 'Login fehlgeschlagen.');
        }
        this.storeUser(data.user);
        return data.user;
    }

    async devLogin() {
        const data = await this.post('account-dev-login', {});
        if (!data.ok) {
            throw new Error(data.error || 'Dev-Login ist nicht verfuegbar.');
        }
        this.storeUser(data.user);
        return data.user;
    }

    async requestPasswordReset(email) {
        const data = await this.post('account-request-password-reset', { email });
        if (!data.ok) {
            throw new Error(data.error || 'Reset-Link konnte nicht verschickt werden.');
        }
        return data;
    }

    async resendVerification(email) {
        const data = await this.post('account-resend-verification', { email });
        if (!data.ok) throw new Error(data.error || 'Versand konnte nicht angefordert werden.');
        return data;
    }

    async resetPassword({ token, password }) {
        const data = await this.post('account-reset-password', { token, password });
        if (!data.ok) {
            throw new Error(data.error || 'Passwort konnte nicht gespeichert werden.');
        }
        this.storeUser(data.user);
        return data.user;
    }

    async updateAccount(user, { username, avatarKey, password, currentPassword }) {
        const data = await this.post('account-update', {
            userId: user.id,
            userToken: user.token,
            username,
            avatarKey,
            password,
            currentPassword
        });
        if (!data.ok) {
            throw new Error(data.error || 'Account konnte nicht gespeichert werden.');
        }
        this.storeUser(data.user);
        return data.user;
    }

    async deleteAccount(user, confirm, currentPassword) {
        const data = await this.post('account-delete', {
            userId: user.id,
            userToken: user.token,
            confirm,
            currentPassword
        });
        if (!data.ok) {
            throw new Error(data.error || 'Account konnte nicht geloescht werden.');
        }
        this.clearUser();
        return data;
    }

    async saveResult(user, stats, context) {
        if (!user?.id || !user?.token) return;
        const data = await this.post('save-result', {
            userId: user.id,
            userToken: user.token,
            score: stats.score,
            maxScore: stats.maxScore,
            solved: stats.solved,
            total: stats.total,
            categoryId: context.categoryId || '',
            tagId: context.tagId || ''
        });
        if (!data.ok) {
            throw new Error(data.error || 'Ergebnis konnte nicht gespeichert werden.');
        }
    }

    async submitQuestionFeedback(user, { questionId, types, comment }) {
        const payload = {
            questionId,
            types,
            comment
        };
        if (user?.id && user?.token) {
            payload.userId = user.id;
            payload.userToken = user.token;
        }
        const data = await this.post('question-feedback-save', payload);
        if (!data.ok) {
            throw new Error(data.error || 'Feedback konnte nicht gesendet werden.');
        }
        return data;
    }

    async post(action, payload) {
        const params = new URLSearchParams({ action, v: API_VERSION });
        const response = await this.fetchFn(`${this.apiUrl}?${params.toString()}`, {
            method: 'POST',
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify(payload)
        });
        const text = await response.text();
        let data;
        try {
            data = JSON.parse(text);
        } catch (error) {
            const preview = text.replace(/\s+/g, ' ').slice(0, 220);
            throw new Error(`API antwortet nicht mit JSON (HTTP ${response.status}): ${preview || response.statusText}`);
        }
        if (!response.ok && data.ok !== false) {
            throw new Error(data.error || `API-Anfrage fehlgeschlagen (HTTP ${response.status}).`);
        }
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
