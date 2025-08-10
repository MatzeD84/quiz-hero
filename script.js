let currentQuestions = [];  // Enthält die aktuell ausgewählten Fragen
let currentQuestionIndex = 0;  // Index der aktuellen Frage
let attempts = 0;  // Anzahl der Versuche für die aktuelle Frage
let score = 0;  // Gesamtpunktzahl
let questions = {};  // Objekt für alle geladenen Fragen aus JSON
let feedbackMessages = {};  // Objekt für Feedback-Nachrichten aus JSON


const feedbackIconCorrect = document.getElementById('js-feedback-icon-correct');
const feedbackIconIncorrect = document.getElementById('js-feedback-icon-incorrect');
const modal = document.getElementById('js-result-modal');
const modalContent = document.getElementById('js-result-content');
const modalClose = document.getElementById('js-modal-close');

/**
 * Daten laden (Fragen + Feedback)
 */
document.addEventListener('DOMContentLoaded', () => {
    Promise.all([
        // Lädt 'questions.json' sowie 'feedback.json' und konvertiert die Antwort in JSON-Format
        // konvertiert die Antwort (response) von einem HTTP-Response-Objekt in eine JavaScript-Objektstruktur (JSON).
        fetch('questions.json').then(response => response.json()),
        fetch('feedback.json').then(response => response.json())
    ])
    // Wenn beide Dateien erfolgreich geladen wurden, landen sie in questionsData & feedbackData
    .then(([questionsData, feedbackData]) => {
        questions = questionsData;
        feedbackMessages = feedbackData;
        // Quiz vorbereiten
        initializeQuiz();
        //processTags();
    })
    .catch(error => console.error('Error loading data:', error));
});


/**
 * Quiz initialisieren
 * 
 * Funktion wird nach dem Laden der JSON-Daten gestartet. Sie stellt sicher, dass der
 * Benutzer zuerst eine Kategorie auswählt dann die Anzahl an Fragen und erst danach
 * die eigentlichen vier Fragen sieht.
 */
function initializeQuiz() {

    const categoryContainer = document.getElementById('js-category-container');
    const questionCountContainer = document.getElementById('js-question-count-container');
    const quizContent = document.getElementById('js-quiz-content');
    const nextButton = document.getElementById('js-next-btn');
    const abortButton = document.getElementById('js-abort-btn');
    
    // Fügt Event-Listener für Kategorie-Buttons hinzu
    document.querySelectorAll('.js-category-btn').forEach(btn => {
        btn.addEventListener('click', () => showQuestionCountOptions(btn.dataset.category));
    });

    // Fügt Event-Listener für die Buttons zur Auswahl der Anzahl der Fragen hinzu
    document.querySelectorAll('.js-question-count-btn').forEach(btn => {
        btn.addEventListener('click', () => selectCategory(btn.dataset.count));
    });

    // Event-Listener für die Steuerung des Quiz. Geht zur nächsten Frage. Bricht das Quiz ab
    nextButton.addEventListener('click', nextQuestion);
    abortButton.addEventListener('click', abortQuiz);

    // Fügt Event-Listener für die Antwort-Buttons hinzu
    document.querySelectorAll('.js-answer-btn').forEach((btn, index) => {
        btn.addEventListener('click', () => selectAnswer(index));
    });

    /**
     * Startansicht festlegen:
     */

    // Zeigt den Kategorie-Auswahlbereich an
    showElement(categoryContainer);

    // Schließt das Ergebnis-Modal, wenn der Schließen-Button geklickt wird
    modalClose.addEventListener('click', closeModal);

    /* Blendet bestimmte Elemente aus, da das Quiz noch nicht gestartet ist */
    hideElement(questionCountContainer);
    hideElement(quizContent);
    hideElement(nextButton);
}

/**
 * Anzahl der Fragen auswählen.
 * 
 * Diese Funktion wird aufgerufen, wenn der Benutzer eine Kategorie auswählt.
 * Sie zeigt die verfügbaren Optionen zur Auswahl der Anzahl der Fragen an.
 * 
 * @param {*} category 
 */
function showQuestionCountOptions(category) {

    const abortButton = document.getElementById('js-back-to-category-page');
    const questionCountContainer = document.getElementById('js-question-count-container');

    // Speichert die gewählte Kategorie im Dataset des Containers
    questionCountContainer.dataset.category = category;

    // Blendet die Kategorie-Auswahl aus, da der Benutzer eine gewählt hat
    hideElement(document.getElementById('js-category-container'));

    // Zeigt den Div-Container für die Anzahl der Fragen an
    showElement(questionCountContainer);

    // Fügt einen Event-Listener zum "Zurück"-Button hinzu, um das Quiz abzubrechen
    abortButton.addEventListener('click', abortQuiz);
}

