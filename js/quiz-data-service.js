import { ASSET_VERSION, CONFIG } from './config.js';
import { validateCategories, validateFeedback, validateTags } from './validators.js';

export class QuizDataService {
    constructor({ questionsUrl, tagsUrl, feedbackUrl, fetchFn = window.fetch.bind(window) }) {
        this.questionsUrl = questionsUrl;
        this.tagsUrl = tagsUrl;
        this.feedbackUrl = feedbackUrl;
        this.fetchFn = fetchFn;
        this.cache = null;
    }

    async loadAll() {
        if (this.cache) {
            return this.cache;
        }

        const [categoriesManifest, tagsData, feedback] = await Promise.all([
            this.fetchJson(this.questionsUrl),
            this.fetchJson(this.tagsUrl),
            this.fetchJson(this.feedbackUrl)
        ]);

        const feedbackErrors = validateFeedback(feedback);
        if (feedbackErrors.length) {
            throw new Error(`Ung\u00fcltige feedback.json:\n${feedbackErrors.join('\n')}`);
        }

        const tagErrors = validateTags(tagsData.tags ?? []);
        if (tagErrors.length) {
            throw new Error(`Ung\u00fcltige tags.json:\n${tagErrors.join('\n')}`);
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

    async fetchJson(url) {
        const bustUrl = url.includes('?') ? `${url}&v=${ASSET_VERSION}` : `${url}?v=${ASSET_VERSION}`;
        const response = await this.fetchFn(bustUrl, { cache: 'no-store' });
        if (!response.ok) {
            throw new Error(`Request failed for ${bustUrl} (${response.status})`);
        }
        return response.json();
    }
}
