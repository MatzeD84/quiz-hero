import { ALLOWED_DIFFICULTIES } from './config.js';

export const isNonEmptyString = value => typeof value === 'string' && value.trim().length > 0;

export function validateCategories(categories) {
    const errors = [];

    if (!Array.isArray(categories)) {
        errors.push('categories muss ein Array sein.');
        return errors;
    }

    categories.forEach((category, catIndex) => {
        if (!category || typeof category !== 'object') {
            errors.push(`Kategorie #${catIndex + 1} ist kein Objekt.`);
            return;
        }

        if (!isNonEmptyString(category.id)) {
            errors.push(`Kategorie #${catIndex + 1} besitzt keine gültige id.`);
        }

        if (!isNonEmptyString(category.title)) {
            errors.push(`Kategorie ${category.id || `#${catIndex + 1}`} besitzt keinen gültigen Titel.`);
        }

        if (category.badge !== undefined) {
            if (!category.badge || typeof category.badge !== 'object') {
                errors.push(`Kategorie ${category.id || `#${catIndex + 1}`} besitzt ein ungültiges badge-Objekt.`);
            } else {
                if ('active' in category.badge && typeof category.badge.active !== 'boolean') {
                    errors.push(`badge.active in Kategorie ${category.id || `#${catIndex + 1}`} muss ein boolean sein.`);
                }
                if ('text' in category.badge && category.badge.text !== undefined && !isNonEmptyString(category.badge.text)) {
                    errors.push(`badge.text in Kategorie ${category.id || `#${catIndex + 1}`} muss ein nicht-leerer Text sein.`);
                }
            }
        }

        if (!Array.isArray(category.questions)) {
            errors.push(`Kategorie ${category.id || `#${catIndex + 1}`} besitzt kein Fragen-Array.`);
            return;
        }

        category.questions.forEach((question, questionIndex) => {
            if (!question || typeof question !== 'object') {
                errors.push(`Frage ${questionIndex + 1} in Kategorie ${category.id} ist kein Objekt.`);
                return;
            }

            if (!isNonEmptyString(question.question)) {
                errors.push(`Frage ${questionIndex + 1} in Kategorie ${category.id} besitzt keinen Fragetext.`);
            }

            if (!Array.isArray(question.answers) || question.answers.length < 2) {
                errors.push(`Frage ${questionIndex + 1} in Kategorie ${category.id} benötigt mindestens zwei Antworten.`);
            } else {
                question.answers.forEach((answer, answerIndex) => {
                    if (!isNonEmptyString(answer)) {
                        errors.push(`Antwort ${answerIndex + 1} in Frage ${questionIndex + 1} von Kategorie ${category.id} ist ungültig.`);
                    }
                });
            }

            if (typeof question.correct !== 'number' || Number.isNaN(question.correct)) {
                errors.push(`Frage ${questionIndex + 1} in Kategorie ${category.id} besitzt keinen gültigen "correct"-Index.`);
            } else if (
                !Array.isArray(question.answers) ||
                question.correct < 0 ||
                question.correct >= question.answers.length
            ) {
                errors.push(`"correct" in Frage ${questionIndex + 1} von Kategorie ${category.id} liegt außerhalb des Antwortbereichs.`);
            }

            if (question.tag && !Array.isArray(question.tag)) {
                errors.push(`Frage ${questionIndex + 1} in Kategorie ${category.id} besitzt ein ungültiges tag-Feld.`);
            } else if (Array.isArray(question.tag)) {
                question.tag.forEach((tagValue, tagIndex) => {
                    if (!isNonEmptyString(tagValue)) {
                        errors.push(`Tag ${tagIndex + 1} in Frage ${questionIndex + 1} von Kategorie ${category.id} ist ungültig.`);
                    }
                });
            }

            if (question.difficulty && !ALLOWED_DIFFICULTIES.has(question.difficulty)) {
                errors.push(`Frage ${questionIndex + 1} in Kategorie ${category.id} besitzt eine unbekannte difficulty (${question.difficulty}).`);
            }

            if (question.type === 'image' && !isNonEmptyString(question.imageUrl)) {
                errors.push(`Bildfrage ${questionIndex + 1} in Kategorie ${category.id} benötigt ein gültiges imageUrl.`);
            }
        });
    });

    return errors;
}

export function validateFeedback(feedback) {
    const requiredKeys = [
        'correctFirstTry',
        'correctSecondTry',
        'incorrectFirstTry',
        'incorrectSecondTry',
        'difficultCorrectFirstTry'
    ];
    const errors = [];

    if (!feedback || typeof feedback !== 'object') {
        return ['feedback.json ist kein Objekt.'];
    }

    requiredKeys.forEach(key => {
        if (!Array.isArray(feedback[key]) || feedback[key].length === 0) {
            errors.push(`Feedback-Schlüssel "${key}" fehlt oder ist leer.`);
            return;
        }
        feedback[key].forEach((entry, index) => {
            if (typeof entry !== 'string' || !entry.trim()) {
                errors.push(`Eintrag ${index + 1} in "${key}" ist kein gültiger Text.`);
            }
        });
    });

    return errors;
}

export function validateTags(tags) {
    const errors = [];

    if (!Array.isArray(tags)) {
        return ['tags.json ist kein Array.'];
    }

    tags.forEach((tag, index) => {
        if (!tag || typeof tag !== 'object') {
            errors.push(`Tag #${index + 1} ist kein Objekt.`);
            return;
        }
        if (!isNonEmptyString(tag.id)) {
            errors.push(`Tag #${index + 1} besitzt keine gültige id.`);
        }
        if (!isNonEmptyString(tag.title)) {
            errors.push(`Tag ${tag.id || `#${index + 1}`} besitzt keinen gültigen Titel.`);
        }
    });

    return errors;
}
