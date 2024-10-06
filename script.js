let currentQuestions = [];
let currentQuestionIndex = 0;
let attempts = 0;
let score = 0;
let questions = {};
let feedbackMessages = {};

const feedbackIconCorrect = document.getElementById('js-feedback-icon-correct');
const feedbackIconIncorrect = document.getElementById('js-feedback-icon-incorrect');

document.addEventListener('DOMContentLoaded', () => {
    Promise.all([
        fetch('questions.json').then(response => response.json()),
        fetch('feedback.json').then(response => response.json())
    ])
    .then(([questionsData, feedbackData]) => {
        questions = questionsData;
        feedbackMessages = feedbackData;
        initializeQuiz();
    })
    .catch(error => console.error('Error loading data:', error));
});

function initializeQuiz() {
    const categoryContainer = document.getElementById('js-category-container');
    const questionCountContainer = document.getElementById('js-question-count-container');
    const quizContent = document.getElementById('js-quiz-content');
    const nextButton = document.getElementById('js-next-btn');
    const abortButton = document.getElementById('js-abort-btn');

    document.querySelectorAll('.js-category-btn').forEach(btn => {
        btn.addEventListener('click', () => showQuestionCountOptions(btn.dataset.category));
    });

    document.querySelectorAll('.js-question-count-btn').forEach(btn => {
        btn.addEventListener('click', () => selectCategory(btn.dataset.count));
    });

    nextButton.addEventListener('click', nextQuestion);
    abortButton.addEventListener('click', abortQuiz);

    document.querySelectorAll('.js-answer-btn').forEach((btn, index) => {
        btn.addEventListener('click', () => selectAnswer(index));
    });

    showElement(categoryContainer);
    hideElement(questionCountContainer);
    hideElement(quizContent);
    hideElement(nextButton);
}

function showQuestionCountOptions(category) {
    const abortButton = document.getElementById('js-back-to-category-page');

    const questionCountContainer = document.getElementById('js-question-count-container');
    questionCountContainer.dataset.category = category;
    hideElement(document.getElementById('js-category-container'));
    showElement(questionCountContainer);
    abortButton.addEventListener('click', abortQuiz);
}

