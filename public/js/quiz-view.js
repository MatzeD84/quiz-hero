import { renderSouvenirUnlock } from './souvenirs.js?v=dev';
import { renderAccountMenu, closeAccountMenus, placeAccountMenu } from './account-menu.js?v=dev';
import { openDialog, closeDialog } from './dialog.js?v=dev';
import { CONFIG, LABELS, SELECTORS, getPointsForDifficulty } from './config.js?v=dev';
import { applyImageWatermark, clearImageWatermark } from './image-watermark.js?v=dev';
import { revealStatus } from './status-navigation.js?v=dev';
import { bindResultShare } from './result-share.js?v=dev';

export class QuizView {
    constructor(selectors = SELECTORS) {
        this.elements = this.mapElements(selectors);
        this.resultModalTemplate = null;
        this.resultModalLoading = null;
    }

    mapElements(selectors) {
        return {
            categoryContainer: document.querySelector(selectors.categoryContainer),
            categoryList: document.querySelector(selectors.categoryList) ?? document.querySelector(selectors.categoryContainer),
            tagContainer: document.querySelector(selectors.tagContainer),
            tagList: document.querySelector(selectors.tagList),
            questionCountContainer: document.querySelector(selectors.questionCountContainer),
            quizContent: document.querySelector(selectors.quizContent),
            questionElement: document.querySelector(selectors.questionElement),
            questionImage: document.querySelector(selectors.questionImage),
            answerButtons: Array.from(document.querySelectorAll(selectors.answerButtons)),
            questionCountButtons: Array.from(document.querySelectorAll(selectors.questionCountButtons)),
            backToCategoryButton: document.querySelector(selectors.backToCategoryButton),
            abortButton: document.querySelector(selectors.abortButton),
            nextButton: document.querySelector(selectors.nextButton),
            feedbackContainer: document.querySelector(selectors.feedbackContainer),
            feedbackElement: document.querySelector(selectors.feedbackElement),
            feedbackIconCorrect: document.querySelector(selectors.feedbackIconCorrect),
            feedbackIconIncorrect: document.querySelector(selectors.feedbackIconIncorrect),
            questionFeedbackOpen: document.querySelector(selectors.questionFeedbackOpen),
            questionFeedbackModal: document.querySelector(selectors.questionFeedbackModal),
            questionFeedbackClose: document.querySelector(selectors.questionFeedbackClose),
            questionFeedbackForm: document.querySelector(selectors.questionFeedbackForm),
            questionFeedbackComment: document.querySelector(selectors.questionFeedbackComment),
            questionFeedbackStatus: document.querySelector(selectors.questionFeedbackStatus),
            backgroundKnowledge: document.querySelector(selectors.backgroundKnowledge),
            currentQuestion: document.querySelector(selectors.currentQuestion),
            totalQuestions: document.querySelector(selectors.totalQuestions),
            score: document.querySelector(selectors.score),
            scoreChange: document.querySelector(selectors.scoreChange),
            quizHeadertext: document.querySelector(selectors.quizHeadertext),
            selectionLabel: document.querySelector(selectors.selectionLabel),
            selectionDescription: document.querySelector(selectors.selectionDescription),
            selectionIcon: document.querySelector(selectors.selectionIcon),
            quizSelectionLabel: document.querySelector(selectors.quizSelectionLabel),
            modal: document.querySelector(selectors.modal),
            modalContent: document.querySelector(selectors.modalContent),
            modalCloseButton: document.querySelector(selectors.modalCloseButton),
            homeLinks: Array.from(document.querySelectorAll('.js-home-link')),
            userPanel: document.querySelector(selectors.userPanel),
            userAccountForm: document.querySelector(selectors.userAccountForm),
            userAccountNameInput: document.querySelector(selectors.userAccountNameInput),
            userAccountPasswordInput: document.querySelector(selectors.userAccountPasswordInput),
            userTabs: Array.from(document.querySelectorAll(selectors.userTabs)),
            userPanels: Array.from(document.querySelectorAll(selectors.userPanels)),
            userDeleteButton: document.querySelector(selectors.userDeleteButton),
            userStatus: document.querySelector(selectors.userStatus),
            userPreview: document.querySelector(selectors.userPreview),
            userLogoutButton: document.querySelector(selectors.userLogoutButton)
        };
    }

