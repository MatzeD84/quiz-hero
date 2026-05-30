export const CONFIG = {
    questionsUrl: 'categories.json',
    tagsUrl: 'tags.json',
    feedbackUrl: 'feedback.json',
    apiUrl: 'api/index.php',
    analytics: {
        googleAnalyticsId: 'G-SYVZB974FC'
    },
    devMode: true,
    score: {
        secondTry: 1,
        difficulties: {
            easy: 2,
            medium: 3,
            hero: 5
        },
        defaultDifficulty: 'easy'
    },
    maxAttempts: 2,
    resultModalUrl: 'content/quiz-result.html'
};

export const ASSET_VERSION = '20250211';

export const LABELS = {
    questions: {
        default: 'Frage:',
        medium: 'Schwere Frage:',
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
    modalScoreLabel: 'Deine Punktzahl ist:',
    modalMaxLabel: 'Maximal erreichbar:'
};

export const SELECTORS = {
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
    feedbackContainer: '.js-quiz-feedback-container',
    feedbackElement: '#js-feedback',
    feedbackIconCorrect: '#js-feedback-icon-correct',
    feedbackIconIncorrect: '#js-feedback-icon-incorrect',
    backgroundKnowledge: '#js-background-knowledge',
    currentQuestion: '#js-current-question',
    totalQuestions: '#js-total-questions',
    score: '#js-score',
    quizHeadertext: '#js-quiz-headertext',
    selectionLabel: '#js-selection-label',
    selectionDescription: '#js-selection-description',
    selectionIcon: '#js-selection-icon',
    quizSelectionLabel: '#js-quiz-selection',
    modal: '#js-result-modal',
    modalContent: '#js-result-content',
    modalCloseButton: '#js-modal-close',
    userPanel: '#js-user-panel',
    userForm: '#js-user-form',
    userNameInput: '#js-user-name',
    userImageInput: '#js-user-image',
    userStatus: '#js-user-status',
    userPreview: '#js-user-preview',
    userLogoutButton: '#js-user-logout'
};

export const ALLOWED_DIFFICULTIES = new Set(Object.keys(CONFIG.score.difficulties));

export const getPointsForDifficulty = (difficulty, attempt) => {
    if (attempt > 0) {
        return CONFIG.score.secondTry;
    }
    const level = difficulty || CONFIG.score.defaultDifficulty;
    const table = CONFIG.score.difficulties;
    return table[level] ?? table[CONFIG.score.defaultDifficulty];
};
