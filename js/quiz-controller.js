import { CONFIG, LABELS } from './config.js';

export class QuizController {
    constructor({ dataService, state, view }) {
        this.dataService = dataService;
        this.state = state;
        this.view = view;
    }

    async init() {
        this.view.showLoadingMessage(LABELS.status.loading);
        try {
            const data = await this.dataService.loadAll();
            this.state.setData(data);
            this.view.renderCategoryButtons(data.categories);
            this.view.renderTagButtons(this.state.getAvailableTags());
            this.registerEvents();
            this.view.showCategories();
            this.applyInitialSelectionFromUrl();
        } catch (error) {
            if (CONFIG.devMode) {
                console.error(error);
            }
            this.view.showLoadingMessage(LABELS.status.loadError);
        }
    }

    applyInitialSelectionFromUrl() {
        const params = new URLSearchParams(window.location.search);
        const categoryId = params.get('category');
        const tag = params.get('tag');

        if (categoryId) {
            this.handleCategorySelected(categoryId);
            return;
        }
        if (tag) {
            this.handleTagSelected(tag);
        }
    }

    updateSelectionInUrl({ categoryId = '', tag = '' }) {
        const params = new URLSearchParams(window.location.search);
        params.delete('category');
        params.delete('tag');
        if (categoryId) {
            params.set('category', categoryId);
        }
        if (tag) {
            params.set('tag', tag);
        }
        const query = params.toString();
        const nextUrl = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`;
        window.history.replaceState({}, '', nextUrl);
    }

    clearSelectionFromUrl() {
        const nextUrl = `${window.location.pathname}${window.location.hash}`;
        window.history.replaceState({}, '', nextUrl);
    }

    registerEvents() {
        this.view.onCategorySelected(categoryId => this.handleCategorySelected(categoryId));
        this.view.onTagSelected(tag => this.handleTagSelected(tag));
        this.view.onQuestionCountSelected(count => this.handleQuestionCountSelected(count));
        this.view.onAnswerSelected(index => this.handleAnswerSelected(index));
        this.view.onNext(() => this.handleNextQuestion());
        this.view.onAbort(() => this.handleAbort());
        this.view.onHome(() => this.handleAbort());
        this.view.onModalClose(() => this.view.hideResultModal());
    }

    handleCategorySelected(categoryId) {
        const category = this.state.getCategory(categoryId);
        if (!category || !category.enabled) {
            return;
        }
        this.state.activeCategoryId = categoryId;
        this.state.activeTag = null;
        this.state.selectionLabel = category.title || category.id;
        this.state.selectionDescription = category.description || '';
        this.state.selectionIcon = category.icon || '';
        this.view.renderSelectionLabel(this.state.selectionLabel);
        this.view.renderSelectionDetails({
            description: this.state.selectionDescription,
            icon: this.state.selectionIcon,
            label: this.state.selectionLabel
        });
        this.view.updateQuestionCountButtons(this.state.getAvailableCountForSelection());
        this.view.showQuestionCount();
        this.updateSelectionInUrl({ categoryId });
    }

    handleTagSelected(tag) {
        if (!this.state.tagIndex.has(tag)) {
            return;
        }
        this.state.activeTag = tag;
        this.state.activeCategoryId = null;
        const meta = this.state.getTagMeta(tag);
        this.state.selectionLabel = meta.title || meta.id;
        this.state.selectionDescription = meta.description || '';
        this.state.selectionIcon = meta.icon || '';
        this.view.renderSelectionLabel(this.state.selectionLabel);
        this.view.renderSelectionDetails({
            description: this.state.selectionDescription,
            icon: this.state.selectionIcon,
            label: this.state.selectionLabel
        });
        this.view.updateQuestionCountButtons(this.state.getAvailableCountForSelection());
        this.view.showQuestionCount();
        this.updateSelectionInUrl({ tag });
    }

    handleQuestionCountSelected(count) {
        try {
            if (this.state.activeTag) {
                this.state.prepareRoundFromTag(this.state.activeTag, count);
            } else if (this.state.activeCategoryId) {
                this.state.prepareRoundFromCategory(this.state.activeCategoryId, count);
            } else {
                return;
            }
            this.view.renderQuizSelectionLabel(this.state.selectionLabel);
            this.view.showQuiz();
            this.renderCurrentQuestion();
            this.view.updateScore(this.state.score);
        } catch (error) {
            if (CONFIG.devMode) {
                console.error(error);
            }
            this.view.showLoadingMessage(LABELS.status.fetchError);
        }
    }

    renderCurrentQuestion() {
        const question = this.state.getCurrentQuestion();
        if (!question) {
            this.handleAbort();
            return;
        }
        this.view.renderQuestion(question, {
            index: this.state.currentIndex + 1,
            total: this.state.currentSequence.length,
            selectionLabel: this.state.selectionLabel
        });
    }

    handleAnswerSelected(index) {
        const question = this.state.getCurrentQuestion();
        if (!question || this.state.attempts >= CONFIG.maxAttempts) {
            return;
        }

        const isCorrect = index === question.correct;
        const difficulty = question.difficulty || CONFIG.score.defaultDifficulty;

        this.view.markAnswerButton(index, isCorrect);

        const feedbackArray = this.pickFeedbackArray(question, isCorrect);
        const message = this.pickRandomEntry(feedbackArray);
        this.view.renderFeedback(message, { isCorrect });
        this.state.registerAttempt(isCorrect, difficulty);
        if (!isCorrect && this.state.attempts < CONFIG.maxAttempts) {
            this.view.disableAnswerButton(index);
        }
        this.view.updateScore(this.state.score, { isCorrect });

        const backgroundKnowledgeText = (question.backgroundKnowledge || '').trim();
        const shouldRevealBackgroundKnowledge = Boolean(backgroundKnowledgeText) && (isCorrect || this.state.attempts >= CONFIG.maxAttempts);

        if (isCorrect || this.state.attempts >= CONFIG.maxAttempts) {
            if (!isCorrect) {
                this.view.highlightCorrectAnswer(question.correct);
            }
            if (shouldRevealBackgroundKnowledge) {
                this.view.renderBackgroundKnowledge(backgroundKnowledgeText);
            } else if (!backgroundKnowledgeText) {
                this.view.renderBackgroundKnowledge('');
            }
            this.view.lockAnswers();
        }
    }

    pickFeedbackArray(question, isCorrect) {
        const messages = this.state.feedbackMessages;
        const difficulty = question.difficulty || CONFIG.score.defaultDifficulty;

        if (isCorrect) {
            if (difficulty === 'hero' && this.state.attempts === 0) {
                return messages.difficultCorrectFirstTry ?? messages.correctFirstTry;
            }
            return this.state.attempts === 0 ? messages.correctFirstTry : messages.correctSecondTry;
        }

        return this.state.attempts === 0 ? messages.incorrectFirstTry : messages.incorrectSecondTry;
    }

    pickRandomEntry(arr = []) {
        if (!Array.isArray(arr) || arr.length === 0) {
            return '';
        }
        return arr[Math.floor(Math.random() * arr.length)];
    }

    handleNextQuestion() {
        const hasMore = this.state.nextQuestion();
        if (hasMore) {
            this.renderCurrentQuestion();
        } else {
            const stats = this.state.getStats();
            this.view.showResultModal(stats);
            this.state.resetRound();
            this.view.showCategories();
            this.clearSelectionFromUrl();
        }
    }

    handleAbort() {
        this.state.resetRound();
        this.view.showCategories();
        this.view.hideResultModal();
        this.view.updateScore(this.state.score);
        this.view.renderSelectionLabel('');
        this.view.renderSelectionDetails({ description: '', icon: '', label: '' });
        if (this.view.elements.quizSelectionLabel) {
            this.view.elements.quizSelectionLabel.textContent = '';
        }
        this.clearSelectionFromUrl();
    }
}
