import { ALLOWED_DIFFICULTIES } from './config.js';

export const isNonEmptyString = value => typeof value === 'string' && value.trim().length > 0;

const formatCategoryRef = (category, catIndex) => {
    const id = isNonEmptyString(category?.id) ? category.id : `#${catIndex + 1}`;
    const title = isNonEmptyString(category?.title) ? ` ("${category.title}")` : '';
    return `Kategorie ${id}${title}`;
};

const formatQuestionRef = (categoryId, questionIndex, question) => {
    const questionText = isNonEmptyString(question?.question)
        ? ` - "${question.question}"`
        : '';
    return `Frage ${questionIndex + 1} in Kategorie ${categoryId}${questionText}`;
};

const formatTagRef = (tag, index) => {
    const id = isNonEmptyString(tag?.id) ? tag.id : `#${index + 1}`;
    const title = isNonEmptyString(tag?.title) ? ` ("${tag.title}")` : '';
    return `Tag ${id}${title}`;
};

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

        const categoryRef = formatCategoryRef(category, catIndex);

        if (!isNonEmptyString(category.id)) {
            errors.push(`${categoryRef} besitzt keine g\u00fcltige id.`);
        }

        if (!isNonEmptyString(category.title)) {
            errors.push(`${categoryRef} besitzt keinen g\u00fcltigen Titel.`);
        }

        if (category.badge !== undefined) {
            if (!category.badge || typeof category.badge !== 'object') {
                errors.push(`${categoryRef} besitzt ein ung\u00fcltiges badge-Objekt.`);
            } else {
                if ('active' in category.badge && typeof category.badge.active !== 'boolean') {
                    errors.push(`badge.active in ${categoryRef} muss ein boolean sein.`);
                }
                if ('text' in category.badge && category.badge.text !== undefined && !isNonEmptyString(category.badge.text)) {
                    errors.push(`badge.text in ${categoryRef} muss ein nicht-leerer Text sein.`);
                }
            }
        }

        if (!Array.isArray(category.questions)) {
            errors.push(`${categoryRef} besitzt kein Fragen-Array.`);
            return;
        }

        category.questions.forEach((question, questionIndex) => {
            const questionRef = formatQuestionRef(category.id, questionIndex, question);

            if (!question || typeof question !== 'object') {
                errors.push(`${questionRef} ist kein Objekt.`);
                return;
            }

            if (!isNonEmptyString(question.question)) {
                errors.push(`${questionRef} besitzt keinen Fragetext.`);
            }

            if (!Array.isArray(question.answers) || question.answers.length < 2) {
                errors.push(`${questionRef} ben\u00f6tigt mindestens zwei Antworten.`);
            } else {
                question.answers.forEach((answer, answerIndex) => {
                    if (!isNonEmptyString(answer)) {
                        errors.push(`Antwort ${answerIndex + 1} in ${questionRef} ist ung\u00fcltig.`);
                    }
                });
            }

            if (typeof question.correct !== 'number' || Number.isNaN(question.correct)) {
                errors.push(`${questionRef} besitzt keinen g\u00fcltigen "correct"-Index.`);
            } else if (
                !Array.isArray(question.answers) ||
                question.correct < 0 ||
                question.correct >= question.answers.length
            ) {
                errors.push(`"correct" in ${questionRef} liegt au\u00dferhalb des Antwortbereichs.`);
            }

            if (question.tag && !Array.isArray(question.tag)) {
                errors.push(`${questionRef} besitzt ein ung\u00fcltiges tag-Feld.`);
            } else if (Array.isArray(question.tag)) {
                question.tag.forEach((tagValue, tagIndex) => {
                    if (!isNonEmptyString(tagValue)) {
                        errors.push(`Tag ${tagIndex + 1} in ${questionRef} ist ung\u00fcltig.`);
                    }
                });
            }

            if (question.difficulty && !ALLOWED_DIFFICULTIES.has(question.difficulty)) {
                errors.push(`${questionRef} besitzt eine unbekannte difficulty (${question.difficulty}).`);
            }

            if (question.type === 'image' && !isNonEmptyString(question.imageUrl)) {
                errors.push(`${questionRef} ist eine Bildfrage und ben\u00f6tigt ein g\u00fcltiges imageUrl.`);
            }
            if (question.backgroundKnowledge !== undefined && typeof question.backgroundKnowledge !== 'string') {
                errors.push(`backgroundKnowledge in ${questionRef} muss ein string sein.`);
            }

            if (question.type && !isNonEmptyString(question.type)) {
                errors.push(`type in ${questionRef} muss ein nicht-leerer string sein.`);
            }

            if (question.meta !== undefined && (!question.meta || typeof question.meta !== 'object')) {
                errors.push(`meta in ${questionRef} muss ein Objekt sein.`);
            } else if (question.meta && typeof question.meta === 'object') {
                const meta = question.meta;
                if ('sourceUrl' in meta && typeof meta.sourceUrl !== 'string') {
                    errors.push(`meta.sourceUrl in ${questionRef} muss ein string sein.`);
                }
                if ('generatedAt' in meta && typeof meta.generatedAt !== 'string') {
                    errors.push(`meta.generatedAt in ${questionRef} muss ein string sein.`);
                }
                if ('verifiedGPT' in meta && typeof meta.verifiedGPT !== 'boolean') {
                    errors.push(`meta.verifiedGPT in ${questionRef} muss ein boolean sein.`);
                }
                if ('knowledgeConfidence' in meta && typeof meta.knowledgeConfidence !== 'number') {
                    errors.push(`meta.knowledgeConfidence in ${questionRef} muss eine number sein.`);
                }
                if ('verifiedFinal' in meta && typeof meta.verifiedFinal !== 'boolean') {
                    errors.push(`meta.verifiedFinal in ${questionRef} muss ein boolean sein.`);
                }
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
            errors.push(`Feedback-Schl\u00fcssel "${key}" fehlt oder ist leer.`);
            return;
        }
        feedback[key].forEach((entry, index) => {
            if (typeof entry !== 'string' || !entry.trim()) {
                errors.push(`Feedback-Eintrag ${index + 1} in "${key}" ist kein g\u00fcltiger Text.`);
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
        const tagRef = formatTagRef(tag, index);
        if (!isNonEmptyString(tag.id)) {
            errors.push(`${tagRef} besitzt keine g\u00fcltige id.`);
        }
        if (!isNonEmptyString(tag.title)) {
            errors.push(`${tagRef} besitzt keinen g\u00fcltigen Titel.`);
        }

        if (tag.badge !== undefined) {
            if (!tag.badge || typeof tag.badge !== 'object') {
                errors.push(`${tagRef} besitzt ein ung\u00fcltiges badge-Objekt.`);
            } else {
                if ('active' in tag.badge && typeof tag.badge.active !== 'boolean') {
                    errors.push(`badge.active in ${tagRef} muss ein boolean sein.`);
                }
                if ('text' in tag.badge && tag.badge.text !== undefined && !isNonEmptyString(tag.badge.text)) {
                    errors.push(`badge.text in ${tagRef} muss ein nicht-leerer Text sein.`);
                }
            }
        }
    });

    return errors;
}
