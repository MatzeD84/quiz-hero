import { ASSET_VERSION } from './config.js';
import { validateCategories, validateFeedback } from './validators.js';

export class QuizDataService {
    constructor({ questionsUrl, feedbackUrl, fetchFn = window.fetch.bind(window) }) {
        this.questionsUrl = questionsUrl;
        this.feedbackUrl = feedbackUrl;
        this.fetchFn = fetchFn;
        this.cache = null;
    }

    async loadAll() {
        if (this.cache) {
            return this.cache;
        }

        const [questionsPayload, feedback] = await Promise.all([
            this.fetchJson(this.questionsUrl),
            this.fetchJson(this.feedbackUrl)
        ]);

        const feedbackErrors = validateFeedback(feedback);
        if (feedbackErrors.length) {
            throw new Error(`Ungültige feedback.json:\n${feedbackErrors.join('\n')}`);
        }

        const categories = questionsPayload.categories ?? [];
        const validationErrors = validateCategories(categories);
        if (validationErrors.length > 0) {
            throw new Error(`Ungültige questions.json:\n${validationErrors.join('\n')}`);
        }

        this.cache = { categories, feedback };
        return this.cache;
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
