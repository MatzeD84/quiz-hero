const questions = {
    italien: [
        {
            type: 'text',
            question: 'Was ist die Hauptstadt von Italien?',
            answers: ['Mailand', 'Rom', 'Venedig', 'Florenz'],
            correct: 1,
            difficult: false
        },
        {
            type: 'image',
            imageUrl: 'images/kolosseum.jpg',
            question: 'Was ist auf dem Bild zu erkennen?',
            answers: ['Kolosseum', 'Pantheon', 'Markusplatz', 'Trevi-Brunnen'],
            correct: 0,
            difficult: true
        },
        {
            type: 'text',
            question: 'Welche Sprache wird in Italien gesprochen?',
            answers: ['Spanisch', 'Französisch', 'Italienisch', 'Deutsch'],
            correct: 2,
            difficult: false
        }
    ],
    hamburg: [
        {
            type: 'text',
            question: 'Welcher Fluss fließt durch Hamburg?',
            answers: ['Rhein', 'Elbe', 'Donau', 'Weser'],
            correct: 1,
            difficult: false
        },
        {
            type: 'image',
            imageUrl: 'images/michel.jpg',
            question: 'Was ist auf dem Bild zu erkennen?',
            answers: ['Berliner Dom', 'Kölner Dom', 'Frauenkirche', 'Michel'],
            correct: 3,
            difficult: true
        },
        {
            type: 'text',
            question: 'Wie heißt der größte Hafen Deutschlands?',
            answers: ['Bremerhaven', 'Hamburger Hafen', 'Kieler Hafen', 'Rostocker Hafen'],
            correct: 1,
            difficult: false
        }
    ]
};

let currentQuestions = [];
let currentQuestionIndex = 0;
let attempts = 0;
let score = 0;

document.addEventListener('DOMContentLoaded', () => {
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
});

function selectCategory(category) {
    currentQuestions = questions[category];
    currentQuestionIndex = 0;
    score = 0;
    updateScore();
    showElement(document.getElementById('quiz-content'));
    hideElement(document.getElementById('category-container'));
    loadQuestion();
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
        feedbackElement.textContent = attempts === 0 ? 'Super!' : 'Nicht schlecht!';
        score += attempts === 0 ? (difficult ? 5 : 3) : 1;
        endQuestion(buttons, feedbackElement, nextButton);
    } else {
        feedbackElement.textContent = attempts === 0 ? 'Falsch, letzte Chance!' : 'Falsch, keine Punkte!';
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
    document.getElementById('score').textContent = `Punktestand: ${score}`;
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
