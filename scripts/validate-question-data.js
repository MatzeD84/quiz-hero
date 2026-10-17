const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const inputArg = args.find(argument => !argument.startsWith('--'));
const categoryArg = args.find(argument => argument.startsWith('--category='));
const allowMissingSource = args.includes('--allow-missing-source');
const noCorpus = args.includes('--no-corpus');
const auditOnly = args.includes('--audit-only');

if (!inputArg) {
    console.error('Aufruf: node scripts/validate-question-data.js <datei.json> [--category=slug] [--allow-missing-source] [--no-corpus] [--audit-only]');
    process.exit(1);
}

const inputPath = path.resolve(rootDir, inputArg);
const fallbackCategory = categoryArg?.slice('--category='.length).trim()
    || path.basename(inputPath).match(/^questions-(.+)\.json$/i)?.[1]
    || '';
const stopWords = new Set([
    'als', 'am', 'an', 'auf', 'aus', 'bei', 'das', 'dass', 'dem', 'den', 'der', 'des', 'die', 'ein', 'eine',
    'einer', 'eines', 'für', 'hat', 'im', 'in', 'ist', 'mit', 'nach', 'oder', 'sich', 'sind', 'unter', 'von',
    'war', 'was', 'welche', 'welcher', 'welches', 'wem', 'wen', 'wer', 'wie', 'wieso', 'wo', 'wurde', 'zu', 'zum'
]);

function readJson(file) {
    return JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
}

function normalize(value) {
    return String(value || '')
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLocaleLowerCase('de')
        .replace(/ß/g, 'ss')
        .replace(/[^a-z0-9]+/g, ' ')
        .trim()
        .replace(/\s+/g, ' ');
}

function tokens(value) {
    return new Set(normalize(value).split(' ').filter(token => token.length > 2 && !stopWords.has(token)));
}

function jaccard(left, right) {
    const intersection = [...left].filter(token => right.has(token)).length;
    const union = new Set([...left, ...right]).size;
    return { score: union ? intersection / union : 0, intersection };
}

function sourceUrl(question) {
    return String(question.sourceUrl || question.meta?.sourceUrl || '').trim();
}

function questionCategory(question, fallback = '') {
    return String(question.categoryId || question.category || fallback).trim();
}

function correctAnswer(question) {
    return Array.isArray(question.answers) && Number.isInteger(question.correct)
        ? normalize(question.answers[question.correct])
        : '';
}

function loadCorpus() {
    const dataDir = path.join(rootDir, 'data');
    return fs.readdirSync(dataDir)
        .filter(file => /^questions-.+\.json$/i.test(file))
        .flatMap(file => {
            const filePath = path.join(dataDir, file);
            if (path.resolve(filePath) === inputPath) return [];
            const category = file.match(/^questions-(.+)\.json$/i)?.[1] || '';
            const data = readJson(filePath);
            return (Array.isArray(data.questions) ? data.questions : []).map((question, index) => ({
                question,
                category: questionCategory(question, category),
                location: `${path.relative(rootDir, filePath)}:${index + 1}`
            }));
        });
}

let data;
let inputHasBom = false;
try {
    const inputRaw = fs.readFileSync(inputPath, 'utf8');
    inputHasBom = inputRaw.startsWith('\uFEFF');
    data = JSON.parse(inputRaw.replace(/^\uFEFF/, ''));
} catch (error) {
    console.error(`JSON konnte nicht gelesen werden: ${error.message}`);
    process.exit(1);
}

const questions = Array.isArray(data?.questions)
    ? data.questions
    : Array.isArray(data?.categories)
        ? data.categories.flatMap(category => (category.questions || []).map(question => ({
            ...question,
            categoryId: question.categoryId || category.id
        })))
        : null;

if (!questions) {
    console.error('Die Datei muss "questions" oder Kategorien mit eingebetteten Fragen enthalten.');
    process.exit(1);
}

const errors = [];
const warnings = [];
const seenQuestions = new Map();
const seenAnswerSets = new Map();
const corpus = noCorpus ? [] : loadCorpus();

