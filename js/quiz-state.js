import { CONFIG, getPointsForDifficulty } from './config.js';

const cloneDeep = value => {
    if (typeof structuredClone === 'function') {
        return structuredClone(value);
    }
    return JSON.parse(JSON.stringify(value));
};

export class QuizState {
    constructor() {
        this.categories = [];
        this.tagsMeta = new Map();
        this.feedbackMessages = {};
        this.tagIndex = new Map();
        this.activeCategoryId = null;
        this.activeTag = null;
        this.selectionLabel = '';
        this.currentSequence = [];
        this.currentIndex = 0;
        this.score = 0;
        this.attempts = 0;
    }

    setData({ categories, tags, feedback }) {
        this.categories = categories;
        this.tagsMeta = new Map(tags.map(tag => [tag.id, tag]));
        this.feedbackMessages = feedback;
        this.buildTagIndex();
    }

    buildTagIndex() {
        this.tagIndex.clear();
        const missingTags = new Set();
        this.categories
            .filter(category => category.enabled)
            .forEach(category => {
                category.questions.forEach(question => {
                    (question.tag || []).forEach(tag => {
                        if (!tag) {
                            return;
                        }
                        if (!this.tagsMeta.has(tag)) {
                            missingTags.add(tag);
                        }
                        if (!this.tagIndex.has(tag)) {
                            this.tagIndex.set(tag, []);
                        }
                        this.tagIndex.get(tag).push({
                            question: cloneDeep(question),
                            categoryId: category.id
                        });
                    });
                });
            });
        if (missingTags.size > 0) {
            console.warn(`Tags ohne Metadaten in tags.json: ${Array.from(missingTags).join(', ')}`);
        }
    }

    getAvailableTags() {
        return Array.from(this.tagIndex.keys())
            .map(tagId => this.tagsMeta.get(tagId) || { id: tagId, title: tagId })
            .sort((a, b) => a.title.localeCompare(b.title, 'de'));
    }

    getCategory(categoryId) {
        return this.categories.find(cat => cat.id === categoryId) || null;
    }

    prepareRoundFromCategory(categoryId, count) {
        const category = this.getCategory(categoryId);
        if (!category) {
            throw new Error(`Unknown category: ${categoryId}`);
        }

        const randomized = QuizState.shuffleArray(
            category.questions.map(question => cloneDeep(question))
        );

        this.currentSequence = this.applyCountLimit(randomized, count);
        this.activeCategoryId = categoryId;
        this.activeTag = null;
        this.selectionLabel = category.title || category.id;
        this.currentIndex = 0;
        this.score = 0;
        this.attempts = 0;
    }

    prepareRoundFromTag(tag, count) {
        const entries = this.tagIndex.get(tag) || [];
        if (!entries.length) {
            throw new Error(`Unknown or empty tag: ${tag}`);
        }

        const randomized = QuizState.shuffleArray(entries.map(entry => ({
            ...cloneDeep(entry.question),
            categoryId: entry.categoryId
        })));

        this.currentSequence = this.applyCountLimit(randomized, count);
        this.activeCategoryId = null;
        this.activeTag = tag;
        this.selectionLabel = tag;
        this.currentIndex = 0;
        this.score = 0;
        this.attempts = 0;
    }

    applyCountLimit(questions, count) {
        if (count === 'all') {
            return questions;
        }
        const limit = Number.parseInt(count, 10);
        if (Number.isNaN(limit)) {
            throw new Error('Invalid question count');
        }
        return questions.slice(0, Math.min(limit, questions.length));
    }

    getAvailableCountForSelection() {
        if (this.activeTag) {
            return (this.tagIndex.get(this.activeTag) || []).length;
        }
        if (this.activeCategoryId) {
            const category = this.getCategory(this.activeCategoryId);
            return category ? category.questions.length : 0;
        }
        return 0;
    }

    getCurrentQuestion() {
        return this.currentSequence[this.currentIndex] ?? null;
    }

    registerAttempt(isCorrect, difficulty) {
        if (isCorrect) {
            this.getCurrentQuestion().answeredCorrectly = true;
            this.score += getPointsForDifficulty(difficulty, this.attempts);
        }
        this.attempts += 1;
    }

    nextQuestion() {
        this.currentIndex += 1;
        this.attempts = 0;
        return this.currentIndex < this.currentSequence.length;
    }

    resetRound() {
        this.currentSequence = [];
        this.currentIndex = 0;
        this.score = 0;
        this.attempts = 0;
        this.activeCategoryId = null;
        this.activeTag = null;
        this.selectionLabel = '';
    }

    getStats() {
        const total = this.currentSequence.length;
        const solved = this.currentSequence.filter(q => q.answeredCorrectly).length;
        const percentage = total === 0 ? 0 : Math.round((solved / total) * 100);
        return { total, solved, percentage, score: this.score };
    }

    static shuffleArray(items) {
        const array = [...items];
        for (let i = array.length - 1; i > 0; i -= 1) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
}
