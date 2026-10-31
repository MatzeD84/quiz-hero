import { readQuizInvitation } from './quiz-invitation.js?v=dev';
import { CONFIG, LABELS } from './config.js?v=dev';
import { ACCOUNT_REMOVED_MESSAGE, SESSION_EXPIRED_MESSAGE } from './user-service.js?v=dev';
import { applyAccountHeaderLogo } from './account-logo.js?v=dev';
import { abilityUseReason } from './hero-abilities.js?v=dev';
import { renderAbilityControls, closeAbilityControls } from './quiz-abilities.js?v=dev';
import { showSaveNotice } from './save-notice.js?v=dev';

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
            // World assignments are managed in admin; public world selection is deferred.
            this.state.selectWorld(null);
            this.clearLegacySavedRound();
            this.view.renderCategoryButtons(this.state.categories);
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
            await this.applyInitialSelectionFromUrl();
        } catch (error) {
            if (CONFIG.devMode) {
                console.error(error);
            }
            this.view.showLoadingMessage(LABELS.status.loadError);
        }
    }

    clearLegacySavedRound() {
        try {
            window.sessionStorage.removeItem('quiz-hero-round-v1');
        } catch {
            // The browser may block session storage; no quiz state is written anymore.
        }
    }

    async validateStoredUser() {
        if (!this.userService) return false;
        const hadCachedUser = Boolean(this.currentUser);
        try {
            this.currentUser = await this.userService.getCurrentUser(this.currentUser);
            return false;
        } catch (error) {
            if ([ACCOUNT_REMOVED_MESSAGE, SESSION_EXPIRED_MESSAGE].includes(error.message)) {
                this.currentUser = null;
                this.accountStatusMessage = hadCachedUser ? error.message : null;
                return hadCachedUser;
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
        this.view.renderUserStatus(message, 'info');
    }

    async applyInitialSelectionFromUrl() {
        const params = new URLSearchParams(window.location.search);
        const categoryId = params.get('category');
        const tag = params.get('tag');

        const validCategory = categoryId && this.state.getCategory(categoryId)?.enabled !== false && this.state.getCategory(categoryId);
        const validTag = !categoryId && tag && this.state.tagIndex.has(tag);
        if (validCategory) this.handleCategorySelected(categoryId);
        else if (validTag) this.handleTagSelected(tag);
        else return;
        if (params.get('practice') === '1' && validCategory) {
            if (!this.currentUser) {
                this.view.showCategories();
                this.view.renderUserStatus('Bitte melde dich an und öffne deine Übungsrunde im Reisepass.', 'info');
                return;
            }
            try {
                const selectionRequest = this.selectionRequest;
                const journey = await this.userService.getJourney();
                if (selectionRequest !== this.selectionRequest) return;
                const selection = journey.practice?.find(item => item.id === categoryId);
                if (!selection?.count) {
                    this.view.showCategories();
                    this.view.renderUserStatus('Hier sind gerade keine Fragen zum Üben offen. Deinen aktuellen Stand findest du im Reisepass.', 'info');
                    return;
                }
                this.practiceMode = true;
                const count = Math.min(10, selection.count);
                this.view.renderInvitation({ label: this.state.selectionLabel, count, practice: true, onStart: () => this.handleQuestionCountSelected(count) });
            } catch (error) {
                this.view.showCategories();
                this.view.renderUserStatus(error.message || 'Die Übungsfragen konnten nicht geladen werden. Bitte versuche es im Reisepass erneut.', 'error');
            }
            return;
        }
        const invitation = readQuizInvitation(params);
        if (invitation) {
            const available = this.state.getAvailableCountForSelection();
            const count = Math.min(invitation.count, available);
            if (count > 0) this.view.renderInvitation({ label: this.state.selectionLabel, count, reduced: count < invitation.count, onStart: () => this.handleQuestionCountSelected(count) });
        }
    }

    updateSelectionInUrl({ categoryId = '', tag = '' }) {
        const params = new URLSearchParams(window.location.search);
        params.delete('category');
        params.delete('tag');
        params.delete('invite');
        params.delete('count');
        params.delete('practice');
        if (categoryId) {
            params.set('category', categoryId);
        }
        if (tag) {
            params.set('tag', tag);
        }
        params.delete('world');
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
        this.selectionRequest = (this.selectionRequest || 0) + 1;
        this.practiceMode = false;
        this.view.clearInvitation();
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
        this.selectionRequest = (this.selectionRequest || 0) + 1;
        this.practiceMode = false;
        this.view.clearInvitation();
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

    async handleQuestionCountSelected(count) {
        if (this.startingRound) return;
        this.startingRound = true;
        try {
            if (this.state.activeTag) {
                this.state.prepareRoundFromTag(this.state.activeTag, count);
            } else if (this.state.activeCategoryId) {
                this.state.prepareRoundFromCategory(this.state.activeCategoryId, count);
            } else {
                return;
            }
            this.state.roundId = null;
            this.roundAbilities = [];this.usedAbilities = {};this.roundHero = null;this.abilityPending = null;this.abilityBusy = false;this.abilityMessage = '';
            if (this.practiceMode && !this.currentUser) throw new Error('Bitte melde dich erneut an.');
            this.currentRoundIsPractice = false;
            if (this.currentUser) {
                const sequence = this.state.currentSequence;
                const round = await this.userService.startRound(this.practiceMode ? [] : sequence.map(question => question.id), { categoryId: this.state.activeCategoryId, tagId: this.state.activeTag, practice: this.practiceMode, worldId: this.practiceMode ? null : this.state.activeWorldId });
                if (this.state.currentSequence !== sequence) return;
                this.state.roundId = round.roundId;
                this.state.currentSequence = round.questions;
                this.roundAbilities = round.abilities || [];
                this.currentRoundIsPractice = Boolean(round.isPractice);
                this.roundHero = (this.currentUser.availableAvatars || []).find(a => a.key === this.currentUser.avatarKey) || { label: 'Dein Held', url: this.currentUser.profileImageUrl };
            }
            this.view.renderQuizSelectionLabel(this.state.selectionLabel);
            this.view.renderRoundMode?.(this.currentRoundIsPractice);
            this.view.showQuiz();
            this.renderCurrentQuestion();
            this.view.updateScore(this.state.score);
        } catch (error) {
            if (CONFIG.devMode) {
                console.error(error);
            }
            this.view.showLoadingMessage(error.message || LABELS.status.fetchError);
        } finally {
            this.startingRound = false;
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
        this.renderAbility();
    }

    renderAbility() {
        const content = this.view.elements?.quizContent;if (!content) return;
        let bar = content.querySelector('.hero-abilities__bar');
        if (!bar) { bar = document.createElement('div');bar.className = 'hero-abilities__bar';content.querySelector('.quiz__answer').before(bar); }
        renderAbilityControls(bar, {
            abilities: this.roundAbilities || [], question: this.state.getCurrentQuestion(), attempts: this.state.attempts,
            used: this.usedAbilities, pendingId: this.abilityPending?.abilityId, busy: this.abilityBusy,
            hero: this.roundHero,
            message: this.abilityMessage, onUse: id => this.handleAbility(id)
        });
    }

    async handleAbility(abilityId) {
        const ability = (this.roundAbilities || []).find(a => a.id === (this.abilityPending?.abilityId || abilityId));
        if (!ability || this.abilityBusy || (!this.abilityPending && abilityUseReason(ability, this.state.getCurrentQuestion(), this.state.attempts, this.usedAbilities?.[ability.id]))) return;
        const roundId = this.state.roundId, position = this.state.currentIndex, question = this.state.getCurrentQuestion();
        if (!this.abilityPending) this.abilityPending = { roundId, position, abilityId: ability.id, actionId: Array.from(crypto.getRandomValues(new Uint8Array(16)), n => n.toString(16).padStart(2, '0')).join(''), answers: this.state.currentSequence.slice(0, position + 1).map(q => ({ questionId: q.id, selectedAnswers: [...(q.selectedAnswers || [])] })) };
        this.abilityBusy = true;this.abilityMessage = 'Fähigkeit wird eingesetzt …';this.renderAbility();
        const buttons = this.view.elements.answerButtons;
        buttons.forEach(button => { button.disabled = true; });
        try {
            const result = await this.userService.useAbility(this.abilityPending);
            if (this.state.roundId !== roundId) return;
            this.abilityPending = null;(this.usedAbilities ||= {})[ability.id] = true;this.abilityMessage = '';
            if (result.effect === 'swap') { this.state.currentSequence[position] = result.question;this.state.attempts = 0;this.renderCurrentQuestion(); }
            else {
                if (result.effect === 'shield') { question.abilityShield = true;this.view.renderFeedback('Noch eine Chance – jetzt für 2 Punkte.', { canRetry: true }); }
                if (result.effect === 'eliminate') (question.removedAnswers ||= []).push(result.removedAnswer);
                if(result.effect==='focus'){
                    question.abilityFocus=true;(question.removedAnswers ||= []).push(...result.removedAnswers);
                    this.view.renderFeedback('2 Punkte im ersten Versuch · mit Scharfblick',{isHint:true});
                }
                if(result.effect==='lucky'){
                    question.abilityLucky=true;
                    this.view.renderFeedback('Noch eine Chance – 1 Punkt, auch bei falscher Antwort.',{canRetry:true});
                }
            }
            const supported=this.state.getCurrentQuestion();supported.abilityApplied=true;
            if(['focus','lucky'].includes(result.effect))supported.abilityExclusive=true;
        } catch (error) {
            if (this.state.roundId !== roundId) return;
            if (error.definitive) this.abilityPending = null;
            this.abilityMessage = error.message + (this.abilityPending ? ' Bitte den Einsatz erneut prüfen, bevor du weiterspielst.' : ' Dein Einsatz bleibt verfügbar.');
        } finally {
            if (this.state.roundId === roundId) {
                this.abilityBusy = false;
                const current = this.state.getCurrentQuestion();
                buttons.forEach((button, index) => {
                    const removed = current.removedAnswers?.includes(index);
                    button.disabled = Boolean(this.abilityPending || current.selectedAnswers?.includes(index) || removed || current.answeredCorrectly || this.state.attempts >= 2);
                    if (removed) button.textContent = 'Durch Fähigkeit ausgeblendet';
                });
                this.renderAbility();
                if (this.abilityPending) this.view.elements.quizContent?.querySelector('.hero-abilities__bar button:not([disabled])')?.focus({ preventScroll: true });
                else buttons.find(button => !button.disabled)?.focus?.({ preventScroll: true });
            }
        }
    }

    handleAnswerSelected(index) {
        if (this.abilityBusy || this.abilityPending) return;
        const question = this.state.getCurrentQuestion();
        if (!question || question.answeredCorrectly || !Number.isInteger(index) || index < 0 || index > 3 || question.removedAnswers?.includes(index) || question.selectedAnswers?.includes(index) || this.state.attempts >= CONFIG.maxAttempts) {
            return;
        }

        const isCorrect = index === question.correct;
        const difficulty = question.difficulty || CONFIG.score.defaultDifficulty;

        this.view.markAnswerButton(index, isCorrect);

        const feedbackArray = this.pickFeedbackArray(question, isCorrect);
        const message = this.pickRandomEntry(feedbackArray);
        const canRetry = !isCorrect && this.state.attempts + 1 < CONFIG.maxAttempts;
        const retryPoints = CONFIG.score.secondTry;
        let feedbackMessage = canRetry
            ? `Noch eine Chance – jetzt für ${retryPoints} ${retryPoints === 1 ? 'Punkt' : 'Punkte'}.`
            : message;
        if(!isCorrect&&!canRetry&&question.abilityLucky)feedbackMessage='Leider falsch – dein Glücksanker sichert dir 1 Trostpunkt.';
        this.view.renderFeedback(feedbackMessage, { isCorrect, canRetry });
        const pointsGained = this.state.registerAttempt(isCorrect, difficulty);
        (question.selectedAnswers ||= []).push(index);
        if (!isCorrect && this.state.attempts < CONFIG.maxAttempts) {
            this.view.disableAnswerButton(index);
        }
        this.view.updateScore(this.state.score, { pointsGained });

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
        this.renderAbility();
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
            this.view.elements.questionFeedbackForm?.reset();
            this.view.renderQuestionFeedbackStatus('Danke, dein Feedback wurde gesendet.', 'success');
            this.view.closeQuestionFeedbackModal();showSaveNotice('Feedback gespeichert. Vielen Dank!');
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
        if (this.abilityBusy || this.abilityPending) return;
        const question = this.state.getCurrentQuestion();
        if (!question || (!question.answeredCorrectly && this.state.attempts < CONFIG.maxAttempts && !question.skipped)) return;
        const hasMore = this.state.nextQuestion();
        if (hasMore) {
            this.renderCurrentQuestion();
        } else {
            const stats = this.state.getStats();
            const context = {
                categoryId: this.state.activeCategoryId,
                worldId: this.state.activeWorldId,
                tagId: this.state.activeTag,
                roundId: this.state.roundId,
                answers: this.state.currentSequence.map(question => ({ questionId: question.id, selectedAnswers: [...(question.selectedAnswers || [])] })),
                count: stats.total
            };
            const roundUser = this.currentUser;
            const isPractice = this.currentRoundIsPractice;
            let souvenirAwards = [];
            let avatarRewards = [];
            let abilityAwards = [];
            const saveRound = () => roundUser
                ? this.userService.saveResult(roundUser, stats, context).then(data => { souvenirAwards = data?.souvenirs || []; avatarRewards = data?.avatarRewards || []; abilityAwards = data?.abilityAwards || []; return null; }).catch(error => {
                    if ([ACCOUNT_REMOVED_MESSAGE, SESSION_EXPIRED_MESSAGE].includes(error.message)) this.handleRemovedAccount(error.message);
                    return 'Ergebnis nicht im Profil gespeichert: ' + (error.message || 'Verbindungsfehler.');
                })
                : Promise.resolve(null);
            const saveStatus = saveRound();
            this.view.showResultModal(stats, roundUser, {
                saveStatus,
                getSouvenirs: () => souvenirAwards,
                getAvatarRewards: () => avatarRewards,
                getAbilityAwards: () => abilityAwards,
                abilityHeroName: this.roundHero?.label || 'Dein Held',
                retrySave: roundUser ? saveRound : null,
                practice: isPractice,
                shareContext: { label: this.state.selectionLabel, image: this.state.selectionIcon, categoryId: context.categoryId, tagId: context.tagId, worldId: context.worldId },
                onOverview: () => isPractice ? window.location.assign('reisepass.html') : this.handleResultOverview()
            });
            this.practiceMode = false;
            this.currentRoundIsPractice = false;
            this.state.resetRound();
            this.view.showCategories();
            this.clearSelectionFromUrl();
        }
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
        closeAbilityControls(this.view.elements?.quizContent?.querySelector('.hero-abilities__bar'));
        this.selectionRequest = (this.selectionRequest || 0) + 1;
        this.practiceMode = false;
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