if (questions.length === 0) errors.push('Die Datei enthält keine Fragen.');
if (!auditOnly && questions.length > 200) errors.push('Ein Admin-Import darf höchstens 200 Fragen enthalten.');
if (!auditOnly && inputHasBom) errors.push('Die Datei muss als UTF-8 ohne BOM gespeichert sein.');

questions.forEach((question, index) => {
    const label = `Frage ${index + 1}`;
    if (!question || typeof question !== 'object' || Array.isArray(question)) {
        errors.push(`${label}: Eintrag ist kein Objekt.`);
        return;
    }

    const category = questionCategory(question, fallbackCategory);
    const text = typeof question.question === 'string' ? question.question.trim() : '';
    const answers = Array.isArray(question.answers) ? question.answers : [];
    const normalizedAnswers = answers.map(answer => normalize(answer));
    const normalizedQuestion = normalize(text);
    const answerSet = [...normalizedAnswers].sort().join('|');

    if (!auditOnly) {
        if (!category) errors.push(`${label}: categoryId fehlt; alternativ --category angeben.`);
        if (!text) errors.push(`${label}: question fehlt.`);
        if (text.length > 1000) errors.push(`${label}: question ist länger als 1000 Zeichen.`);
        if (answers.length !== 4 || answers.some(answer => typeof answer !== 'string' || !answer.trim())) errors.push(`${label}: answers muss genau vier nicht leere Texte enthalten.`);
        if (answers.some(answer => typeof answer === 'string' && answer.trim().length > 255)) errors.push(`${label}: Eine Antwort ist länger als 255 Zeichen.`);
        if (normalizedAnswers.filter(Boolean).length === 4 && new Set(normalizedAnswers).size !== 4) errors.push(`${label}: Antwortoptionen sind nach Normalisierung doppelt.`);
        if (!Number.isInteger(question.correct) || question.correct < 0 || question.correct > 3) errors.push(`${label}: correct muss eine Ganzzahl zwischen 0 und 3 sein.`);
        if (!['easy', 'medium', 'hero'].includes(question.difficulty)) errors.push(`${label}: difficulty muss easy, medium oder hero sein.`);
        const tags = question.tags ?? question.tag;
        if (!Array.isArray(tags) || tags.length < 1 || tags.some(tag => typeof tag !== 'string' || !tag.trim())) errors.push(`${label}: tags muss ein Array mit mindestens einem nicht leeren Text sein.`);
        else if (tags.length > 5) warnings.push(`${label}: mehr als fünf Tags; redaktionell auf die wichtigsten Begriffe kürzen.`);
        if (!allowMissingSource && !sourceUrl(question)) errors.push(`${label}: sourceUrl fehlt.`);
        if (sourceUrl(question)) {
            if (sourceUrl(question).length > 1000) errors.push(`${label}: sourceUrl ist länger als 1000 Zeichen.`);
            if (/(?:example\.org|\.invalid(?:\/|$)|\bTODO\b|quelle[ -]?folgt)/i.test(sourceUrl(question))) {
                errors.push(`${label}: sourceUrl enthält eine Platzhalterquelle.`);
            }
            try {
                const url = new URL(sourceUrl(question));
                if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error();
            } catch {
                errors.push(`${label}: sourceUrl ist keine gültige HTTP(S)-URL ohne Zugangsdaten.`);
            }
        }
        if (question.reviewed === true) errors.push(`${label}: KI-Ausgaben dürfen nicht als reviewed markiert sein.`);
        if (question.backgroundKnowledge && String(question.backgroundKnowledge).length > 2000) errors.push(`${label}: backgroundKnowledge ist länger als 2000 Zeichen.`);
        if (question.imageAlt && String(question.imageAlt).length > 500) errors.push(`${label}: imageAlt ist länger als 500 Zeichen.`);
        if (question.reviewedBy && String(question.reviewedBy).length > 120) errors.push(`${label}: reviewedBy ist länger als 120 Zeichen.`);
        if (question.reviewedAt && !/^\d{4}-\d{2}-\d{2}$/.test(String(question.reviewedAt))) errors.push(`${label}: reviewedAt muss YYYY-MM-DD entsprechen.`);
        if (question.sortOrder !== undefined && (!Number.isInteger(question.sortOrder) || question.sortOrder < 0 || question.sortOrder > 100000)) errors.push(`${label}: sortOrder muss eine Ganzzahl zwischen 0 und 100000 sein.`);
        if (question.active === true) warnings.push(`${label}: active ist true; neue KI-Fragen sollten bis zur Endkontrolle inaktiv bleiben.`);
        if (question.reviewedBy) warnings.push(`${label}: reviewedBy sollte vor der menschlichen Prüfung leer sein.`);
        if (question.reviewedAt) warnings.push(`${label}: reviewedAt sollte vor der menschlichen Prüfung leer sein.`);
        if (question.imageUrl && !String(question.imageAlt || '').trim()) warnings.push(`${label}: Bildfrage ohne individuellen imageAlt.`);
    }

    if (normalizedQuestion) {
        if (seenQuestions.has(normalizedQuestion)) {
            errors.push(`${label}: exakte Dublette zu Frage ${seenQuestions.get(normalizedQuestion) + 1} in der Importdatei.`);
        } else {
            seenQuestions.set(normalizedQuestion, index);
        }
        const existing = corpus.find(item => normalize(item.question.question) === normalizedQuestion);
        if (existing) errors.push(`${label}: exakte Dublette zu ${existing.location}.`);
    }

    if (answerSet && normalizedAnswers.length === 4) {
        if (seenAnswerSets.has(answerSet)) {
            warnings.push(`${label}: gleiche Antwortmenge wie Frage ${seenAnswerSets.get(answerSet) + 1}; Wissensfakt prüfen.`);
        } else {
            seenAnswerSets.set(answerSet, index);
        }
    }

    const currentCorrect = correctAnswer(question);
    const currentTokens = tokens(text);
    const comparisons = [
        ...questions.slice(0, index).map((entry, previousIndex) => ({ question: entry, location: `Frage ${previousIndex + 1}` })),
        ...corpus
    ];
    for (const comparison of comparisons) {
        if (!currentCorrect || currentCorrect !== correctAnswer(comparison.question)) continue;
        const similarity = jaccard(currentTokens, tokens(comparison.question.question));
        if (similarity.intersection >= 2 && similarity.score >= 0.4 && normalize(comparison.question.question) !== normalizedQuestion) {
            warnings.push(`${label}: mögliche semantische Dublette zu ${comparison.location} (gleiche richtige Antwort, Textähnlichkeit ${Math.round(similarity.score * 100)} %).`);
        }
    }
});