/**
 * Fragen vorbereiten, auswählen
 * 
 * Lädt die richtigen Fragen basierend auf der Benutzerwahl. Mischt die Fragen für eine
 * zufällige Reihenfolge. Begrenzt die Anzahl der Fragen, falls nötig. Setzt den
 * Punktestand zurück und zeigt ihn an. Startet das Quiz, indem es die erste Frage lädt.
 * 
 * @param {*} count 
 */
function selectCategory(count) {

    // Holt die ausgewählte Kategorie aus dem Dataset des Containers
    const category = document.getElementById('js-question-count-container').dataset.category;

    const quizContent = document.getElementById('js-quiz-content');
    const questionCountContainer = document.getElementById('js-question-count-container');

    // Holt alle Fragen für die gewählte Kategorie aus dem `questions`-Objekt
    let selectedQuestions = questions[category];

    // Mischt die Fragen in zufälliger Reihenfolge (damit sie nicht immer gleich sind)
    shuffleArray(selectedQuestions);

    // Falls der Benutzer nicht "alle" Fragen gewählt hat, wird die Anzahl begrenzt
    if (count !== 'all') {
        // Konvertiert "count" von String zu Zahl
        const questionCount = parseInt(count, 10);
        // Wählt nur die gewünschte Anzahl an Fragen
        selectedQuestions = selectedQuestions.slice(0, questionCount);
    }

    // Speichert die ausgewählten Fragen für das aktuelle Quiz
    currentQuestions = selectedQuestions;

    // Setzt den Index der aktuellen Frage zurück (Quiz beginnt von vorne)
    currentQuestionIndex = 0;

    // Setzt den Punktestand zurück
    score = 0;

    // Aktualisiert die Anzeige der Punkte im UI
    updateScore();

    // Zeigt den Quiz-Bereich an
    showElement(quizContent);

    // Blendet die Frageauswahl aus, da das Quiz beginnt
    hideElement(questionCountContainer);

    /* mit erster Frage beginnen */
    loadQuestion();
}

/**
 * Mischt die Elemente eines Arrays in zufälliger Reihenfolge
 * 
 * wird verwendet, um sicherzustellen, dass die Fragen in jedem Quiz
 * in einer anderen Reihenfolge erscheinen. Die Schleife läuft rückwärts durch das Array
 * Zufällige Zahl wird für den Tausch generiert, Elemente werden getauscht.
 * 
 * @param {*} array 
 */
function shuffleArray(array) {

    // Durchläuft das Array von hinten nach vorne (Fisher-Yates-Algorithmus)
    for (let i = array.length - 1; i > 0; i--) {
        // Wählt eine zufällige Position zwischen 0 und i
        const j = Math.floor(Math.random() * (i + 1));
        // Tauscht das aktuelle Element (array[i]) mit dem zufällig gewählten Element (array[j])
        [array[i], array[j]] = [array[j], array[i]];
    }
}

/**
 * Lädt und zeigt die nächste Quizfrage an.
 * 
 * Frage und Antworten werden angezeigt. Sie aktualisiert das UI mit der neuen Frage,
 * möglichen Antworten, einem optionalen Bild und setzt die Benutzerinteraktion zurück.
 */