    initAccountUi() {
        this.elements.userTabs.forEach(button => {
            button.addEventListener('click', () => this.showAccountView(button.dataset.accountView));
        });
    }

    showAccountView(view) {
        this.elements.userPanels.forEach(panel => {
            panel.classList.toggle('u-hidden', panel.dataset.accountPanel !== view);
        });
        this.elements.userTabs.forEach(tab => {
            tab.classList.toggle('btn--disabled', tab.dataset.accountView === view);
        });
    }

    renderCategoryButtons(categories) {
        const wrapper = this.elements.categoryList;
        if (!wrapper) return;

        wrapper.innerHTML = '';
        categories.forEach(category => {
            if (category.enabled === false) {
                return;
            }

            const button = document.createElement('button');
            button.className = 'js-category-btn btn btn--category category-card';
            button.dataset.category = category.id;
            button.type = 'button';

            if (category.badge?.active) {
                const badge = document.createElement('span');
                badge.className = 'category-card__badge';
                badge.textContent = category.badge.text || 'Neu';
                button.appendChild(badge);
            }

            if (category.icon) {
                const icon = document.createElement('img');
                icon.src = category.icon;
                icon.alt = `${category.title} Icon`;
                icon.width = 1536;
                icon.height = 1024;
                icon.loading = 'lazy';
                icon.classList.add('category-card__icon');
                button.appendChild(icon);
            }

            const textWrapper = document.createElement('div');
            textWrapper.className = 'category-card__text';

            const titleEl = document.createElement('span');
            titleEl.className = 'category-card__title';
            titleEl.textContent = category.title;
            textWrapper.appendChild(titleEl);

            const ctaEl = document.createElement('span');
            ctaEl.className = 'category-card__cta';
            ctaEl.textContent = 'Quiz starten';
            textWrapper.appendChild(ctaEl);

            button.appendChild(textWrapper);

            const card = document.createElement('div');
            card.append(button);
            wrapper.appendChild(card);
        });
    }

    renderTagButtons(tags) {
        const wrapper = this.elements.tagList;
        if (!wrapper) return;

        wrapper.innerHTML = '';

        tags.forEach(tag => {
            const button = document.createElement('button');
            button.className = 'js-tag-btn btn btn--tag tag-card';
            button.dataset.tag = tag.id;
            button.type = 'button';

            if (tag.badge?.active) {
                const badge = document.createElement('span');
                badge.className = 'tag-card__badge';
                badge.textContent = tag.badge.text || 'Neu';
                button.appendChild(badge);
            }

            if (tag.icon) {
                const icon = document.createElement('img');
                icon.src = tag.icon;
                icon.alt = `${tag.title} Icon`;
                icon.width = 1536;
                icon.height = 1024;
                icon.loading = 'lazy';
                icon.classList.add('tag-card__icon');
                button.appendChild(icon);
            }

            const textWrapper = document.createElement('div');
            textWrapper.className = 'tag-card__text';

            const titleEl = document.createElement('span');
            titleEl.className = 'tag-card__title';
            titleEl.textContent = tag.title || tag.id;
            textWrapper.appendChild(titleEl);

            const ctaEl = document.createElement('span');
            ctaEl.className = 'tag-card__cta';
            ctaEl.textContent = 'Quiz starten';
            textWrapper.appendChild(ctaEl);

            button.appendChild(textWrapper);

            wrapper.appendChild(button);
        });

        if (tags.length === 0 && this.elements.tagContainer) {
            this.elements.tagContainer.classList.add('u-hidden');
        } else {
            this.elements.tagContainer?.classList.remove('u-hidden');
        }
    }