if (!auditOnly) {
    const correctIndices = questions
        .map(question => question.correct)
        .filter(index => Number.isInteger(index) && index >= 0 && index <= 3);
    if (correctIndices.length >= 8) {
        const counts = [0, 0, 0, 0];
        correctIndices.forEach(index => { counts[index] += 1; });
        if (Math.max(...counts) - Math.min(...counts) > 1) {
            errors.push(`Die richtigen Antwortpositionen sind nicht ausgewogen verteilt (${counts.join(', ')}).`);
        }
    }
    let repeatedIndexCount = 1;
    for (let index = 1; index < correctIndices.length; index += 1) {
        repeatedIndexCount = correctIndices[index] === correctIndices[index - 1] ? repeatedIndexCount + 1 : 1;
        if (repeatedIndexCount >= 5) {
            errors.push(`Mindestens fünf aufeinanderfolgende Fragen verwenden correct=${correctIndices[index]}.`);
            break;
        }
    }
}

if (errors.length) {
    console.error(`\n${errors.length} Fehler:`);
    errors.forEach(error => console.error(`- ${error}`));
}
if (warnings.length) {
    console.warn(`\n${warnings.length} Warnungen:`);
    warnings.forEach(warning => console.warn(`- ${warning}`));
}

console.log(`\nGeprüft: ${questions.length} Fragen, ${corpus.length} bestehende Fragen als Vergleichsbestand.`);
console.log(`Ergebnis: ${errors.length} Fehler, ${warnings.length} Warnungen.`);
if (errors.length === 0) console.log('Strukturelle Prüfung bestanden. Warnungen müssen inhaltlich bewertet werden.');

process.exitCode = errors.length ? 1 : 0;
