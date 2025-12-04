import { CONFIG, LABELS, SELECTORS } from './config.js';

export class QuizView {
    constructor(selectors = SELECTORS) {
        this.elements = this.mapElements(selectors);
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
            backgroundKnowledge: document.querySelector(selectors.backgroundKnowledge),
            currentQuestion: document.querySelector(selectors.currentQuestion),
            totalQuestions: document.querySelector(selectors.totalQuestions),
            score: document.querySelector(selectors.score),
            quizHeadertext: document.querySelector(selectors.quizHeadertext),
            selectionLabel: document.querySelector(selectors.selectionLabel),
            selectionDescription: document.querySelector(selectors.selectionDescription),
            selectionIcon: document.querySelector(selectors.selectionIcon),
            quizSelectionLabel: document.querySelector(selectors.quizSelectionLabel),
            modal: document.querySelector(selectors.modal),
            modalContent: document.querySelector(selectors.modalContent),
            modalCloseButton: document.querySelector(selectors.modalCloseButton)
        };
    }

    renderCategoryButtons(categories) {
        const wrapper = this.elements.categoryList;
        if (!wrapper) return;

        wrapper.innerHTML = '';
        categories.forEach(category => {
            const button = document.createElement('button');
            button.className = 'js-category-btn btn btn--category category-card';
            button.dataset.category = category.id;

            if (!category.enabled) {
                button.disabled = true;
                button.classList.add('btn--disabled');
                if (category.unlockHint) {
                    button.title = category.unlockHint;
                }
            }

            if (category.icon) {
                const icon = document.createElement('img');
                icon.src = category.icon;
                icon.alt = `${category.title} Icon`;
                icon.classList.add('category-card__icon');
                button.appendChild(icon);
            }

            const textWrapper = document.createElement('div');
            textWrapper.className = 'category-card__text';

            const titleEl = document.createElement('span');
            titleEl.className = 'category-card__title';
            titleEl.textContent = category.title;
            textWrapper.appendChild(titleEl);

            if (category.description) {
                const descriptionEl = document.createElement('span');
                descriptionEl.className = 'category-card__description';
                descriptionEl.textContent = category.description;
                textWrapper.appendChild(descriptionEl);
            }

            button.appendChild(textWrapper);

            wrapper.appendChild(button);
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

            if (tag.icon) {
                const icon = document.createElement('img');
                icon.src = tag.icon;
                icon.alt = `${tag.title} Icon`;
                icon.classList.add('tag-card__icon');
                button.appendChild(icon);
            }

            const textWrapper = document.createElement('div');
            textWrapper.className = 'tag-card__text';

            const titleEl = document.createElement('span');
            titleEl.className = 'tag-card__title';
            titleEl.textContent = tag.title || tag.id;
            textWrapper.appendChild(titleEl);

            if (tag.description) {
                const descEl = document.createElement('span');
                descEl.className = 'tag-card__description';
                descEl.textContent = tag.description;
                textWrapper.appendChild(descEl);
            }

            button.appendChild(textWrapper);

            wrapper.appendChild(button);
        });

        if (tags.length === 0 && this.elements.tagContainer) {
            this.elements.tagContainer.classList.add('hide');
        } else {
            this.elements.tagContainer?.classList.remove('hide');
        }
    }

    renderSelectionLabel(labelText) {
        if (!this.elements.selectionLabel) return;
        this.elements.selectionLabel.textContent = labelText || '';
        this.elements.selectionLabel.classList.toggle('hide', !labelText);
    }

    renderSelectionDetails({ description, icon, label }) {
        if (this.elements.selectionDescription) {
            this.elements.selectionDescription.textContent = description || '';
            this.elements.selectionDescription.classList.toggle('hide', !description);
        }
        if (this.elements.selectionIcon) {
            if (icon) {
                this.elements.selectionIcon.src = icon;
                const labelText = label || this.elements.selectionLabel?.textContent || '';
                const altText = description ? `${labelText} - ${description}` : labelText;
                this.elements.selectionIcon.alt = altText;
                this.elements.selectionIcon.classList.remove('hide');
            } else {
                this.elements.selectionIcon.src = '';
                this.elements.selectionIcon.alt = '';
                this.elements.selectionIcon.classList.add('hide');
            }
        }
    }

    renderQuizSelectionLabel(labelText) {
        if (!this.elements.quizSelectionLabel) return;
        this.elements.quizSelectionLabel.textContent = labelText || '';
        this.elements.quizSelectionLabel.classList.remove('hide');
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
        document.addEventListener('keydown', event => {
            if (event.key === 'Escape') {
                callback();
            }
        });
        this.elements.modal?.addEventListener('click', event => {
            if (event.target === this.elements.modal) {
                callback();
            }
        });
    }

    showCategories() {
        this.showElement(this.elements.categoryContainer);
        this.hideElement(this.elements.questionCountContainer);
        this.hideElement(this.elements.quizContent);
        this.hideElement(this.elements.nextButton);
    }

    showQuestionCount() {
        this.hideElement(this.elements.categoryContainer);
        this.showElement(this.elements.questionCountContainer);
    }

    showQuiz() {
        this.hideElement(this.elements.questionCountContainer);
        this.showElement(this.elements.quizContent);
    }

    renderQuestion(question, meta) {
        const { questionElement, questionImage, quizContent, quizHeadertext, answerButtons, feedbackContainer, feedbackElement, nextButton } = this.elements;
        const { type, imageUrl, answers } = question;
        const difficulty = question.difficulty || CONFIG.score.defaultDifficulty;
        const isHero = difficulty === 'hero';
        const headerLabel = difficulty === 'hero'
            ? LABELS.questions.hero
            : difficulty === 'medium'
                ? LABELS.questions.medium
                : LABELS.questions.default;

        questionElement.textContent = question.question;
        quizHeadertext.textContent = headerLabel;
        quizContent.dataset.difficulty = difficulty;

        const showImage = type === 'image' && Boolean(imageUrl);
        questionImage.classList.toggle('hide', !showImage);
        if (showImage) {
            questionImage.src = imageUrl;
        }

        answerButtons.forEach((btn, idx) => {
            btn.textContent = answers[idx] ?? '';
            btn.disabled = false;
            btn.classList.remove('correct', 'incorrect');
        });

        this.renderBackgroundKnowledge('');
        this.hideElement(feedbackContainer);
        feedbackElement.textContent = '';
        feedbackElement.classList.add('hide');
        nextButton.classList.add('hide');
        this.elements.feedbackIconCorrect.classList.add('hide');
        this.elements.feedbackIconIncorrect.classList.add('hide');

        this.elements.currentQuestion.textContent = `${meta.index}`;
        this.elements.totalQuestions.textContent = `/${meta.total}`;
        if (meta.selectionLabel) {
            this.renderQuizSelectionLabel(meta.selectionLabel);
        }
    }

    renderBackgroundKnowledge(text) {
        if (!this.elements.backgroundKnowledge) return;
        const contentElement = this.elements.backgroundKnowledge.querySelector('.background-knowledge__content');
        if (!contentElement) return;

        if (text) {
            contentElement.textContent = text;
            this.elements.backgroundKnowledge.classList.remove('hide');
        } else {
            contentElement.textContent = '';
            this.elements.backgroundKnowledge.classList.add('hide');
        }
    }

    renderFeedback(message, { isCorrect }) {
        this.showElement(this.elements.feedbackContainer);
        this.elements.feedbackElement.textContent = message;
        this.elements.feedbackElement.classList.remove('hide');

        if (isCorrect) {
            this.elements.feedbackIconCorrect.classList.remove('hide');
            this.elements.feedbackIconIncorrect.classList.add('hide');
        } else {
            this.elements.feedbackIconIncorrect.classList.remove('hide');
            this.elements.feedbackIconCorrect.classList.add('hide');
        }
    }

    lockAnswers() {
        this.elements.answerButtons.forEach(btn => {
            btn.disabled = true;
        });
        this.elements.nextButton.classList.remove('hide');
    }

    updateScore(score) {
        this.elements.score.textContent = `${LABELS.scorePrefix} ${score}`;
        this.elements.score.classList.add('quiz__score--animation');
        window.setTimeout(() => {
            this.elements.score.classList.remove('quiz__score--animation');
        }, 800);
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

    showResultModal({ score, percentage }) {
        this.elements.modalContent.innerHTML = `
            <h2 class="modal__headline">${LABELS.modalTitle}</h2>
            <p>${LABELS.modalResult(score, percentage)}</p>
        `;
        this.elements.modal.classList.remove('hide');
    }

    hideResultModal() {
        this.elements.modal.classList.add('hide');
    }

    highlightCorrectAnswer(index) {
        const button = this.elements.answerButtons[index];
        if (button) {
            button.classList.add('correct');
        }
    }

    markAnswerButton(index, isCorrect) {
        const button = this.elements.answerButtons[index];
        if (button) {
            button.classList.add(isCorrect ? 'correct' : 'incorrect');
        }
    }

    showElement(element) {
        if (element) element.classList.remove('hide');
    }

    hideElement(element) {
        if (element) element.classList.add('hide');
    }

    showLoadingMessage(message) {
        if (this.elements.quizHeadertext) {
            this.elements.quizHeadertext.textContent = message;
        }
    }
}