    clearInvitation() {
        const container = this.elements.questionCountContainer;
        container?.querySelector('[data-quiz-invitation]')?.remove();
        container?.querySelector('.question-count__options')?.classList.remove('u-hidden');
        if (this.invitationHeadingDefault !== undefined) {
            const heading = container?.querySelector('.question-count__header h2');
            if (heading) heading.textContent = this.invitationHeadingDefault;
            delete this.invitationHeadingDefault;
        }
    }

    renderInvitation({ label, count, reduced, practice = false, onStart }) {
        this.clearInvitation();
        const container = this.elements.questionCountContainer;
        if (!container) return;
        const invitation = document.createElement('section');
        invitation.className = 'quiz-invitation';
        invitation.dataset.quizInvitation = '';
        const title = document.createElement('h3');
        title.className = 'quiz-invitation__title';
        title.textContent = practice ? 'Deine zweite Chance' : 'Du bist eingeladen!';
        const text = document.createElement('p');
        text.className = 'quiz-invitation__text';
        text.textContent = label + ' · ' + count + ' Fragen. Deine Fragen werden neu gemischt – finde heraus, was du weißt!';
        if (practice) text.textContent = `${label} · ${count} ${count === 1 ? 'Frage' : 'Fragen'}, die zuletzt noch nicht geklappt haben. Du hast wie gewohnt zwei Versuche.`;
        const start = document.createElement('button');
        start.type = 'button'; start.className = 'btn'; start.textContent = 'Deine Runde starten';
        if (practice) start.textContent = 'Übungsrunde starten';
        start.addEventListener('click', onStart);
        invitation.append(title, text);
        if (reduced) {
            const note = document.createElement('p');
            note.className = 'quiz-invitation__text';
            note.textContent = 'Aktuell sind weniger Fragen verfügbar. Die Rundengröße wurde angepasst.';
            invitation.append(note);
        }
        invitation.append(start);
        const options = container.querySelector('.question-count__options');
        if (options) {
            options.id ||= 'js-invitation-options';
            options.classList.add('u-hidden');
            const change = document.createElement('button');
            change.type = 'button'; change.className = 'quiz-invitation__change';
            change.textContent = 'Andere Rundengröße wählen';
            change.setAttribute('aria-expanded', 'false');
            change.setAttribute('aria-controls', options.id);
            change.addEventListener('click', () => {
                const expanded = change.getAttribute('aria-expanded') === 'true';
                change.setAttribute('aria-expanded', String(!expanded));
                change.textContent = expanded ? 'Andere Rundengröße wählen' : 'Auswahl ausblenden';
                options.classList.toggle('u-hidden', expanded);
            });
            if (!practice) invitation.append(change);
            options.before(invitation);
        } else container.append(invitation);
        const heading = container.querySelector('.question-count__header h2');
        if (heading) {
            this.invitationHeadingDefault = heading.textContent;
            heading.textContent = practice ? 'Diese Fragen übe ich noch' : 'Eine Runde für dich';
        }
    }

    renderSelectionLabel(labelText) {
        if (!this.elements.selectionLabel) return;
        this.elements.selectionLabel.textContent = labelText || '';
        this.elements.selectionLabel.classList.toggle('u-hidden', !labelText);
    }

    renderSelectionDetails({ description, icon, label }) {
        if (this.elements.selectionDescription) {
            this.elements.selectionDescription.textContent = description || '';
            this.elements.selectionDescription.classList.toggle('u-hidden', !description);
        }
        if (this.elements.selectionIcon) {
            if (icon) {
                this.elements.selectionIcon.src = icon;
                const labelText = label || this.elements.selectionLabel?.textContent || '';
                const altText = description ? `${labelText} - ${description}` : labelText;
                this.elements.selectionIcon.alt = altText;
                this.elements.selectionIcon.loading = 'lazy';
                this.elements.selectionIcon.classList.remove('u-hidden');
            } else {
                this.elements.selectionIcon.src = '';
                this.elements.selectionIcon.alt = '';
                this.elements.selectionIcon.classList.add('u-hidden');
            }
        }
    }

