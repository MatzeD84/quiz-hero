#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const WIKI_API = 'https://de.wikipedia.org/w/api.php';
const CONFIG = {
    verifiedThreshold: 0.6,
    shortAnswerThreshold: 0.75,
    longQuestionThreshold: 0.55,
    introBonus: 0.08,
    titleBonus: 0.1,
    maxScoreWithoutAnswerHit: 0.4,
    requestDelayMs: 1100,
    perQuestionDelayMs: 600,
    retryAfterSeconds: 2,
    maxRetries: 3
};

const STOPWORDS = new Set([
    'der', 'die', 'das', 'ein', 'eine', 'einer', 'eines', 'einem', 'einen',
    'und', 'oder', 'aber', 'den', 'dem', 'des', 'im', 'in', 'am', 'an', 'auf',
    'zu', 'zur', 'zum', 'von', 'mit', 'für', 'fuer', 'als', 'ist', 'sind',
    'war', 'waren', 'wurde', 'wurden', 'welche', 'welcher', 'welches', 'wer',
    'was', 'wo', 'wann', 'wie', 'warum', 'bei', 'unter', 'über', 'ueber'
]);

const normalize = value => {
    return String(value || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
};

const extractKeywords = text => {
    return normalize(text)
        .split(' ')
        .filter(token => token.length > 2 && !STOPWORDS.has(token));
};

const pickSnippet = (text, match) => {
    if (!text) return '';
    const clean = text.replace(/\s+/g, ' ').trim();
    if (!match) {
        return clean.slice(0, 240);
    }
    const idx = clean.toLowerCase().indexOf(match.toLowerCase());
    if (idx === -1) return clean.slice(0, 240);
    const start = Math.max(0, idx - 80);
    const end = Math.min(clean.length, idx + 160);
    return clean.slice(start, end);
};

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const fetchJson = async (url, { retries = CONFIG.maxRetries } = {}) => {
    const response = await fetch(url, {
        headers: { 'User-Agent': 'Quiz-Hero/1.0 (verification script)' }
    });
    if (!response.ok) {
        if (response.status === 429 && retries > 0) {
            const retryAfter = Number(response.headers.get('retry-after')) || CONFIG.retryAfterSeconds;
            await delay(retryAfter * 1000);
            return fetchJson(url, { retries: retries - 1 });
        }
        throw new Error(`Request failed: ${response.status}`);
    }
    return response.json();
};

const searchWikipedia = async query => {
    const params = new URLSearchParams({
        action: 'query',
        list: 'search',
        srsearch: query,
        srlimit: '1',
        format: 'json',
        utf8: '1'
    });
    const data = await fetchJson(`${WIKI_API}?${params.toString()}`);
    const hit = data?.query?.search?.[0];
    if (!hit) return null;
    return { title: hit.title };
};

const fetchWikipediaPage = async title => {
    const params = new URLSearchParams({
        action: 'query',
        prop: 'extracts|info',
        inprop: 'url',
        explaintext: '1',
        exsectionformat: 'plain',
        titles: title,
        format: 'json',
        utf8: '1'
    });
    const data = await fetchJson(`${WIKI_API}?${params.toString()}`);
    const pages = data?.query?.pages || {};
    const page = Object.values(pages)[0];
    if (!page || page.missing) return null;
    return {
        title: page.title,
        extract: page.extract || '',
        url: page.fullurl || ''
    };
};

const scoreExtract = ({ extract, question, answer, title }) => {
    const extractNorm = normalize(extract);
    const answerNorm = normalize(answer);
    const answerHit = answerNorm && extractNorm.includes(answerNorm);

    const keywords = extractKeywords(question);
    const matched = keywords.filter(token => extractNorm.includes(token));
    const ratio = keywords.length ? matched.length / keywords.length : 0;

    const intro = extract.split('.').slice(0, 2).join('.').trim();
    const introNorm = normalize(intro);
    const introHit = answerNorm && introNorm.includes(answerNorm);
    const titleNorm = normalize(title || '');
    const titleHit = answerNorm && titleNorm.includes(answerNorm);

    let score = (answerHit ? 0.6 : 0) + Math.min(0.4, ratio * 0.4);
    if (introHit) score += CONFIG.introBonus;
    if (titleHit) score += CONFIG.titleBonus;
    if (!answerHit) score = Math.min(score, CONFIG.maxScoreWithoutAnswerHit);

    return {
        confidence: Math.min(1, score),
        answerHit,
        keywordRatio: ratio,
        introHit,
        titleHit
    };
};

const getThreshold = ({ question, answer }) => {
    let threshold = CONFIG.verifiedThreshold;
    const answerTokens = extractKeywords(answer);
    if (answerTokens.length <= 1 || answer.length <= 4) {
        threshold = Math.max(threshold, CONFIG.shortAnswerThreshold);
    }
    if (question.length >= 120) {
        threshold = Math.min(threshold, CONFIG.longQuestionThreshold);
    }
    return threshold;
};

const verifyQuestion = async question => {
    const correctAnswer = question.answers?.[question.correct] ?? '';
    const assertion = `${question.question} ${correctAnswer}`.trim();

    const tryQueries = [assertion, question.question].filter(Boolean);
    let best = { confidence: 0, sourceUrl: '', matchedText: '' };

    for (const query of tryQueries) {
        await delay(CONFIG.requestDelayMs);
        const hit = await searchWikipedia(query);
        if (!hit) continue;

        await delay(CONFIG.requestDelayMs);
        const page = await fetchWikipediaPage(hit.title);
        if (!page) continue;

        const score = scoreExtract({
            extract: page.extract,
            question: question.question,
            answer: correctAnswer,
            title: page.title
        });

        if (score.confidence > best.confidence) {
            best = {
                confidence: score.confidence,
                sourceUrl: page.url,
                matchedText: pickSnippet(page.extract, correctAnswer)
            };
        }
    }

    const threshold = getThreshold({ question: question.question, answer: correctAnswer });
    const verified = best.confidence >= threshold;

    return {
        meta: {
            verificationWiki: {
                sourceUrlWiki: best.sourceUrl,
                confidence: Number(best.confidence.toFixed(3)),
                matchedText: best.matchedText,
                verified
            }
        }
    };
};

const updateQuestionsFile = async filePath => {
    const raw = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
    const data = JSON.parse(raw);
    if (!Array.isArray(data.questions)) return;

    for (const question of data.questions) {
        const verification = await verifyQuestion(question);
        question.meta = {
            ...question.meta,
            ...verification.meta
        };
        await delay(CONFIG.perQuestionDelayMs);
    }

    fs.writeFileSync(filePath, JSON.stringify(data, null, 4) + '\n', 'utf8');
};

const resolveInputFiles = () => {
    const arg = process.argv[2];
    if (!arg) {
        return fs.readdirSync(DATA_DIR)
            .filter(name => name.startsWith('questions-') && name.endsWith('.json'))
            .map(name => path.join(DATA_DIR, name));
    }

    const fullPath = path.isAbsolute(arg) ? arg : path.join(process.cwd(), arg);
    if (!fs.existsSync(fullPath)) {
        throw new Error(`Datei nicht gefunden: ${arg}`);
    }
    return [fullPath];
};

const run = async () => {
    const files = resolveInputFiles();
    for (const file of files) {
        console.log(`Verifiziere: ${path.basename(file)}`);
        await updateQuestionsFile(file);
    }
};

run().catch(error => {
    console.error(error);
    process.exit(1);
});