function loadQuestion() {

    // Extrahiert die aktuellen Fragedaten aus dem "currentQuestions"-Array.
    const { type, question, answers, imageUrl, difficult } = currentQuestions[currentQuestionIndex];

    const questionElement = document.getElementById('js-question');
    const imageElement = document.getElementById('js-question-image');
    const buttons = document.querySelectorAll('.js-answer-btn');
    const feedbackElement = document.getElementById('js-feedback');
    const currentQuestionElement = document.getElementById('js-current-question');
    const totalQuestionsElement = document.getElementById('js-total-questions');
    const quizContent = document.getElementById('js-quiz-content');
    const quizHeadertext = document.getElementById('js-quiz-headertext');
    quizHeadertext.textContent = "Frage:";
    const backgroundKnowledgeElement = document.getElementById('js-background-knowledge');

    // Aktualisiert die Anzeige der aktuellen Frage (z. B. "3 / 10")
    currentQuestionElement.textContent = `${currentQuestionIndex + 1}`;
    totalQuestionsElement.textContent = `/${currentQuestions.length}`;

    // Setzt das Feedback-Element zurück (verstecken und leeren)
    feedbackElement.classList.add('hide');
    feedbackElement.textContent = '';

    // Setzt den Hintergrundwissen-Text zurück
    backgroundKnowledgeElement.classList.add('hide');
    backgroundKnowledgeElement.textContent = '';

    // Aktualisiert den Fragentext
    questionElement.textContent = question;

    // Falls es eine Bildfrage ist, wird das Bild angezeigt, sonst ausgeblendet
    imageElement.classList.toggle('hide', type !== 'image');
    if (type === 'image') imageElement.src = imageUrl;

    // Setzt alle Antwortbuttons zurück und füllt sie mit den neuen Antwortmöglichkeiten
    buttons.forEach((btn, idx) => {
        // // Antworttext setzen
        btn.textContent = answers[idx];
        // Icons zurücksetzen
        btn.classList.remove('correct', 'incorrect');
        // Button wieder aktivieren
        btn.disabled = false;
    });

    // Setzt die Anzahl der Versuche für die aktuelle Frage zurück
    attempts = 0;

    // Falls die Frage als "schwer" markiert ist, wird das Styling angepasst
    quizContent.classList.toggle('quiz__difficult_question', difficult);
    quizHeadertext.classList.toggle('quiz__headertext--difficult', difficult);
    // Aktualisiert den Headertext
    if (difficult) {
        quizHeadertext.textContent = "Hero-Frage:";
    };
}

/**
 * Antwort prüfen
 * 
 * Prüft, ob die ausgewählte Antwort korrekt ist, zeigt Feedback an, aktualisiert die
 * Punktzahl und entscheidet, ob die Frage beendet werden soll oder ob der Nutzer eine
 * zweite Chance bekommt.
 * 
 * @param {*} selectedAnswerIndex 
 */
function selectAnswer(selectedAnswerIndex) {
    // Alle Antwortbuttons abrufen
    const buttons = document.querySelectorAll('.js-answer-btn');

    // Die aktuelle Frage und relevante Eigenschaften extrahieren
    const { correct, difficult, backgroundKnowledge } = currentQuestions[currentQuestionIndex];
    
    // DOM-Elemente für Feedback und Steuerung
    const feedbackElement = document.getElementById('js-feedback');
    const nextButton = document.getElementById('js-next-btn');
    const backgroundKnowledgeElement = document.getElementById('js-background-knowledge');

    // Prüfen, ob die ausgewählte Antwort korrekt ist
    const isCorrect = selectedAnswerIndex === correct;

    // Antwortbutton farblich markieren (grün für richtig, rot für falsch CSS)
    buttons[selectedAnswerIndex].classList.add(isCorrect ? 'correct' : 'incorrect');

    // Falls Hintergrundwissen existiert, wird es angezeigt
    if (backgroundKnowledge) {
        backgroundKnowledgeElement.textContent = backgroundKnowledge;
    }

    // Antwortprüfung: Ist die Antwort richtig? */
    if (isCorrect) {
        // Die Frage wird als "richtig beantwortet" markiert
        currentQuestions[currentQuestionIndex].answeredCorrectly = true;
        let feedbackArray;

        // Entscheidet, welches Feedback angezeigt wird
        if (difficult && attempts === 0) {
            feedbackArray = feedbackMessages.difficultCorrectFirstTry;
        } else if (attempts === 0) {
            feedbackArray = feedbackMessages.correctFirstTry;
        } else {
            feedbackArray = feedbackMessages.correctSecondTry;
            // Versteckt das Fehler-Icon
            feedbackIconIncorrect.classList.add('hide');
        }

        // Zufällige positive Rückmeldung anzeigen
        feedbackElement.textContent = getRandomFeedback(feedbackArray);
        // Zeigt das Korrekt-Icon
        feedbackIconCorrect.classList.remove('hide');

        /* Punktesystem:
           - 3 Punkte für normale Fragen beim 1. Versuch.
           - 5 Punkte für schwere Fragen beim 1. Versuch.
           - 1 Punkt für richtige Antwort im 2. Versuch. */
        score += attempts === 0 ? (difficult ? 5 : 3) : 1;

        // Animiert den Punktestand-Anstieg
        animateScoreIncrease();

        // Beendet die Frage (deaktiviert Buttons, zeigt den "Weiter"-Button)
        endQuestion(buttons, feedbackElement, nextButton, backgroundKnowledgeElement);

    //  Falls die Antwort falsch ist */
    } else {
        // Zufällige negative Rückmeldung anzeigen, unterschied zwischen Versuch 1 und 2
        const feedbackArray = attempts === 0 ? feedbackMessages.incorrectFirstTry : feedbackMessages.incorrectSecondTry;
        feedbackElement.textContent = getRandomFeedback(feedbackArray);

        // Fehler-Icon anzeigen
        feedbackIconIncorrect.classList.remove('hide');

        // Falls der Benutzer die Frage zweimal falsch beantwortet hat, wird die richtige Antwort angezeigt.
        if (attempts === 1) {
            // Richtige Antwort hervorheben
            buttons[correct].classList.add('correct');
            endQuestion(buttons, feedbackElement, nextButton, backgroundKnowledgeElement);
        } else {
            // Erst nach der zweiten falschen Antwort bleibt das Feedback sichtbar
            feedbackElement.classList.remove('hide');
        }
    }

    // Versuchszähler wird erhöht.
    attempts++;

    // Aktualisiert die Punktzahl-Anzeige
    updateScore();
}