function selectCategory(count) {
    const category = document.getElementById('js-question-count-container').dataset.category;
    let selectedQuestions = questions[category];
    shuffleArray(selectedQuestions);

    if (count !== 'all') {
        const questionCount = parseInt(count, 10);
        selectedQuestions = selectedQuestions.slice(0, questionCount);
    }

    currentQuestions = selectedQuestions;
    currentQuestionIndex = 0;
    score = 0;
    updateScore();

    const quizContent = document.getElementById('js-quiz-content');
    const questionCountContainer = document.getElementById('js-question-count-container');

    showElement(quizContent);
    hideElement(questionCountContainer);

    loadQuestion();
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function loadQuestion() {
    const { type, question, answers, imageUrl, difficult } = currentQuestions[currentQuestionIndex];
    const questionElement = document.getElementById('js-question');
    const imageElement = document.getElementById('js-question-image');
    const buttons = document.querySelectorAll('.js-answer-btn');
    const feedbackElement = document.getElementById('js-feedback');
    const currentQuestionElement = document.getElementById('js-current-question');
    const totalQuestionsElement = document.getElementById('js-total-questions');
    const quizContent = document.getElementById('js-quiz-content');
    const backgroundKnowledgeElement = document.getElementById('js-background-knowledge');

    currentQuestionElement.textContent = `${currentQuestionIndex + 1}`;
    totalQuestionsElement.textContent = `/${currentQuestions.length}`;

    feedbackElement.classList.add('hide');
    feedbackElement.textContent = '';
    backgroundKnowledgeElement.classList.add('hide');
    backgroundKnowledgeElement.textContent = '';

    questionElement.textContent = question;
    imageElement.classList.toggle('hide', type !== 'image');
    if (type === 'image') imageElement.src = imageUrl;

    buttons.forEach((btn, idx) => {
        btn.textContent = answers[idx];
        btn.classList.remove('correct', 'incorrect');
        btn.disabled = false;
    });

    attempts = 0;
    quizContent.classList.toggle('quiz__difficult_question', difficult);
}

function selectAnswer(selectedAnswerIndex) {
    const buttons = document.querySelectorAll('.js-answer-btn');
    const { correct, difficult, backgroundKnowledge } = currentQuestions[currentQuestionIndex];
    const feedbackElement = document.getElementById('js-feedback');
    const nextButton = document.getElementById('js-next-btn');
    const backgroundKnowledgeElement = document.getElementById('js-background-knowledge');

    const isCorrect = selectedAnswerIndex === correct;
    buttons[selectedAnswerIndex].classList.add(isCorrect ? 'correct' : 'incorrect');

    if (backgroundKnowledge) {
        backgroundKnowledgeElement.textContent = backgroundKnowledge;
    }

    if (isCorrect) {
        let feedbackArray;
        if (difficult && attempts === 0) {
            feedbackArray = feedbackMessages.difficultCorrectFirstTry;
        } else if (attempts === 0) {
            feedbackArray = feedbackMessages.correctFirstTry;
        } else {
            feedbackArray = feedbackMessages.correctSecondTry;
            feedbackIconIncorrect.classList.add('hide');
        }
        feedbackElement.textContent = getRandomFeedback(feedbackArray);
        feedbackIconCorrect.classList.remove('hide');
        score += attempts === 0 ? (difficult ? 5 : 3) : 1;
        endQuestion(buttons, feedbackElement, nextButton, backgroundKnowledgeElement);

    } else {
        const feedbackArray = attempts === 0 ? feedbackMessages.incorrectFirstTry : feedbackMessages.incorrectSecondTry;
        feedbackElement.textContent = getRandomFeedback(feedbackArray);
        feedbackIconIncorrect.classList.remove('hide');
        if (attempts === 1) {
            buttons[correct].classList.add('correct');
            endQuestion(buttons, feedbackElement, nextButton, backgroundKnowledgeElement);
        } else {
            feedbackElement.classList.remove('hide');
        }
    }
    attempts++;
    updateScore();
}

function endQuestion(buttons, feedbackElement, nextButton, backgroundKnowledgeElement) {
    buttons.forEach(btn => btn.disabled = true);
    feedbackElement.classList.remove('hide');
    nextButton.classList.remove('hide');
    backgroundKnowledgeElement.classList.remove('hide');
}

function nextQuestion() {
    const backgroundKnowledgeElement = document.getElementById('js-background-knowledge');
    const nextButton = document.getElementById('js-next-btn');
    currentQuestionIndex++;
    if (currentQuestionIndex < currentQuestions.length) {
        feedbackIconCorrect.classList.add('hide');
        feedbackIconIncorrect.classList.add('hide');
        loadQuestion();
        hideElement(nextButton);
    } else {
        alert(`Quiz beendet! Deine Punktzahl ist: ${score}`);
        toggleVisibility('js-quiz-content', 'js-category-container');
        hideElement(feedbackIconCorrect);
        hideElement(feedbackIconIncorrect);
        if (!backgroundKnowledgeElement.classList.contains('hide')) {
            hideElement(backgroundKnowledgeElement);
        }
        hideElement(nextButton);
    }
}

function abortQuiz() {
    const questionCountContainer = document.getElementById('js-question-count-container');
    const nextButton = document.getElementById('js-next-btn');
    toggleVisibility('js-quiz-content', 'js-category-container');
    score = 0;
    feedbackIconIncorrect.classList.add('hide');
    feedbackIconCorrect.classList.add('hide');
    const backgroundKnowledgeElement = document.getElementById('js-background-knowledge');
    if (!backgroundKnowledgeElement.classList.contains('hide')) {
        hideElement(backgroundKnowledgeElement);
    }
    if (!questionCountContainer.classList.contains('hide')) {
        hideElement(questionCountContainer);
    }
    if (!nextButton.classList.contains('hide')) {
        hideElement(nextButton);
    }
    updateScore();
}

function updateScore() {
    document.getElementById('js-score').textContent = `Punkte: ${score}`;
}

function toggleVisibility(hideId, showId) {
    hideElement(document.getElementById(hideId));
    showElement(document.getElementById(showId));
}

function showElement(element) {
    element.classList.remove('hide');
}

function hideElement(element) {
    element.classList.add('hide');
}

function getRandomFeedback(feedbackArray) {
    return feedbackArray[Math.floor(Math.random() * feedbackArray.length)];
}
