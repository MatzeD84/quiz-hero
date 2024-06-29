// Fragen für das Quiz, unterteilt in Kategorien
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
            imageUrl: 'images/kolosseum.jpg', // Beispielbildpfad
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
            imageUrl: 'images/michel.jpg', // Beispielbildpfad
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

// Globale Variablen für das Quiz
let currentQuestions = [];
let currentQuestionIndex = 0;
let attempts = 0;
let score = 0;

// Funktion, um eine Kategorie auszuwählen und das Quiz zu starten
function selectCategory(category) {
    currentQuestions = questions[category];
    currentQuestionIndex = 0;
    score = 0;
    document.getElementById('score').textContent = 'Punktestand: 0';
    document.getElementById('category-container').classList.add('hide');
    document.getElementById('quiz-content').classList.remove('hide');
    loadQuestion();
}

// Funktion, um eine Frage zu laden
function loadQuestion() {
    const questionElement = document.getElementById('question');
    const imageElement = document.getElementById('question-image');
    const quizContent = document.getElementById('quiz-content');
    const buttons = document.querySelectorAll('.answer-btn');
    const currentQuestion = currentQuestions[currentQuestionIndex];
    const feedbackElement = document.getElementById('feedback');
    
    feedbackElement.classList.add('hide'); // Verstecke das Feedback-Element
    feedbackElement.textContent = ''; // Leere das Feedback-Element
    questionElement.textContent = currentQuestion.question;
    
    if (currentQuestion.type === 'image') {
        imageElement.src = currentQuestion.imageUrl;
        imageElement.classList.remove('hide');
    } else {
        imageElement.classList.add('hide');
    }

    buttons.forEach((button, index) => {
        button.textContent = currentQuestion.answers[index];
        button.classList.remove('correct', 'incorrect'); // Entferne vorherige Klassen
        button.disabled = false; // Aktiviere die Buttons
    });

    attempts = 0; // Zurücksetzen der Versuche für die nächste Frage

    // Stil für besonders schwere Fragen hinzufügen
    if (currentQuestion.difficult) {
        quizContent.classList.add('difficult-question');
    } else {
        quizContent.classList.remove('difficult-question');
    }
}

// Funktion, um eine Antwort auszuwählen und zu überprüfen
function selectAnswer(selectedAnswerIndex) {
    const buttons = document.querySelectorAll('.answer-btn');
    const currentQuestion = currentQuestions[currentQuestionIndex];
    const nextButton = document.getElementById('next-btn');
    const feedbackElement = document.getElementById('feedback');

    if (selectedAnswerIndex === currentQuestion.correct) {
        buttons[selectedAnswerIndex].classList.add('correct');
        if (attempts === 0) {
            feedbackElement.textContent = 'Super!';
            if (currentQuestion.difficult) {
                score += 5; // Punkte für besonders schwere Frage
            } else {
                score += 3; // Punkte für normale richtige Antwort
            }
        } else if (attempts === 1) {
            feedbackElement.textContent = 'Nicht schlecht!';
            score += 1; // Punkte für zweite richtige Antwort
        }
        feedbackElement.classList.remove('hide');
        nextButton.classList.remove('hide');
        buttons.forEach(button => button.disabled = true); // Deaktiviere alle Buttons
    } else {
        buttons[selectedAnswerIndex].classList.add('incorrect');
        attempts++;
        
        if (attempts === 1) {
            feedbackElement.textContent = 'Falsch, letzte Chance!';
        } else if (attempts >= 2) {
            feedbackElement.textContent = 'Falsch, keine Punkte!';
            buttons[currentQuestion.correct].classList.add('correct');
            nextButton.classList.remove('hide');
            buttons.forEach(button => button.disabled = true); // Deaktiviere alle Buttons
        }
        feedbackElement.classList.remove('hide');
    }

    document.getElementById('score').textContent = 'Punktestand: ' + score; // Aktualisiere die Punktzahl
}

// Funktion, um zur nächsten Frage zu wechseln
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

// Funktion, um das Quiz abzubrechen und zur Kategorieübersicht zurückzukehren
function abortQuiz() {
    document.getElementById('category-container').classList.remove('hide');
    document.getElementById('quiz-content').classList.add('hide');
    document.getElementById('next-btn').classList.add('hide');
    document.getElementById('quiz-content').classList.remove('difficult-question'); // Zurücksetzen des Stils für schwierige Fragen, falls vorhanden
    score = 0; // Zurücksetzen des Punktestands
    document.getElementById('score').textContent = 'Punktestand: 0';
}

// Eventlistener für das Laden der Seite
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('category-container').classList.remove('hide');
    document.getElementById('quiz-content').classList.add('hide');
});