    renderQuizSelectionLabel(labelText) {
        if (!this.elements.quizSelectionLabel) return;
        this.elements.quizSelectionLabel.textContent = labelText || '';
        this.elements.quizSelectionLabel.classList.remove('u-hidden');
    }

    renderUser(user) {
        if (!this.elements.userPanel) return;
        this.elements.userPanel.classList.add('u-hidden');
        this.elements.userPanel.classList.toggle('user-panel--logged-in', Boolean(user));
        renderAccountMenu(user);
        this.elements.userTabs.forEach(tab => {
            tab.classList.toggle('u-hidden', Boolean(user));
        });
        if (this.elements.userAccountNameInput) {
            this.elements.userAccountNameInput.value = user?.username || user?.name || '';
        }
        if (this.elements.userAccountPasswordInput) {
            this.elements.userAccountPasswordInput.value = '';
        }
        if (this.elements.userPreview) {
            this.elements.userPreview.innerHTML = '';
        }
        this.showAccountView(user ? '' : 'login');
    }

    renderUserStatus(message, type = 'info') {
        if (this.elements.userStatus) {
            if (message) document.querySelector('main')?.prepend(this.elements.userStatus);
            this.elements.userStatus.textContent = message || '';
            this.elements.userStatus.dataset.status = message ? type : '';
            revealStatus(this.elements.userStatus);
        }
    }

    onUserAccountUpdate(callback) {
        this.elements.userAccountForm?.addEventListener('submit', event => {
            event.preventDefault();
            callback({
                username: this.elements.userAccountNameInput?.value || '',
                password: this.elements.userAccountPasswordInput?.value || '',
                avatarKey: this.selectedAvatar('account')
            });
        });
    }

    onUserDelete(callback) {
        this.elements.userDeleteButton?.addEventListener('click', callback);
    }

    onUserLogout(callback) {
        this.elements.userLogoutButton?.addEventListener('click', callback);
    }

    onCategorySelected(callback) {
        this.elements.categoryList?.addEventListener('click', event => {
            const target = event.target.closest('.js-category-btn');
            if (!target || target.disabled) return;
            callback(target.dataset.category);
        });
    }

    onTagSelected(callback) {
        this.elements.tagList?.addEventListener('click', event => {
            const target = event.target.closest('.js-tag-btn');
            if (!target) return;
            callback(target.dataset.tag);
        });
    }

    onHome(callback) {
        this.elements.homeLinks.forEach(link => {
            link.addEventListener('click', event => {
                event.preventDefault();
                callback();
            });
        });
    }

    onQuestionCountSelected(callback) {
        this.elements.questionCountButtons.forEach(btn => {
            btn.addEventListener('click', () => callback(btn.dataset.count));
        });
    }

    onAnswerSelected(callback) {
        this.elements.answerButtons.forEach((btn, index) => {
            btn.addEventListener('click', () => callback(index));
        });
    }

    onNext(callback) {
        this.elements.nextButton.addEventListener('click', callback);
    }

    onAbort(callback) {
        this.elements.abortButton.addEventListener('click', callback);
        if (this.elements.backToCategoryButton) {
            this.elements.backToCategoryButton.addEventListener('click', callback);
        }
    }

    onModalClose(callback) {
        this.elements.modalCloseButton.addEventListener('click', callback);
        this.elements.modal?.addEventListener('click', event => {
            if (event.target === this.elements.modal) {
                callback();
            }
        });
    }

    showCategories() {
        document.querySelector('#js-quiz-load-status')?.remove();
        this.showElement(this.elements.categoryContainer);
        this.hideElement(this.elements.questionCountContainer);
        this.hideElement(this.elements.quizContent);
        this.hideElement(this.elements.nextButton);
        placeAccountMenu();
    }

    showQuestionCount() {
        this.hideElement(this.elements.categoryContainer);
        this.showElement(this.elements.questionCountContainer);
        placeAccountMenu();
    }

    renderRoundMode(practice) {
        const label = this.elements.quizContent?.querySelector('[data-quiz-mode]');
        if (label) label.hidden = !practice;
    }

