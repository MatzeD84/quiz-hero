let currentQuestions = [];
let currentQuestionIndex = 0;
let attempts = 0;
let score = 0;
let questions = {};
let feedbackMessages = {};

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
    const categoryContainer = document.getElementById('category-container');
    const quizContent = document.getElementById('quiz-content');
    const nextButton = document.getElementById('next-btn');
    const abortButton = document.getElementById('abort-btn');

    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', () => selectCategory(btn.dataset.category));
    });

    nextButton.addEventListener('click', nextQuestion);
    abortButton.addEventListener('click', abortQuiz);

    document.querySelectorAll('.answer-btn').forEach((btn, index) => {
        btn.addEventListener('click', () => selectAnswer(index));
    });

    showElement(categoryContainer);
    hideElement(quizContent);
    hideElement(nextButton);
}

function selectCategory(category) {
    currentQuestions = questions[category];
    shuffleArray(currentQuestions);
    currentQuestionIndex = 0;
    score = 0;
    updateScore();
    showElement(document.getElementById('quiz-content'));
    hideElement(document.getElementById('category-container'));
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
    const questionElement = document.getElementById('question');
    const imageElement = document.getElementById('question-image');
    const buttons = document.querySelectorAll('.answer-btn');
    const feedbackElement = document.getElementById('feedback');
    const quizContent = document.getElementById('quiz-content');

    feedbackElement.classList.add('hide');
    feedbackElement.textContent = '';

    questionElement.textContent = question;
    imageElement.classList.toggle('hide', type !== 'image');
    if (type === 'image') imageElement.src = imageUrl;

    buttons.forEach((btn, idx) => {
        btn.textContent = answers[idx];
        btn.classList.remove('correct', 'incorrect');
        btn.disabled = false;
    });

    attempts = 0;
    quizContent.classList.toggle('difficult-question', difficult);
}

function selectAnswer(selectedAnswerIndex) {
    const buttons = document.querySelectorAll('.answer-btn');
    const { correct, difficult } = currentQuestions[currentQuestionIndex];
    const feedbackElement = document.getElementById('feedback');
    const nextButton = document.getElementById('next-btn');

    const isCorrect = selectedAnswerIndex === correct;
    buttons[selectedAnswerIndex].classList.add(isCorrect ? 'correct' : 'incorrect');

    if (isCorrect) {
        let feedbackArray;
        if (difficult && attempts === 0) {
            feedbackArray = feedbackMessages.difficultCorrectFirstTry;
        } else if (attempts === 0) {
            feedbackArray = feedbackMessages.correctFirstTry;
        } else {
            feedbackArray = feedbackMessages.correctSecondTry;
        }
        feedbackElement.textContent = getRandomFeedback(feedbackArray);
        score += attempts === 0 ? (difficult ? 5 : 3) : 1;
        endQuestion(buttons, feedbackElement, nextButton);
    } else {
        const feedbackArray = attempts === 0 ? feedbackMessages.incorrectFirstTry : feedbackMessages.incorrectSecondTry;
        feedbackElement.textContent = getRandomFeedback(feedbackArray);
        if (attempts === 1) {
            buttons[correct].classList.add('correct');
            endQuestion(buttons, feedbackElement, nextButton);
        } else {
            feedbackElement.classList.remove('hide');
        }
    }
    attempts++;
    updateScore();
}

function endQuestion(buttons, feedbackElement, nextButton) {
    buttons.forEach(btn => btn.disabled = true);
    feedbackElement.classList.remove('hide');
    nextButton.classList.remove('hide');
}

function nextQuestion() {
    currentQuestionIndex++;
    if (currentQuestionIndex < currentQuestions.length) {
        loadQuestion();
        hideElement(document.getElementById('next-btn'));
    } else {
        alert(`Quiz beendet! Deine Punktzahl ist: ${score}`);
        toggleVisibility('quiz-content', 'category-container');
    }
}

function abortQuiz() {
    toggleVisibility('quiz-content', 'category-container');
    score = 0;
    updateScore();
}

function updateScore() {
    document.getElementById('score').textContent = `Punkte: ${score}`;
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
