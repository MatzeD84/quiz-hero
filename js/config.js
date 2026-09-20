const isDevelopmentHost = () => {
    if (typeof window === 'undefined') {
        return false;
    }
    return ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);
};

export const CONFIG = {
    questionsUrl: 'data/categories.json',
    tagsUrl: 'data/tags.json',
    feedbackUrl: 'data/feedback.json',
    apiUrl: 'api/index.php',
    apiVersion: '1',
    analytics: {
        googleAnalyticsId: 'G-SYVZB974FC'
    },
    devMode: isDevelopmentHost(),
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

export const ASSET_VERSION = 'dev';

const createDefaultHeroAvatar = () => ({
    key: 'hero',
    label: 'Quiz-Hero',
    url: normalizeAvatarUrl('images/website/avatar/quizo.png')
});

export const normalizeAvatarUrl = url => {
    const value = String(url || '').trim();
    if (!value) {
        return '';
    }

    if (/^(https?:)?\/\//i.test(value) || value.startsWith('data:') || value.startsWith('blob:')) {
        return value;
    }

    const normalized = value.replace(/^\/+/, '');
    if (/^images\/website\/(?:avatar\/)?(?:logo|hero-denkt-nach|hero-gruebelt|hero-arbeitet|hero-pinwand)\.png$/i.test(normalized)) {
        return 'images/website/avatar/quizo.png';
    }
    if (normalized.startsWith('images/website/')) {
        if (!normalized.startsWith('images/website/avatar/')) {
            return `images/website/avatar/${normalized.slice('images/website/'.length)}`;
        }
        return normalized;
    }

    return normalized.startsWith('images/') ? normalized : `images/website/avatar/${normalized}`;
};

export const HERO_AVATARS = [createDefaultHeroAvatar()];

export const loadHeroAvatars = async () => {
    try {
        const url = new URL('../data/avatars.json', import.meta.url);
        url.searchParams.set('v', ASSET_VERSION);
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Avatar-Config konnte nicht geladen werden (${response.status})`);
        }
        const avatars = await response.json();
        if (!Array.isArray(avatars)) {
            throw new Error('Avatar-Config hat kein gültiges Format.');
        }
        const normalized = avatars
            .map(avatar => ({
                key: String(avatar?.key || '').trim(),
                label: String(avatar?.label || '').trim(),
                url: normalizeAvatarUrl(String(avatar?.url || '').trim())
            }))
            .filter(avatar => avatar.key && avatar.label && avatar.url);
        if (normalized.length > 0) {
            HERO_AVATARS.splice(0, HERO_AVATARS.length, ...normalized);
        }
    } catch (error) {
        console.warn('Avatar-Config konnte nicht geladen werden, verwende Fallback.', error);
    }

    return HERO_AVATARS;
};

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
    questionFeedbackOpen: '#js-question-feedback-open',
    questionFeedbackModal: '#js-question-feedback-modal',
    questionFeedbackClose: '#js-question-feedback-close',
    questionFeedbackForm: '#js-question-feedback-form',
    questionFeedbackComment: '#js-question-feedback-comment',
    questionFeedbackStatus: '#js-question-feedback-status',
    backgroundKnowledge: '#js-background-knowledge',
    currentQuestion: '#js-current-question',
    totalQuestions: '#js-total-questions',
    score: '#js-score',
    scoreChange: '#js-score-change',
    quizHeadertext: '#js-quiz-headertext',
    selectionLabel: '#js-selection-label',
    selectionDescription: '#js-selection-description',
    selectionIcon: '#js-selection-icon',
    quizSelectionLabel: '#js-quiz-selection',
    modal: '#js-result-modal',
    modalContent: '#js-result-content',
    modalCloseButton: '#js-modal-close',
    userPanel: '#js-user-panel',
    userLoginForm: '#js-account-login-form',
    userRegisterForm: '#js-account-register-form',
    userResetRequestForm: '#js-account-reset-request-form',
    userResetForm: '#js-account-reset-form',
    userAccountForm: '#js-account-form',
    userLoginIdentifierInput: '#js-account-login-identifier',
    userLoginPasswordInput: '#js-account-login-password',
    userRegisterNameInput: '#js-account-register-username',
    userRegisterEmailInput: '#js-account-register-email',
    userRegisterPasswordInput: '#js-account-register-password',
    userRegisterPrivacyInput: '#js-account-register-privacy',
    userResetEmailInput: '#js-account-reset-email',
    userResetTokenInput: '#js-account-reset-token',
    userResetPasswordInput: '#js-account-reset-password',
    userAccountNameInput: '#js-account-username',
    userAccountPasswordInput: '#js-account-password',
    userAvatarGroups: '.js-account-avatar-group',
    userTabs: '.js-account-tab',
    userPanels: '.js-account-panel',
    userDevLoginButton: '#js-account-dev-login',
    userDeleteButton: '#js-account-delete',
    userStatus: '#js-user-status',
    userPreview: '#js-user-preview',
    userLogoutButton: '#js-user-logout',
    accountEntryLink: '#js-account-entry-link'
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