    showQuiz() {
        closeAccountMenus();
        this.hideElement(this.elements.questionCountContainer);
        this.showElement(this.elements.quizContent);
    }

    renderQuestion(question, meta) {
        const { questionElement, questionImage, quizContent, quizHeadertext, answerButtons, nextButton } = this.elements;
        const { type, imageUrl, answers } = question;
        const questionImageContainer = questionImage?.parentElement;
        const difficulty = question.difficulty || CONFIG.score.defaultDifficulty;

        questionElement.textContent = question.question;
        if (questionImage) questionImage.alt = question.imageAlt || "Abbildung zur Quizfrage";
        quizHeadertext.textContent = '';
        quizContent.dataset.difficulty = difficulty;
        const difficultyTag = quizContent.querySelector('.quiz__difficulty-tag');
        if (difficultyTag) {
            difficultyTag.textContent = difficulty === 'hero' ? 'Hero-Frage' : difficulty === 'medium' ? 'Schwere Frage' : 'Einfache Frage';
        }

        const imageRequest = this.imageRequest = (this.imageRequest || 0) + 1;
        const showImage = type === 'image' && Boolean(imageUrl);
        if (showImage) {
            applyImageWatermark(questionImageContainer, {
                label: 'KI generiert'
            });
            questionImage.classList.add('u-hidden');
            questionImage.src = '';
            const loader = new Image();
            loader.onload = () => {
                if (imageRequest !== this.imageRequest) return;
                questionImage.src = imageUrl;
                questionImage.classList.remove('u-hidden');
            };
            loader.onerror = () => {
                if (imageRequest !== this.imageRequest) return;
                clearImageWatermark(questionImageContainer);
                questionImage.classList.add('u-hidden');
                this.renderBackgroundKnowledge('Das Bild konnte nicht geladen werden. Du kannst diese Frage mit Weiter überspringen.');
                this.elements.nextButton.classList.remove('u-hidden');
                question.skipped = true;
            };
            loader.src = imageUrl;
        } else {
            clearImageWatermark(questionImageContainer);
            questionImage.classList.add('u-hidden');
            questionImage.src = '';
        }

        answerButtons.forEach((btn, idx) => {
            btn.blur();
            btn.textContent = answers[idx] ?? '';
            btn.disabled = false;
            btn.classList.remove('btn--answer-correct', 'btn--answer-incorrect');
        });

        this.renderBackgroundKnowledge('');
        nextButton.classList.add('u-hidden');
        this.elements.feedbackIconCorrect.classList.add('u-hidden');
        this.elements.feedbackIconIncorrect.classList.add('u-hidden');
        const points = getPointsForDifficulty(difficulty, 0);
        this.renderFeedback(`${points} ${points === 1 ? 'Punkt' : 'Punkte'} im ersten Versuch`, { isHint: true });

        this.elements.currentQuestion.textContent = `${meta.index}`;
        this.elements.totalQuestions.textContent = ` von ${meta.total}`;
        if (meta.selectionLabel) {
            this.renderQuizSelectionLabel(meta.selectionLabel);
        }
    }

    renderBackgroundKnowledge(text) {
        if (!this.elements.backgroundKnowledge) return;
        const contentElement = this.elements.backgroundKnowledge.querySelector('.background-knowledge__text');
        if (!contentElement) return;

        if (text) {
            contentElement.textContent = text;
            this.elements.backgroundKnowledge.classList.remove('u-hidden');
        } else {
            contentElement.textContent = '';
            this.elements.backgroundKnowledge.classList.add('u-hidden');
        }
    }

    renderFeedback(message, { isCorrect, canRetry = false, isHint = canRetry }) {
        this.elements.feedbackContainer.classList.toggle('quiz__feedback-container--hint', isHint);
        this.showElement(this.elements.feedbackContainer);
        this.elements.feedbackElement.textContent = message;
        this.elements.feedbackElement.classList.remove('u-hidden');

        if (isCorrect) {
            this.elements.feedbackIconCorrect.classList.remove('u-hidden');
            this.elements.feedbackIconIncorrect.classList.add('u-hidden');
        } else {
            this.elements.feedbackIconIncorrect.classList.remove('u-hidden');
            this.elements.feedbackIconCorrect.classList.add('u-hidden');
        }
    }

