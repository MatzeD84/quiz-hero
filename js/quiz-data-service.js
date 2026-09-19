import { ASSET_VERSION, CONFIG } from './config.js?v=dev';
import { validateCategories, validateFeedback, validateTags } from './validators.js?v=dev';

const API_VERSION = CONFIG.apiVersion || '1';

export class QuizDataService {
    constructor({ questionsUrl, tagsUrl, feedbackUrl, apiUrl = null, fetchFn = window.fetch.bind(window) }) {
        this.questionsUrl = questionsUrl;
        this.tagsUrl = tagsUrl;
        this.feedbackUrl = feedbackUrl;
        this.apiUrl = apiUrl;
        this.fetchFn = fetchFn;
        this.cache = null;
    }

    async loadAll() {
        if (this.cache) {
            return this.cache;
        }

        const apiData = await this.fetchFromApi();
        if (apiData) {
            this.cache = apiData;
            return this.cache;
        }

        const [categoriesManifest, tagsData, feedback] = await Promise.all([
            this.fetchJson(this.questionsUrl),
            this.fetchJson(this.tagsUrl),
            this.fetchJson(this.feedbackUrl)
        ]);

        const feedbackErrors = validateFeedback(feedback);
        if (feedbackErrors.length) {
            throw new Error(`Ung\u00fcltige data/feedback.json:\n${feedbackErrors.join('\n')}`);
        }

        const tagErrors = validateTags(tagsData.tags ?? []);
        if (tagErrors.length) {
            throw new Error(`Ung\u00fcltige data/tags.json:\n${tagErrors.join('\n')}`);
        }

        const categories = categoriesManifest.categories ?? [];

        await Promise.all(
            categories.map(async category => {
                if (!category.questionsFile) {
                    category.questions = [];
                    return;
                }
                const questionData = await this.fetchJson(category.questionsFile);
                category.questions = questionData.questions ?? [];
            })
        );

        const validationErrors = validateCategories(categories);
        if (validationErrors.length > 0) {
            throw new Error(`Ung\u00fcltige categories/questions Daten:\n${validationErrors.join('\n')}`);
        }

        const tags = tagsData.tags ?? [];

        this.cache = { categories, tags, feedback };
        return this.cache;
    }


    async fetchFromApi() {
        if (!this.apiUrl) {
            return null;
        }
        try {
            const params = new URLSearchParams({ action: 'public-data', v: API_VERSION });
            const response = await this.fetchFn(`${this.apiUrl}?${params.toString()}`, { cache: 'no-store' });
            if (!response.ok) {
                throw new Error(`Quizdaten konnten nicht geladen werden (HTTP ${response.status}).`);
            }
            const data = await response.json();
            if (!data.ok) {
                throw new Error('Die Datenquelle hat keine gültigen Quizdaten geliefert.');
            }
            const categories = data.categories ?? [];
            const tags = data.tags ?? [];
            const feedback = data.feedback ?? {};
            const validationErrors = [
                ...validateFeedback(feedback),
                ...validateTags(tags),
                ...validateCategories(categories)
            ];
            if (validationErrors.length > 0) {
                throw new Error(`Ungültige API-Daten:
${validationErrors.join('\n')}`);
            }
            return { categories, tags, feedback };
        } catch (error) {
            if (CONFIG.devMode) {
                console.warn('Datenbank-API nicht verfügbar.', error);
            }
            throw error;
        }
    }

    async fetchJson(url) {
        const bustUrl = url.includes('?') ? `${url}&v=${ASSET_VERSION}` : `${url}?v=${ASSET_VERSION}`;
        const response = await this.fetchFn(bustUrl, { cache: 'no-store' });
        if (!response.ok) {
            throw new Error(`Request failed for ${bustUrl} (${response.status})`);
        }
        return response.json();
    }
}
