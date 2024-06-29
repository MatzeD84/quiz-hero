const questions = {
    italien: [
        {
            question: 'Was ist die Hauptstadt von Italien?',
            answers: ['Mailand', 'Rom', 'Venedig', 'Florenz'],
            correct: 1
        },
        {
            question: 'Welche Sprache wird in Italien gesprochen?',
            answers: ['Spanisch', 'Französisch', 'Italienisch', 'Deutsch'],
            correct: 2
        },
        {
            question: 'Welches berühmte Bauwerk steht in Pisa?',
            answers: ['Kolosseum', 'Schiefer Turm', 'Pantheon', 'Petersdom'],
            correct: 1
        }
    ],
    hamburg: [
        {
            question: 'Welcher Fluss fließt durch Hamburg?',
            answers: ['Rhein', 'Elbe', 'Donau', 'Weser'],
            correct: 1
        },
        {
            question: 'Wie heißt der größte Hafen Deutschlands?',
            answers: ['Bremerhaven', 'Hamburger Hafen', 'Kieler Hafen', 'Rostocker Hafen'],
            correct: 1
        },
        {
            question: 'Welche bekannte Kirche steht in Hamburg?',
            answers: ['Berliner Dom', 'Kölner Dom', 'Frauenkirche', 'Michel'],
            correct: 3
        }
    ]
};

let currentQuestions = [];
let currentQuestionIndex = 0;
let attempts = 0;
let score = 0;

function selectCategory(category) {
    currentQuestions = questions[category];
    currentQuestionIndex = 0;
    score = 0;
    document.getElementById('score').textContent = score;
    document.getElementById('category-container').classList.add('hide');
    document.getElementById('quiz-content').classList.remove('hide');
    loadQuestion();
}

function loadQuestion() {
    const questionElement = document.getElementById('question');
    const buttons = document.querySelectorAll('.answer-btn');
    const currentQuestion = currentQuestions[currentQuestionIndex];
    
    questionElement.textContent = currentQuestion.question;
    buttons.forEach((button, index) => {
        button.textContent = currentQuestion.answers[index];
        button.classList.remove('correct', 'incorrect'); // Entferne vorherige Klassen
        button.disabled = false; // Aktiviere die Buttons
    });

    attempts = 0; // Zurücksetzen der Versuche für die nächste Frage
}

function selectAnswer(selectedAnswerIndex) {
    const buttons = document.querySelectorAll('.answer-btn');
    const currentQuestion = currentQuestions[currentQuestionIndex];
    const nextButton = document.getElementById('next-btn');

    if (selectedAnswerIndex === currentQuestion.correct) {
        buttons[selectedAnswerIndex].classList.add('correct');
        if (attempts === 0) {
            score += 3;
        } else if (attempts === 1) {
            score += 1;
        }
        nextButton.classList.remove('hide');
        buttons.forEach(button => button.disabled = true); // Deaktiviere alle Buttons
    } else {
        buttons[selectedAnswerIndex].classList.add('incorrect');
        attempts++;
        
        if (attempts >= 2) {
            buttons[currentQuestion.correct].classList.add('correct');
            nextButton.classList.remove('hide');
            buttons.forEach(button => button.disabled = true); // Deaktiviere alle Buttons
        }
    }

    document.getElementById('score').textContent = score; // Aktualisiere die Punktzahl
}

function nextQuestion() {
    currentQuestionIndex++;
    if (currentQuestionIndex < currentQuestions.length) {
        loadQuestion();
        document.getElementById('next-btn').classList.add('hide');
    } else {
        alert('Quiz beendet! Deine Punktzahl ist: ' + score);
        document.getElementById('category-container').classList.remove('hide');
        document.getElementById('quiz-content').classList.add('hide');
        document.getElementById('next-btn').classList.add('hide');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('category-container').classList.remove('hide');
    document.getElementById('quiz-content').classList.add('hide');
});