    lockAnswers() {
        this.elements.answerButtons.forEach(btn => {
            btn.disabled = true;
        });
        this.elements.nextButton.classList.remove('u-hidden');
        this.elements.nextButton.focus({ preventScroll: true });
    }

    updateScore(score, { pointsGained } = {}) {
        this.elements.score.textContent = `${LABELS.scorePrefix} ${score}`;
        const change = this.elements.scoreChange;
        if (!change) return;
        const feedback = change.parentElement;
        if (!Number.isFinite(pointsGained)) {
            window.clearTimeout(this.scoreChangeTimer);
            feedback.classList.remove('quiz__score-feedback--show-change');
            change.classList.remove('quiz__score-change--visible', 'quiz__score-change--gained', 'quiz__score-change--none');
            change.textContent = '';
            change.removeAttribute('aria-label');
            return;
        }

        window.clearTimeout(this.scoreChangeTimer);
        change.classList.remove('quiz__score-change--visible', 'quiz__score-change--gained', 'quiz__score-change--none');
        change.textContent = pointsGained > 0 ? `+${pointsGained}` : '0';
        change.setAttribute('aria-label', pointsGained > 0
            ? `${pointsGained} ${pointsGained === 1 ? 'Punkt' : 'Punkte'} erhalten`
            : 'Keine Punkte erhalten');
        change.classList.add(pointsGained > 0 ? 'quiz__score-change--gained' : 'quiz__score-change--none');
        feedback.classList.remove('quiz__score-feedback--show-change');
        void change.offsetWidth;
        feedback.classList.add('quiz__score-feedback--show-change');
        change.classList.add('quiz__score-change--visible');
        this.scoreChangeTimer = window.setTimeout(() => {
            feedback.classList.remove('quiz__score-feedback--show-change');
            change.classList.remove('quiz__score-change--visible');
        }, 1000);
    }

    updateQuestionCountButtons(maxAvailable) {
        this.elements.questionCountButtons.forEach(btn => {
            const count = btn.dataset.count;
            if (count === 'all') {
                btn.disabled = maxAvailable === 0;
                btn.classList.toggle('btn--disabled', maxAvailable === 0);
                return;
            }
            const numeric = Number.parseInt(count, 10);
            const disable = Number.isNaN(numeric) || numeric > maxAvailable || maxAvailable === 0;
            btn.disabled = disable;
            btn.classList.toggle('btn--disabled', disable);
        });
        if (this.elements.quizHeadertext && maxAvailable === 0) {
            this.elements.quizHeadertext.textContent = LABELS.status.noQuestions;
        }
    }

    resultMessage({ score, maxScore }, user) {
        const name = user?.username || user?.name || '';
        if (!name) {
            if (score <= 0) {
                return 'Runde geschafft. Beim nächsten Versuch holst du Punkte.';
            }
            if (score >= maxScore) {
                return 'Perfekte Runde. Alles richtig beantwortet.';
            }
            return 'Deine Runde ist geschafft.';
        }
        if (score <= 0) {
            return `Runde geschafft, ${name}. Beim nächsten Versuch holst du Punkte.`;
        }
        if (score >= maxScore) {
            return `Perfekte Runde, ${name}.`;
        }
        return `Gut gespielt, ${name}.`;
    }

    onQuestionFeedbackOpen(callback) {
        this.elements.questionFeedbackOpen?.addEventListener('click', callback);
    }

    onQuestionFeedbackSubmit(callback) {
        this.elements.questionFeedbackForm?.addEventListener('submit', event => {
            event.preventDefault();
            const formData = new FormData(this.elements.questionFeedbackForm);
            callback({
                types: formData.getAll('feedbackType'),
                comment: this.elements.questionFeedbackComment?.value || ''
            });
        });
    }

