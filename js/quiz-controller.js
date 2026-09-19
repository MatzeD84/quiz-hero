import { CONFIG, LABELS } from './config.js?v=dev';
import { ACCOUNT_REMOVED_MESSAGE, SESSION_EXPIRED_MESSAGE } from './user-service.js?v=dev';
import { applyAccountHeaderLogo } from './account-logo.js?v=dev';

export class QuizController {
    constructor({ dataService, state, view, userService = null }) {
        this.dataService = dataService;
        this.state = state;
        this.view = view;
        this.userService = userService;
        this.currentUser = userService?.getStoredUser() ?? null;
    }

    async init() {
        this.view.showLoadingMessage(LABELS.status.loading);
        try {
            const data = await this.dataService.loadAll();
            this.state.setData(data);
            this.view.renderCategoryButtons(data.categories);
            this.view.renderTagButtons(this.state.getAvailableTags());
            this.view.initAccountUi?.();
            this.registerEvents();
            const accountRemoved = await this.validateStoredUser();
            this.view.renderUser(this.currentUser);
            applyAccountHeaderLogo(this.currentUser);
            if (accountRemoved) {
                this.view.renderUserStatus(this.accountStatusMessage || ACCOUNT_REMOVED_MESSAGE, 'info');
            }
            this.view.showCategories();
            this.applyInitialSelectionFromUrl();
        } catch (error) {
            if (CONFIG.devMode) {
                console.error(error);
            }
            this.view.showLoadingMessage(LABELS.status.loadError);
        }
    }

    async validateStoredUser() {
        if (!this.userService || !this.currentUser) return false;
        try {
            this.currentUser = await this.userService.getCurrentUser(this.currentUser);
            return false;
        } catch (error) {
            if ([ACCOUNT_REMOVED_MESSAGE, SESSION_EXPIRED_MESSAGE].includes(error.message)) {
                this.currentUser = null;
                this.accountStatusMessage = error.message;
                return true;
            }
            if (CONFIG.devMode) {
                console.warn('Account konnte nicht geprueft werden.', error);
            }
            return false;
        }
    }

    handleRemovedAccount(message = ACCOUNT_REMOVED_MESSAGE) {
        this.accountStatusMessage = message;
        this.currentUser = null;
        this.view.renderUser(null);
        applyAccountHeaderLogo(null);
        this.view.renderUserStatus(ACCOUNT_REMOVED_MESSAGE, 'info');
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
        this.view.onUserAccountUpdate?.(data => this.handleUserAccountUpdate(data));
        this.view.onUserDelete?.(() => this.handleUserDelete());
        this.view.onUserLogout?.(() => this.handleUserLogout());
        this.view.initQuestionFeedbackModal?.();
        this.view.onQuestionFeedbackOpen?.(() => this.view.openQuestionFeedbackModal());
        this.view.onQuestionFeedbackSubmit?.(data => this.handleQuestionFeedbackSubmit(data));
    }

    async handleUserAccountUpdate(data) {
        if (!this.userService || !this.currentUser) return;
        try {
            this.currentUser = await this.userService.updateAccount(this.currentUser, data);
            this.view.renderUser(this.currentUser);
            applyAccountHeaderLogo(this.currentUser);
            this.view.renderUserStatus('Account gespeichert.', 'success');
        } catch (error) {
            if ([ACCOUNT_REMOVED_MESSAGE, SESSION_EXPIRED_MESSAGE].includes(error.message)) {
                this.handleRemovedAccount(error.message);
                return;
            }
            this.view.renderUserStatus(error.message || 'Account konnte nicht gespeichert werden.', 'error');
        }
    }

    async handleUserDelete() {
        if (!this.userService || !this.currentUser) return;
        window.location.href = "account.html";
    }

    async handleUserLogout() {
        try {
            await this.userService?.logout(this.currentUser);
        } catch (error) {
            if (error.message !== SESSION_EXPIRED_MESSAGE) {
                this.view.renderUserStatus(error.message, 'error');
                return;
            }
        }
        this.currentUser = null;
        this.view.renderUser(null);
        applyAccountHeaderLogo(null);
        this.view.renderUserStatus('Du spielst jetzt ohne gespeichertes Profil.', 'info');
    }

    handleCategorySelected(categoryId) {
        const category = this.state.getCategory(categoryId);
        if (!category || category.enabled === false) {
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

    async handleQuestionFeedbackSubmit({ types, comment }) {
        if (!this.userService) return;
        const question = this.state.getCurrentQuestion();
        if (!question?.id) {
            this.view.renderQuestionFeedbackStatus('Feedback ist für diese Frage gerade nicht möglich.', 'error');
            return;
        }
        if ((!types || types.length === 0) && !String(comment || '').trim()) {
            this.view.renderQuestionFeedbackStatus('Bitte wähle mindestens einen Punkt aus oder schreibe einen Kommentar.', 'error');
            return;
        }
        this.view.renderQuestionFeedbackStatus('Feedback wird gesendet ...', 'info');
        try {
            await this.userService.submitQuestionFeedback(this.currentUser, {
                questionId: question.id,
                types,
                comment
            });
            this.view.renderQuestionFeedbackStatus('Danke, dein Feedback wurde gesendet.', 'success');
            window.setTimeout(() => this.view.closeQuestionFeedbackModal(), 900);
        } catch (error) {
            if ([ACCOUNT_REMOVED_MESSAGE, SESSION_EXPIRED_MESSAGE].includes(error.message)) {
                this.handleRemovedAccount(error.message);
                this.view.closeQuestionFeedbackModal();
                return;
            }
            this.view.renderQuestionFeedbackStatus(error.message || 'Feedback konnte nicht gesendet werden.', 'error');
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
            const context = {
                categoryId: this.state.activeCategoryId,
                tagId: this.state.activeTag,
                count: stats.total
            };
            this.userService?.saveResult(this.currentUser, stats, context).catch(error => {
                if ([ACCOUNT_REMOVED_MESSAGE, SESSION_EXPIRED_MESSAGE].includes(error.message)) {
                    this.handleRemovedAccount(error.message);
                    return;
                }
                if (CONFIG.devMode) {
                    console.warn('Quiz-Ergebnis konnte nicht gespeichert werden.', error);
                }
            });
            this.view.showResultModal(stats, this.currentUser, {
                onRetry: () => this.handleRetryRound(context),
                onOverview: () => this.handleResultOverview()
            });
            this.state.resetRound();
            this.view.showCategories();
            this.clearSelectionFromUrl();
        }
    }

    handleRetryRound(context) {
        if (context.categoryId) {
            this.handleCategorySelected(context.categoryId);
        } else if (context.tagId) {
            this.handleTagSelected(context.tagId);
        } else {
            this.handleResultOverview();
            return;
        }
        this.handleQuestionCountSelected(context.count);
    }

    handleResultOverview() {
        this.state.resetRound();
        this.view.showCategories();
        this.view.updateScore(this.state.score);
        this.view.renderSelectionLabel('');
        this.view.renderSelectionDetails({ description: '', icon: '', label: '' });
        if (this.view.elements.quizSelectionLabel) {
            this.view.elements.quizSelectionLabel.textContent = '';
        }
        this.clearSelectionFromUrl();
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