/**
 * Funktion sorgt dafür, dass eine Quizfrage beendet wird indem:
 * 
 * 1. Alle Antwortbuttons deaktiviert werden (damit der Benutzer nicht erneut klicken kann).
 * 2. Das Feedback zur Antwort angezeigt wird.
 * 3. Der „Weiter“-Button sichtbar wird (damit der Benutzer zur nächsten Frage gehen kann).
 * 4. Zusätzliche Hintergrundinformationen (falls vorhanden) angezeigt werden.
 * 
 * @param {*} buttons 
 * @param {*} feedbackElement 
 * @param {*} nextButton 
 * @param {*} backgroundKnowledgeElement 
 */
function endQuestion(buttons, feedbackElement, nextButton, backgroundKnowledgeElement) {
    // Alle Antwortbuttons deaktivieren (damit der Nutzer nicht nochmal klicken kann)
    buttons.forEach(btn => btn.disabled = true);

    // Das Feedback-Element sichtbar machen (zeigt z. B. „Richtig!“ oder „Leider falsch.“ an)
    feedbackElement.classList.remove('hide');

    // Den „Weiter“-Button einblenden, damit der Nutzer zur nächsten Frage wechseln kann
    nextButton.classList.remove('hide');

    // Falls es Hintergrundwissen zur Frage gibt, wird es nun sichtbar
    backgroundKnowledgeElement.classList.remove('hide');
}

/**
 * Nächste Frage anzeigen
 * 
 * Die nächste Frage geladen wird, falls noch weitere Fragen vorhanden sind.
 * Falls das Quiz beendet ist, das Ergebnis-Modalfenster (showResultModal()) anzeigen.
 * Bestimmte Elemente (wie das Feedback) wieder ausblenden, um eine saubere
 * Benutzerführung zu gewährleisten.
 */
function nextQuestion() {
    const backgroundKnowledgeElement = document.getElementById('js-background-knowledge');
    const nextButton = document.getElementById('js-next-btn');

    // Den Index für die aktuelle Frage erhöhen (zur nächsten Frage wechseln)
    currentQuestionIndex++;

    // Prüfen, ob es noch weitere Fragen gibt
    if (currentQuestionIndex < currentQuestions.length) {
        // Feedback-Icons für richtige und falsche Antworten verstecken
        feedbackIconCorrect.classList.add('hide');
        feedbackIconIncorrect.classList.add('hide');

        // Die nächste Frage laden
        loadQuestion();

        // Den „Weiter“-Button verstecken, damit der Nutzer nicht voreilig klickt
        hideElement(nextButton);

    // Falls es keine weiteren Fragen gibt: Quiz beenden und das Ergebnis anzeigen
    } else {
        showResultModal();

        // Das Quiz verstecken und zurück zum Kategorien-Container wechseln
        toggleVisibility('js-quiz-content', 'js-category-container');

        // Feedback-Icons für richtige/falsche Antworten ausblenden
        hideElement(feedbackIconCorrect);
        hideElement(feedbackIconIncorrect);

        // Falls das Hintergrundwissen angezeigt wird, ausblenden
        if (!backgroundKnowledgeElement.classList.contains('hide')) {
            hideElement(backgroundKnowledgeElement);
        }

        // Den „Weiter“-Button ausblenden, da es keine weiteren Fragen gibt
        hideElement(nextButton);
    }
}

/**
 * Quiz abbrechen
 * 
 * Bricht das Quiz sauber ab und führt den Benutzer zurück zur Startseite.
 * Verhindert visuelle Fehler, indem alle unnötigen UI-Elemente versteckt werden.
 * Setzt den Punktestand auf 0, damit ein neuer Quiz-Versuch fair beginnt.
 */