    initQuestionFeedbackModal() {
        const close = () => this.closeQuestionFeedbackModal();
        this.elements.questionFeedbackClose?.addEventListener('click', close);
        this.elements.questionFeedbackModal?.addEventListener('click', event => {
            if (event.target === this.elements.questionFeedbackModal) close();
        });
    }

    openQuestionFeedbackModal() {
        if (!this.elements.questionFeedbackModal) return;
        this.elements.questionFeedbackForm?.reset();
        this.renderQuestionFeedbackStatus('');
        openDialog(this.elements.questionFeedbackModal);
    }

    closeQuestionFeedbackModal() {
        closeDialog(this.elements.questionFeedbackModal);
    }

    renderQuestionFeedbackStatus(message, type = 'info') {
        if (!this.elements.questionFeedbackStatus) return;
        this.elements.questionFeedbackStatus.textContent = message || '';
        this.elements.questionFeedbackStatus.dataset.status = message ? type : '';
        revealStatus(this.elements.questionFeedbackStatus);
    }

    showResultModal({ score, solved, total, maxScore }, user = null, actions = {}) {
        const fillContent = html => {
            if (html) {
                this.elements.modalContent.innerHTML = html;
                const avatarEl = this.elements.modalContent.querySelector('[data-result-avatar]');
                const messageEl = this.elements.modalContent.querySelector('[data-result-message]');
                const scoreEl = this.elements.modalContent.querySelector('[data-result-score]');
                const solvedEl = this.elements.modalContent.querySelector('[data-result-solved]');
                const totalEl = this.elements.modalContent.querySelector('[data-result-total]');
                const maxEl = this.elements.modalContent.querySelector('[data-result-max]');
                const progressEl = this.elements.modalContent.querySelector('[data-result-progress]');
                const actionButtons = this.elements.modalContent.querySelectorAll('[data-result-action]');
                const kicker = this.elements.modalContent.querySelector('[data-result-kicker]');
                if (kicker && actions.practice) kicker.textContent = 'Übungsrunde beendet';
                const progress = maxScore > 0 ? Math.max(0, Math.min(100, Math.round((score / maxScore) * 100))) : 0;

                if (avatarEl) {
                    avatarEl.src = user?.profileImageUrl || 'images/website/avatar/quizo.png';
                    avatarEl.alt = user?.username || user?.name ? `${user.username || user.name} Profilbild` : 'Quiz-Hero';
                }
                if (messageEl) messageEl.textContent = this.resultMessage({ score, maxScore }, user);
                if (scoreEl) scoreEl.textContent = score;
                if (solvedEl) solvedEl.textContent = solved;
                if (totalEl) totalEl.textContent = total;
                if (maxEl) maxEl.textContent = maxScore;
                if (progressEl) {
                    progressEl.value = progress;
                    progressEl.textContent = `${progress} %`;
                }
                const guestPrompt = this.elements.modalContent.querySelector('[data-result-guest]');
                if (guestPrompt) guestPrompt.hidden = Boolean(user);
                this.disposeResultShare?.();
                this.disposeResultShare = bindResultShare(this.elements.modalContent, { score, solved, total, maxScore, ...actions.shareContext });
                actionButtons.forEach(button => {
                    if (actions.practice) button.textContent = 'Zurück zum Reisepass';
                    button.addEventListener('click', () => {
                        this.hideResultModal();
                        actions.onOverview?.();
                    });
                });
            } else {
                this.elements.modalContent.innerHTML = `
                    <h2 class="modal__headline">${LABELS.modalTitle}</h2>
                    <p>${LABELS.modalScoreLabel} <strong>${score}</strong> (${solved} von ${total} Fragen richtig)</p>
                    <p>${LABELS.modalMaxLabel} <strong>${maxScore}</strong></p>
                `;
            }
            this.watchResultSave(actions, { solved, total });
            openDialog(this.elements.modal);
        };

        this.loadResultModalTemplate().then(fillContent);
    }

