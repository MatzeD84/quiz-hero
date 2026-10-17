const normalizeQuestionKey = value => String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');

export const importQuestionsFromJson = data => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.questions)) return data.questions;
    throw new Error('JSON muss ein Array oder ein Objekt mit "questions" enthalten.');
};

const normalizeImportTags = value => {
    if (Array.isArray(value)) return value.map(tag => String(tag).trim()).filter(Boolean);
    return String(value || '').split(',').map(tag => tag.trim()).filter(Boolean);
};

export function validateImportQuestions(rawQuestions, { questions, categories }) {
    const existingKeys = new Set(questions.map(question => normalizeQuestionKey(question.question)));
    const knownCategories = new Set(categories.map(category => category.id));
    const seen = new Set();

    return rawQuestions.map((entry, index) => {
        const errors = [];
        const warnings = [];
        if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
            return { index, valid: false, question: '', categoryId: '', errors: ['Eintrag ist kein Objekt.'], warnings: [], data: null };
        }

        const categoryId = String(entry.categoryId || entry.category || '').trim();
        const questionText = String(entry.question || '').trim();
        const answers = Array.isArray(entry.answers) ? entry.answers.map(answer => String(answer).trim()).filter(Boolean) : [];
        const correct = Number(entry.correct ?? 0);
        const difficulty = String(entry.difficulty || 'easy').trim();
        const key = normalizeQuestionKey(questionText);

        if (!categoryId) {
            errors.push('Kategorie fehlt.');
        } else if (!knownCategories.has(categoryId)) {
            warnings.push(`Kategorie "${categoryId}" existiert noch nicht und wird automatisch angelegt.`);
        }
        if (!questionText) errors.push('Fragetext fehlt.');
        if (answers.length !== 4) errors.push('Es muessen genau vier Antworten vorhanden sein.');
        if (!Number.isInteger(correct) || correct < 0 || correct > 3) errors.push('correct muss zwischen 0 und 3 liegen.');
        if (difficulty && !['easy', 'medium', 'hero'].includes(difficulty)) {
            warnings.push(`Unbekannte Schwierigkeit "${difficulty}" wird auf easy gesetzt.`);
        }
        if (key && existingKeys.has(key)) {
            errors.push('Diese Frage existiert bereits.');
        } else if (key && seen.has(key)) {
            errors.push('Diese Frage kommt mehrfach in der Importdatei vor.');
        } else if (key) {
            seen.add(key);
        }

        return {
            index,
            valid: errors.length === 0,
            question: questionText,
            categoryId,
            errors,
            warnings,
            data: {
                categoryId,
                question: questionText,
                answers,
                correct,
                difficulty,
                tags: normalizeImportTags(entry.tags ?? entry.tag),
                imageUrl: String(entry.imageUrl || entry.image || '').trim(),
                backgroundKnowledge: String(entry.backgroundKnowledge || entry.background || '').trim(),
                sourceUrl: String(entry.sourceUrl || entry.meta?.sourceUrl || '').trim(),
                imageAlt: String(entry.imageAlt || '').trim(),
                reviewedBy: String(entry.reviewedBy || '').trim(),
                reviewedAt: String(entry.reviewedAt || '').trim(),
                sortOrder: Number(entry.sortOrder ?? 100),
                active: entry.active !== false,
                reviewed: entry.reviewed === true
            }
        };
    });
}