function abortQuiz() {
    const questionCountContainer = document.getElementById('js-question-count-container');
    const nextButton = document.getElementById('js-next-btn');
    const backgroundKnowledgeElement = document.getElementById('js-background-knowledge');

    // Zurück zur Kategorie-Auswahl wechseln und das Quiz verstecken
    toggleVisibility('js-quiz-content', 'js-category-container');

    // Punktestand zurücksetzen
    score = 0;

    // Feedback-Icons für richtige und falsche Antworten verstecken
    feedbackIconIncorrect.classList.add('hide');
    feedbackIconCorrect.classList.add('hide');

    // Falls Hintergrundwissen angezeigt wird, verstecken
    if (!backgroundKnowledgeElement.classList.contains('hide')) {
        hideElement(backgroundKnowledgeElement);
    }

    // Falls die Frageanzahl-Auswahl noch sichtbar ist, verstecken
    if (!questionCountContainer.classList.contains('hide')) {
        hideElement(questionCountContainer);
    }

    // Falls der "Weiter"-Button sichtbar ist, verstecken
    if (!nextButton.classList.contains('hide')) {
        hideElement(nextButton);
    }

    // Punktestand visuell aktualisieren
    updateScore();
}

/**
 * Modal welches zum Ende des Quiz angezeigt wird
 */
function showResultModal() {

    //  Die Korrektheitsrate (in Prozent) berechnen
    const correctPercentage = calculateCorrectPercentage();
    modalContent.innerHTML = `<h2 class="modal__headline">Quiz beendet!</h2><p>Deine Punktzahl ist: <strong>${score}</strong> (${correctPercentage}%)</p>`;
    showElement(modal);
}

function closeModal() {
    hideElement(modal);
}

function updateScore() {
    const scoreElement =  document.getElementById('js-score')
    scoreElement.textContent = `Punkte: ${score}`;
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


function animateScoreIncrease() {
    const scoreElement = document.getElementById('js-score');
    scoreElement.classList.add('quiz__score--animation');

    setTimeout(() => {
        scoreElement.classList.remove('quiz__score--animation');
    }, 800);
}

function calculateCorrectPercentage() {
    const totalQuestions = currentQuestions.length;
    const correctAnswers = currentQuestions.filter(q => q.answeredCorrectly).length;
    const percentage = (correctAnswers / totalQuestions) * 100;
    return Math.round(percentage);
}


// Funktion zum Verarbeiten der Tags, nachdem questions geladen wurde
function processTags() {
    const tagCounter = {};  // Speichert die Anzahl der Tags
    const tagToQuestions = {}; // Speichert Fragen nach Tags gruppiert

    // 🔍 Alle Fragen durchsuchen und Tags gruppieren
    for (const category in questions) {
        questions[category].forEach(question => {
            question.tag.forEach(tag => {
                if (!tagCounter[tag]) {
                    tagCounter[tag] = 0;
                    tagToQuestions[tag] = [];
                }
                tagCounter[tag]++;
                tagToQuestions[tag].push(question);
            });
        });
    }

    createTagButtons(tagCounter, tagToQuestions);
}


function createTagButtons(tagCounter, tagToQuestions) {
    const tagContainer = document.getElementById('tag-container');
    tagContainer.innerHTML = ''; // Vorherige Inhalte entfernen

    for (const tag in tagCounter) {
        const button = document.createElement('button');
        button.textContent = `${tag} (${tagCounter[tag]})`;
        button.classList.add('tag-button');
        button.addEventListener('click', () => displayQuestionsByTag(tag, tagToQuestions));
        tagContainer.appendChild(button);
    }
}

function displayQuestionsByTag(tag, tagToQuestions) {
    const questionContainer = document.getElementById('question-container');
    questionContainer.innerHTML = ''; // Vorherige Inhalte entfernen

    tagToQuestions[tag].forEach(question => {
        const questionElement = document.createElement('div');
        questionElement.classList.add('question-item');

        // Falls ein Bild vorhanden ist, hinzufügen
        if (question.type === 'image' && question.imageUrl) {
            const imageElement = document.createElement('img');
            imageElement.src = question.imageUrl;
            imageElement.alt = 'Fragenbild';
            imageElement.classList.add('question-image');
            questionElement.appendChild(imageElement);
        }

        // Frage hinzufügen
        const questionText = document.createElement('h3');
        questionText.textContent = question.question;
        questionElement.appendChild(questionText);

        // Antwortmöglichkeiten hinzufügen
        const answerList = document.createElement('ul');
        question.answers.forEach(answer => {
            const answerItem = document.createElement('li');
            answerItem.textContent = answer;
            answerList.appendChild(answerItem);
        });
        questionElement.appendChild(answerList);

        questionContainer.appendChild(questionElement);
    });
}
