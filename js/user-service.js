import { CONFIG } from './config.js';

const STORAGE_KEY = 'quizHeroUser';

export class UserService {
    constructor({ apiUrl = CONFIG.apiUrl, fetchFn = window.fetch.bind(window) } = {}) {
        this.apiUrl = apiUrl;
        this.fetchFn = fetchFn;
    }

    getStoredUser() {
        try {
            const raw = window.localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch (error) {
            return null;
        }
    }

    storeUser(user) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    }

    clearUser() {
        window.localStorage.removeItem(STORAGE_KEY);
    }

    async login({ name, profileImageUrl }) {
        const data = await this.post('user-login', { name, profileImageUrl });
        if (!data.ok) {
            throw new Error(data.error || 'Login fehlgeschlagen.');
        }
        this.storeUser(data.user);
        return data.user;
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

    async post(action, payload) {
        const params = new URLSearchParams({ action, v: CONFIG.apiVersion });
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
        return data;
    }
}
