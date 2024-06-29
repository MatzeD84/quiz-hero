// Fragen für das Quiz, unterteilt in Kategorien
const questions = {
    italien: [
        {
            type: 'text',
            question: 'Was ist die Hauptstadt von Italien?',
            answers: ['Mailand', 'Rom', 'Venedig', 'Florenz'],
            correct: 1
        },
        {
            type: 'image',
            imageUrl: 'images/kolosseum.jpg', // Beispielbildpfad
            question: 'Was ist auf dem Bild zu erkennen?',
            answers: ['Kolosseum', 'Pantheon', 'Markusplatz', 'Trevi-Brunnen'],
            correct: 0
        },
        {
            type: 'text',
            question: 'Welche Sprache wird in Italien gesprochen?',
            answers: ['Spanisch', 'Französisch', 'Italienisch', 'Deutsch'],
            correct: 2
        }
    ],
    hamburg: [
        {
            type: 'text',
            question: 'Welcher Fluss fließt durch Hamburg?',
            answers: ['Rhein', 'Elbe', 'Donau', 'Weser'],
            correct: 1
        },
        {
            type: 'image',
            imageUrl: 'images/michel.jpg', // Beispielbildpfad
            question: 'Was ist auf dem Bild zu erkennen?',
            answers: ['Berliner Dom', 'Kölner Dom', 'Frauenkirche', 'Michel'],
            correct: 3
        },
        {
            type: 'text',
            question: 'Wie heißt der größte Hafen Deutschlands?',
            answers: ['Bremerhaven', 'Hamburger Hafen', 'Kieler Hafen', 'Rostocker Hafen'],
            correct: 1
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
    document.getElementById('score').textContent = score;
    document.getElementById('category-container').classList.add('hide');
    document.getElementById('quiz-content').classList.remove('hide');
    loadQuestion();
}

// Funktion, um eine Frage zu laden
function loadQuestion() {
    const questionElement = document.getElementById('question');
    const imageElement = document.getElementById('question-image');
    const buttons = document.querySelectorAll('.answer-btn');
    const currentQuestion = currentQuestions[currentQuestionIndex];
    
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
}

// Funktion, um eine Antwort auszuwählen und zu überprüfen
function selectAnswer(selectedAnswerIndex) {
    const buttons = document.querySelectorAll('.answer-btn');
    const currentQuestion = currentQuestions[currentQuestionIndex];
    const nextButton = document.getElementById('next-btn');

    if (selectedAnswerIndex === currentQuestion.correct) {
        buttons[selectedAnswerIndex].classList.add('correct');
        if (attempts === 0) {
            score += 3; // Punkte für erste richtige Antwort
        } else if (attempts === 1) {
            score += 1; // Punkte für zweite richtige Antwort
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

// Eventlistener für das Laden der Seite
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('category-container').classList.remove('hide');
    document.getElementById('quiz-content').classList.add('hide');
});
