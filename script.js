(() => {
    const CONFIG = {
        questionsUrl: 'questions.json',
        feedbackUrl: 'feedback.json',
        score: {
            secondTry: 1,
            difficulties: {
                easy: 2,
                medium: 3,
                hero: 5
            },
            defaultDifficulty: 'easy'
        },
        maxAttempts: 2
    };

    const ASSET_VERSION = '0.0.1'; // bei Änderungen hochzählen

    const LABELS = {
        questions: {
            default: 'Frage:',
            hero: 'Hero-Frage:'
        },
        status: {
            loading: 'Lade Fragen...',
            loadError: 'Fehler beim Laden. Bitte später erneut versuchen.',
            noQuestions: 'Keine Fragen verfügbar.',
            fetchError: 'Fragen konnten nicht geladen werden.'
        },
        scorePrefix: 'Punkte:',
        modalTitle: 'Quiz beendet!',
        modalResult: (score, percentage) => `Deine Punktzahl ist: <strong>${score}</strong> (${percentage}%)`
    };

    const SELECTORS = {
        categoryContainer: '#js-category-container',
        categoryList: '#js-category-container .category',
        tagContainer: '#js-tag-container',
        tagList: '#js-tag-container .tag-filter__list',
        questionCountContainer: '#js-question-count-container',
        quizContent: '#js-quiz-content',
        questionElement: '#js-question',
        questionImage: '#js-question-image',
        answerButtons: '.js-answer-btn',
        questionCountButtons: '.js-question-count-btn',
        backToCategoryButton: '#js-back-to-category-page',
        abortButton: '#js-abort-btn',
        nextButton: '#js-next-btn',
        feedbackElement: '#js-feedback',
        feedbackIconCorrect: '#js-feedback-icon-correct',
        feedbackIconIncorrect: '#js-feedback-icon-incorrect',
        backgroundKnowledge: '#js-background-knowledge',
        currentQuestion: '#js-current-question',
        totalQuestions: '#js-total-questions',
        score: '#js-score',
        quizHeadertext: '#js-quiz-headertext',
        selectionLabel: '#js-selection-label',
        quizSelectionLabel: '#js-quiz-selection',
        modal: '#js-result-modal',
        modalContent: '#js-result-content',
        modalCloseButton: '#js-modal-close'
    };

    const ALLOWED_DIFFICULTIES = new Set(Object.keys(CONFIG.score.difficulties));

    const isNonEmptyString = value => typeof value === 'string' && value.trim().length > 0;

    function validateCategories(categories) {
        const errors = [];

        if (!Array.isArray(categories)) {
            errors.push('categories muss ein Array sein.');
            return errors;
        }

        categories.forEach((category, catIndex) => {
            if (!category || typeof category !== 'object') {
                errors.push(`Kategorie #${catIndex + 1} ist kein Objekt.`);
                return;
            }

            if (!isNonEmptyString(category.id)) {
                errors.push(`Kategorie #${catIndex + 1} besitzt keine gültige id.`);
            }

            if (!isNonEmptyString(category.title)) {
                errors.push(`Kategorie ${category.id || `#${catIndex + 1}`} besitzt keinen gültigen Titel.`);
            }

            if (!Array.isArray(category.questions)) {
                errors.push(`Kategorie ${category.id || `#${catIndex + 1}`} besitzt kein Fragen-Array.`);
                return;
            }

            category.questions.forEach((question, questionIndex) => {
                if (!question || typeof question !== 'object') {
                    errors.push(`Frage ${questionIndex + 1} in Kategorie ${category.id} ist kein Objekt.`);
                    return;
                }

                if (!isNonEmptyString(question.question)) {
                    errors.push(`Frage ${questionIndex + 1} in Kategorie ${category.id} besitzt keinen Fragetext.`);
                }

                if (!Array.isArray(question.answers) || question.answers.length < 2) {
                    errors.push(`Frage ${questionIndex + 1} in Kategorie ${category.id} benötigt mindestens zwei Antworten.`);
                }

                if (Array.isArray(question.answers)) {
                    question.answers.forEach((answer, answerIndex) => {
                        if (!isNonEmptyString(answer)) {
                            errors.push(`Antwort ${answerIndex + 1} in Frage ${questionIndex + 1} von Kategorie ${category.id} ist ungültig.`);
                        }
                    });
                }

                if (typeof question.correct !== 'number' || Number.isNaN(question.correct)) {
                    errors.push(`Frage ${questionIndex + 1} in Kategorie ${category.id} besitzt keinen gültigen "correct"-Index.`);
                } else if (
                    !Array.isArray(question.answers) ||
                    question.correct < 0 ||
                    question.correct >= question.answers.length
                ) {
                    errors.push(`"correct" in Frage ${questionIndex + 1} von Kategorie ${category.id} liegt außerhalb des Antwortbereichs.`);
                }

                if (question.tag && !Array.isArray(question.tag)) {
                    errors.push(`Frage ${questionIndex + 1} in Kategorie ${category.id} besitzt ein ungültiges tag-Feld.`);
                } else if (Array.isArray(question.tag)) {
                    question.tag.forEach((tagValue, tagIndex) => {
                        if (!isNonEmptyString(tagValue)) {
                            errors.push(`Tag ${tagIndex + 1} in Frage ${questionIndex + 1} von Kategorie ${category.id} ist ungültig.`);
                        }
                    });
                }

                if (question.difficulty && !ALLOWED_DIFFICULTIES.has(question.difficulty)) {
                    errors.push(`Frage ${questionIndex + 1} in Kategorie ${category.id} besitzt eine unbekannte difficulty (${question.difficulty}).`);
                }

                if (question.type === 'image') {
                    if (!isNonEmptyString(question.imageUrl)) {
                        errors.push(`Bildfrage ${questionIndex + 1} in Kategorie ${category.id} benötigt ein gültiges imageUrl.`);
                    }
                }
            });
        });

        return errors;
    }

    function validateFeedback(feedback) {
        const requiredKeys = [
            'correctFirstTry',
            'correctSecondTry',
            'incorrectFirstTry',
            'incorrectSecondTry',
            'difficultCorrectFirstTry'
        ];
        const errors = [];

        if (!feedback || typeof feedback !== 'object') {
            return ['feedback.json ist kein Objekt.'];
        }

        requiredKeys.forEach(key => {
            if (!Array.isArray(feedback[key]) || feedback[key].length === 0) {
            errors.push(`Feedback-Schlüssel "${key}" fehlt oder ist leer.`);
            return;
            }
            feedback[key].forEach((entry, index) => {
            if (typeof entry !== 'string' || !entry.trim()) {
                errors.push(`Eintrag ${index + 1} in "${key}" ist kein gültiger Text.`);
            }
            });
        });

        return errors;
    }


    const getPointsForDifficulty = (difficulty, attempt) => {
        if (attempt > 0) {
            return CONFIG.score.secondTry;
        }
        const level = difficulty || CONFIG.score.defaultDifficulty;
        const table = CONFIG.score.difficulties;
        return table[level] ?? table[CONFIG.score.defaultDifficulty];
    };

    class QuizDataService {
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
            const response = await this.fetchFn(bustUrl, { cache: 'no-store' }); // optional kombinierten Schutz
            if (!response.ok) throw new Error(`Request failed for ${bustUrl} (${response.status})`);
            return response.json();
        }
    }

    class QuizState {
        constructor() {
            this.categories = [];
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

        setData({ categories, feedback }) {
            this.categories = categories;
            this.feedbackMessages = feedback;
            this.buildTagIndex();
        }

        buildTagIndex() {
            this.tagIndex.clear();
            this.categories
                .filter(category => category.enabled)
                .forEach(category => {
                    category.questions.forEach(question => {
                        (question.tag || []).forEach(tag => {
                            if (!tag) {
                                return;
                            }
                            if (!this.tagIndex.has(tag)) {
                                this.tagIndex.set(tag, []);
                            }
                            this.tagIndex.get(tag).push({
                                question: QuizState.cloneQuestion(question),
                                categoryId: category.id
                            });
                        });
                    });
                });
        }

        getAvailableTags() {
            return Array.from(this.tagIndex.keys()).sort((a, b) => a.localeCompare(b, 'de'));
        }

        getCategory(categoryId) {
            return this.categories.find(cat => cat.id === categoryId) || null;
        }

        getActiveCategory() {
            return this.getCategory(this.activeCategoryId);
        }

        prepareRoundFromCategory(categoryId, count) {
            const category = this.getCategory(categoryId);
            if (!category) {
                throw new Error(`Unknown category: ${categoryId}`);
            }

            const randomized = QuizState.shuffleArray(
                category.questions.map(question => QuizState.cloneQuestion(question))
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
                ...QuizState.cloneQuestion(entry.question),
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

        static cloneQuestion(question) {
            if (typeof structuredClone === 'function') {
                return structuredClone(question);
            }
            return JSON.parse(JSON.stringify(question));
        }
    }

    class QuizView {
        constructor(selectors) {
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
                feedbackElement: document.querySelector(selectors.feedbackElement),
                feedbackIconCorrect: document.querySelector(selectors.feedbackIconCorrect),
                feedbackIconIncorrect: document.querySelector(selectors.feedbackIconIncorrect),
                backgroundKnowledge: document.querySelector(selectors.backgroundKnowledge),
                currentQuestion: document.querySelector(selectors.currentQuestion),
                totalQuestions: document.querySelector(selectors.totalQuestions),
                score: document.querySelector(selectors.score),
                quizHeadertext: document.querySelector(selectors.quizHeadertext),
                selectionLabel: document.querySelector(selectors.selectionLabel),
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
                button.className = 'js-category-btn btn btn--category';
                button.dataset.category = category.id;
                button.textContent = category.title;

                if (!category.enabled) {
                    button.disabled = true;
                    button.classList.add('btn--disabled');
                    if (category.unlockHint) {
                        button.title = category.unlockHint;
                    }
                }

                wrapper.appendChild(button);
            });
        }

        renderTagButtons(tags) {
            const wrapper = this.elements.tagList;
            if (!wrapper) return;

            wrapper.innerHTML = '';

            tags.forEach(tag => {
                const button = document.createElement('button');
                button.className = 'js-tag-btn btn btn--tag';
                button.dataset.tag = tag;
                button.type = 'button';
                button.textContent = tag;
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
            const { questionElement, questionImage, quizContent, quizHeadertext, answerButtons, backgroundKnowledge, feedbackElement, nextButton } = this.elements;
            const { type, imageUrl, answers } = question;
            const difficulty = question.difficulty || CONFIG.score.defaultDifficulty;
            const isHero = difficulty === 'hero';

            questionElement.textContent = question.question;
            quizHeadertext.textContent = isHero ? LABELS.questions.hero : LABELS.questions.default;
            quizContent.dataset.difficulty = difficulty;
            quizContent.classList.toggle('quiz__difficult_question', isHero);
            quizHeadertext.classList.toggle('quiz__headertext--difficult', isHero);

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

            backgroundKnowledge.textContent = '';
            backgroundKnowledge.classList.add('hide');
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
            if (!text) return;
            this.elements.backgroundKnowledge.textContent = text;
            this.elements.backgroundKnowledge.classList.remove('hide');
        }

        renderFeedback(message, { isCorrect }) {
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

    class QuizController {
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
            } catch (error) {
                console.error(error);
                this.view.showLoadingMessage(LABELS.status.loadError);
            }
        }

        registerEvents() {
            this.view.onCategorySelected(categoryId => this.handleCategorySelected(categoryId));
            this.view.onTagSelected(tag => this.handleTagSelected(tag));
            this.view.onQuestionCountSelected(count => this.handleQuestionCountSelected(count));
            this.view.onAnswerSelected(index => this.handleAnswerSelected(index));
            this.view.onNext(() => this.handleNextQuestion());
            this.view.onAbort(() => this.handleAbort());
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
            this.view.renderSelectionLabel(this.state.selectionLabel);
            this.view.updateQuestionCountButtons(this.state.getAvailableCountForSelection());
            this.view.showQuestionCount();
        }

        handleTagSelected(tag) {
            if (!this.state.tagIndex.has(tag)) {
                return;
            }
            this.state.activeTag = tag;
            this.state.activeCategoryId = null;
            this.state.selectionLabel = tag;
            this.view.renderSelectionLabel(this.state.selectionLabel);
            this.view.updateQuestionCountButtons(this.state.getAvailableCountForSelection());
            this.view.showQuestionCount();
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
                console.error(error);
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

            if (question.backgroundKnowledge) {
                this.view.renderBackgroundKnowledge(question.backgroundKnowledge);
            }

            const feedbackArray = this.pickFeedbackArray(question, isCorrect);
            const message = this.pickRandomEntry(feedbackArray);
            this.view.renderFeedback(message, { isCorrect });
            this.state.registerAttempt(isCorrect, difficulty);
            this.view.updateScore(this.state.score);

            if (isCorrect || this.state.attempts >= CONFIG.maxAttempts) {
                if (!isCorrect) {
                    this.view.highlightCorrectAnswer(question.correct);
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
            }
        }

        handleAbort() {
            this.state.resetRound();
            this.view.showCategories();
            this.view.hideResultModal();
            this.view.updateScore(this.state.score);
            this.view.renderSelectionLabel('');
            if (this.view.elements.quizSelectionLabel) {
                this.view.elements.quizSelectionLabel.textContent = '';
            }
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        const controller = new QuizController({
            dataService: new QuizDataService({
                questionsUrl: CONFIG.questionsUrl,
                feedbackUrl: CONFIG.feedbackUrl
            }),
            state: new QuizState(),
            view: new QuizView(SELECTORS)
        });

        controller.init();
    });
})();