    watchResultSave(actions, { solved, total }) {
        if (!actions.saveStatus) return;
        const card = this.elements.modalContent.querySelector('.result-summary');
        if (!card) return;
        const footer = card.querySelector('.result-summary__actions');
        const navigation = footer?.querySelector('[data-result-action]');
        const feedback = document.createElement('div');
        feedback.className = 'result-summary__save';
        const status = document.createElement('p');
        status.className = 'result-summary__save-status';
        status.setAttribute('role', 'status');
        const retry = document.createElement('button');
        retry.type = 'button'; retry.className = 'result-summary__secondary';
        retry.textContent = 'Speichern erneut versuchen'; retry.hidden = true;
        feedback.append(status, retry);
        if (footer) footer.before(feedback); else card.append(feedback);
        const current = () => this.elements.modalContent.querySelector('.result-summary') === card;
        const run = async promise => {
            retry.hidden = true;
            if (navigation && actions.practice) navigation.disabled = true;
            feedback.hidden = !actions.practice;
            status.textContent = actions.practice ? 'Deine Übungsrunde wird gespeichert …' : '';
            status.dataset.status = '';
            let message;
            try { message = await promise; }
            catch { message = 'Dein Ergebnis konnte nicht gespeichert werden. Bitte versuche es erneut.'; }
            if (!current()) return;
            if (navigation) navigation.disabled = false;
            if (!message) renderSouvenirUnlock(card,actions.getSouvenirs?.() || [],actions.getAvatarRewards?.() || []);
            if (message) {
                feedback.hidden = false;
                status.textContent = message;
                status.dataset.status = 'error';
                retry.hidden = !actions.retrySave;
            } else if (actions.practice) {
                status.textContent = `${solved} von ${total} Übungsfragen gelöst. Deinen aktuellen Übungsstand findest du im Reisepass.`;
            } else feedback.hidden = true;
        };
        retry.addEventListener('click', () => {
            if (!retry.hidden && actions.retrySave) run(Promise.resolve().then(actions.retrySave));
        });
        run(actions.saveStatus);
    }

    loadResultModalTemplate() {
        if (this.resultModalTemplate !== null) {
            return Promise.resolve(this.resultModalTemplate);
        }
        if (this.resultModalLoading) {
            return this.resultModalLoading;
        }
        const url = CONFIG.resultModalUrl;
        if (!url) {
            this.resultModalTemplate = '';
            return Promise.resolve('');
        }
        this.resultModalLoading = fetch(url, { cache: 'no-store' })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Request failed: ${response.status}`);
                }
                return response.text();
            })
            .then(html => {
                this.resultModalTemplate = html;
                this.resultModalLoading = null;
                return html;
            })
            .catch(error => {
                this.resultModalTemplate = '';
                this.resultModalLoading = null;
                if (CONFIG.devMode) {
                    console.error(error);
                }
                return '';
            });
        return this.resultModalLoading;
    }

    hideResultModal() {
        this.disposeResultShare?.();
        this.disposeResultShare = null;
        closeDialog(this.elements.modal);
    }

    highlightCorrectAnswer(index) {
        const button = this.elements.answerButtons[index];
        if (button) {
            button.classList.add('btn--answer-correct');
        }
    }

    markAnswerButton(index, isCorrect) {
        const button = this.elements.answerButtons[index];
        if (button) {
            button.classList.add(isCorrect ? 'btn--answer-correct' : 'btn--answer-incorrect');
        }
    }

    disableAnswerButton(index) {
        const button = this.elements.answerButtons[index];
        if (button) {
            button.disabled = true;
            this.elements.answerButtons.find(candidate => !candidate.disabled)?.focus();
        }
    }

    showElement(element) {
        if (element) element.classList.remove('u-hidden');
    }

    hideElement(element) {
        if (element) element.classList.add('u-hidden');
    }

    showLoadingMessage(message) {
        let status = document.querySelector('#js-quiz-load-status');
        if (!status) {
            status = document.createElement('p');
            status.id = 'js-quiz-load-status';
            status.setAttribute('role', 'status');
            document.querySelector('main')?.prepend(status);
        }
        status.textContent = message;
        if (this.elements.quizHeadertext) {
            this.elements.quizHeadertext.textContent = message;
        }
    }
}
