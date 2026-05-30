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
        const response = await this.post('user-login', { name, profileImageUrl });
        if (!response.ok) {
            throw new Error(response.error || 'Login fehlgeschlagen.');
        }
        this.storeUser(response.user);
        return response.user;
    }

    async saveResult(user, stats, context) {
        if (!user?.id) return;
        await this.post('save-result', {
            userId: user.id,
            score: stats.score,
            maxScore: stats.maxScore,
            solved: stats.solved,
            total: stats.total,
            categoryId: context.categoryId || '',
            tagId: context.tagId || ''
        });
    }

    async post(action, payload) {
        const response = await this.fetchFn(`${this.apiUrl}?action=${encodeURIComponent(action)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify(payload)
        });
        return response.json();
    }
}
