(() => {
    const CONFIG = {
        questionsUrl: 'questions.json',
        feedbackUrl: 'feedback.json',
        score: {
            normal: 3,
            difficult: 5,
            secondTry: 1
        },
        maxAttempts: 2
    };

    const SELECTORS = {
        categoryContainer: '#js-category-container',
        questionCountContainer: '#js-question-count-container',
        quizContent: '#js-quiz-content',
        questionElement: '#js-question',
        questionImage: '#js-question-image',
        answerButtons: '.js-answer-btn',
        categoryButtons: '.js-category-btn',
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
        modal: '#js-result-modal',
        modalContent: '#js-result-content',
        modalCloseButton: '#js-modal-close'
    };

    class QuizDataService {
        constructor({ questionsUrl, feedbackUrl, fetchFn = window.fetch.bind(window) }) {
            this.questionsUrl = questionsUrl;
            this.feedbackUrl = feedbackUrl;
            this.fetchFn = fetchFn;
            this.cache = {};
        }

        async loadAll() {
            if (this.cache.questions && this.cache.feedback) {
                return this.cache;
            }

            const [questions, feedback] = await Promise.all([
                this.fetchJson(this.questionsUrl),
                this.fetchJson(this.feedbackUrl)
            ]);

            this.cache = { questions, feedback };
            return this.cache;
        }

        async fetchJson(url) {
            const response = await this.fetchFn(url);
            if (!response.ok) {
                throw new Error(`Request failed for ${url} (${response.status})`);
            }
            return response.json();
        }
    }

    class QuizState {
        constructor() {
            this.sourceQuestions = {};
            this.feedbackMessages = {};
            this.activeCategory = null;
            this.currentSequence = [];
            this.currentIndex = 0;
            this.score = 0;
            this.attempts = 0;
        }

        setData({ questions, feedback }) {
            this.sourceQuestions = questions;
            this.feedbackMessages = feedback;
        }

        hasCategory(categoryId) {
            return Boolean(this.sourceQuestions[categoryId]);
        }

        prepareRound(categoryId, count) {
            if (!this.hasCategory(categoryId)) {
                throw new Error(`Unknown category: ${categoryId}`);
            }

            this.activeCategory = categoryId;
            const cloned = this.sourceQuestions[categoryId].map(item => QuizState.cloneQuestion(item));
            const randomized = QuizState.shuffleArray(cloned);

            if (count !== 'all') {
                const limit = Number.parseInt(count, 10);
                if (Number.isNaN(limit)) {
                    throw new Error('Invalid question count');
                }
                this.currentSequence = randomized.slice(0, Math.min(limit, randomized.length));
            } else {
                this.currentSequence = randomized;
            }

            this.currentIndex = 0;
            this.score = 0;
            this.attempts = 0;
        }

        getCurrentQuestion() {
            return this.currentSequence[this.currentIndex] ?? null;
        }

        registerAttempt(isCorrect, isDifficult) {
            if (isCorrect) {
                this.getCurrentQuestion().answeredCorrectly = true;
                if (this.attempts === 0) {
                    this.score += isDifficult ? CONFIG.score.difficult : CONFIG.score.normal;
                } else {
                    this.score += CONFIG.score.secondTry;
                }
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
            this.activeCategory = null;
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
                questionCountContainer: document.querySelector(selectors.questionCountContainer),
                quizContent: document.querySelector(selectors.quizContent),
                questionElement: document.querySelector(selectors.questionElement),
                questionImage: document.querySelector(selectors.questionImage),
                answerButtons: Array.from(document.querySelectorAll(selectors.answerButtons)),
                categoryButtons: Array.from(document.querySelectorAll(selectors.categoryButtons)),
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
                modal: document.querySelector(selectors.modal),
                modalContent: document.querySelector(selectors.modalContent),
                modalCloseButton: document.querySelector(selectors.modalCloseButton)
            };
        }

        onCategorySelected(callback) {
            this.elements.categoryButtons.forEach(btn => {
                btn.addEventListener('click', () => callback(btn.dataset.category));
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
            const { type, imageUrl, answers, difficult } = question;

            questionElement.textContent = question.question;
            quizHeadertext.textContent = difficult ? 'Hero-Frage:' : 'Frage:';
            quizContent.classList.toggle('quiz__difficult_question', Boolean(difficult));
            quizHeadertext.classList.toggle('quiz__headertext--difficult', Boolean(difficult));

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
            this.elements.score.textContent = `Punkte: ${score}`;
            this.elements.score.classList.add('quiz__score--animation');
            window.setTimeout(() => {
                this.elements.score.classList.remove('quiz__score--animation');
            }, 800);
        }

        showResultModal({ score, percentage }) {
            this.elements.modalContent.innerHTML = `
                <h2 class="modal__headline">Quiz beendet!</h2>
                <p>Deine Punktzahl ist: <strong>${score}</strong> (${percentage}%)</p>
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
            this.view.showLoadingMessage('Lade Fragen...');
            try {
                const data = await this.dataService.loadAll();
                this.state.setData(data);
                this.registerEvents();
                this.view.showCategories();
            } catch (error) {
                console.error(error);
                this.view.showLoadingMessage('Fehler beim Laden. Bitte später erneut versuchen.');
            }
        }

        registerEvents() {
            this.view.onCategorySelected(categoryId => this.handleCategorySelected(categoryId));
            this.view.onQuestionCountSelected(count => this.handleQuestionCountSelected(count));
            this.view.onAnswerSelected(index => this.handleAnswerSelected(index));
            this.view.onNext(() => this.handleNextQuestion());
            this.view.onAbort(() => this.handleAbort());
            this.view.onModalClose(() => this.view.hideResultModal());
        }

        handleCategorySelected(categoryId) {
            if (!this.state.hasCategory(categoryId)) {
                return;
            }
            this.state.activeCategory = categoryId;
            this.view.showQuestionCount();
        }

        handleQuestionCountSelected(count) {
            try {
                this.state.prepareRound(this.state.activeCategory, count);
                this.view.showQuiz();
                this.renderCurrentQuestion();
                this.view.updateScore(this.state.score);
            } catch (error) {
                console.error(error);
                this.view.showLoadingMessage('Fragen konnten nicht geladen werden.');
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
                total: this.state.currentSequence.length
            });
        }

        handleAnswerSelected(index) {
            const question = this.state.getCurrentQuestion();
            if (!question || this.state.attempts >= CONFIG.maxAttempts) {
                return;
            }

            const isCorrect = index === question.correct;
            this.view.markAnswerButton(index, isCorrect);

            if (question.backgroundKnowledge) {
                this.view.renderBackgroundKnowledge(question.backgroundKnowledge);
            }

            const feedbackArray = this.pickFeedbackArray(question, isCorrect);
            const message = this.pickRandomEntry(feedbackArray);
            this.view.renderFeedback(message, { isCorrect });
            this.state.registerAttempt(isCorrect, Boolean(question.difficult));
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
            if (isCorrect) {
                if (question.difficult && this.state.attempts === 0) {
                    return messages.difficultCorrectFirstTry;
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
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        const dataService = new QuizDataService({
            questionsUrl: CONFIG.questionsUrl,
            feedbackUrl: CONFIG.feedbackUrl
        });
        const state = new QuizState();
        const view = new QuizView(SELECTORS);
        const controller = new QuizController({ dataService, state, view });

        controller.init();
    });
})();
