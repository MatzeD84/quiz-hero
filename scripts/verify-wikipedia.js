#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const CATEGORIES_PATH = path.join(__dirname, '..', 'categories.json');
const WIKI_API = 'https://de.wikipedia.org/w/api.php';
const CONFIG = {
    verifiedThreshold: 0.7,
    shortAnswerThreshold: 0.8,
    longQuestionThreshold: 0.6,
    introBonus: 0.08,
    titleBonus: 0.07,
    maxScoreWithoutAnswerHit: 0.25,
    requestDelayMs: 1100,
    perQuestionDelayMs: 600,
    retryAfterSeconds: 2,
    maxRetries: 3,
    searchLimit: 3
};

const parseArgs = () => {
    const args = process.argv.slice(2);
    const options = {
        file: '',
        max: null,
        offset: 0,
        fast: false,
        skipVerified: false,
        delayMs: null,
        perQuestionDelayMs: null,
        searchLimit: null
    };

    for (const arg of args) {
        if (arg.startsWith('--')) {
            const [key, raw] = arg.split('=');
            switch (key) {
                case '--fast':
                    options.fast = true;
                    break;
                case '--max':
                    options.max = Number(raw);
                    break;
                case '--delay-ms':
                    options.delayMs = Number(raw);
                    break;
                case '--offset':
                    options.offset = Number(raw);
                    break;
                case '--skip-verified':
                    options.skipVerified = true;
                    break;
                case '--per-question-delay-ms':
                    options.perQuestionDelayMs = Number(raw);
                    break;
                case '--search-limit':
                    options.searchLimit = Number(raw);
                    break;
                default:
                    break;
            }
        } else if (!options.file) {
            options.file = arg;
        }
    }
    return options;
};

const applyRuntimeConfig = options => {
    if (options.fast) {
        CONFIG.requestDelayMs = 250;
        CONFIG.perQuestionDelayMs = 150;
        CONFIG.searchLimit = 2;
    }
    if (Number.isFinite(options.delayMs)) {
        CONFIG.requestDelayMs = Math.max(50, options.delayMs);
    }
    if (Number.isFinite(options.perQuestionDelayMs)) {
        CONFIG.perQuestionDelayMs = Math.max(0, options.perQuestionDelayMs);
    }
    if (Number.isFinite(options.searchLimit)) {
        CONFIG.searchLimit = Math.max(1, options.searchLimit);
    }
};

const STOPWORDS = new Set([
    'der', 'die', 'das', 'ein', 'eine', 'einer', 'eines', 'einem', 'einen',
    'und', 'oder', 'aber', 'den', 'dem', 'des', 'im', 'in', 'am', 'an', 'auf',
    'zu', 'zur', 'zum', 'von', 'mit', 'für', 'fuer', 'als', 'ist', 'sind',
    'war', 'waren', 'wurde', 'wurden', 'welche', 'welcher', 'welches', 'wer',
    'was', 'wo', 'wann', 'wie', 'warum', 'bei', 'unter', 'über', 'ueber'
]);

const STRONG_EXCLUDE = new Set([
    'welche', 'welcher', 'welches', 'welchen', 'wie', 'was', 'wo', 'wer', 'warum', 'wann',
    'dieser', 'diese', 'dieses', 'der', 'die', 'das', 'ein', 'eine', 'einer', 'eines',
    'am', 'im', 'in', 'auf', 'zu'
]);

const STRONG_COMMON = new Set([
    'figur', 'statue', 'brunnen', 'platz', 'strasse', 'strasse', 'bogen', 'tempel',
    'kirche', 'basilika', 'kapelle', 'papst', 'kaiser', 'kuppel', 'denkmal',
    'museum', 'palast', 'brucke', 'hugel', 'fluss', 'tor'
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

const tokenize = value => {
    const normalized = normalize(value);
    if (!normalized) return new Set();
    return new Set(normalized.split(' ').filter(Boolean));
};

const extractStrongKeywords = text => {
    const raw = String(text || '');
    const matches = raw.match(/[A-ZÄÖÜ][A-Za-zÄÖÜäöüß-]{3,}/g) || [];
    const tokens = new Set();
    for (const match of matches) {
        const normalized = normalize(match).replace(/-/g, ' ');
        normalized.split(' ').forEach(token => {
            if (token.length < 4) return;
            if (STRONG_EXCLUDE.has(token)) return;
            tokens.add(token);
        });
    }
    return Array.from(tokens);
};

const readJson = filePath => {
    const raw = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
    return JSON.parse(raw);
};

const buildCategoryMap = () => {
    const map = new Map();
    if (!fs.existsSync(CATEGORIES_PATH)) {
        return map;
    }
    const data = readJson(CATEGORIES_PATH);
    const categories = Array.isArray(data?.categories) ? data.categories : [];
    categories.forEach(category => {
        if (!category || !category.questionsFile) return;
        map.set(path.normalize(category.questionsFile), {
            id: category.id || '',
            title: category.title || ''
        });
    });
    return map;
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

const searchWikipedia = async (query, limit = 1) => {
    const params = new URLSearchParams({
        action: 'query',
        list: 'search',
        srsearch: query,
        srlimit: String(limit),
        format: 'json',
        utf8: '1'
    });
    const data = await fetchJson(`${WIKI_API}?${params.toString()}`);
    const hits = data?.query?.search || [];
    return hits.map(hit => ({ title: hit.title }));
};

const fetchWikipediaPage = async title => {
    const params = new URLSearchParams({
        action: 'query',
        prop: 'extracts|info',
        inprop: 'url',
        explaintext: '1',
        exsectionformat: 'plain',
        redirects: '1',
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

const scoreExtract = ({ extract, question, answer, title, contextTokens = [] }) => {
    const extractNorm = normalize(extract);
    const extractTokens = tokenize(extract);
    const answerNorm = normalize(answer);
    const answerHit = answerNorm && extractNorm.includes(answerNorm);

    const questionKeywords = extractKeywords(question);
    const strongTokens = extractStrongKeywords(question);
    const matched = questionKeywords.filter(token => extractTokens.has(token));
    const questionRatio = questionKeywords.length ? matched.length / questionKeywords.length : 0;

    const answerKeywords = extractKeywords(answer);
    const answerMatched = answerKeywords.filter(token => extractTokens.has(token));
    const answerRatio = answerKeywords.length ? answerMatched.length / answerKeywords.length : 0;

    const intro = extract.split('.').slice(0, 2).join('.').trim();
    const introNorm = normalize(intro);
    const introHit = answerNorm && introNorm.includes(answerNorm);
    const titleNorm = normalize(title || '');
    const titleTokens = tokenize(title || '');
    const titleHit = answerNorm && titleNorm.includes(answerNorm);
    const titleAnswerMatched = answerKeywords.filter(token => titleTokens.has(token));
    const titleAnswerRatio = answerKeywords.length ? titleAnswerMatched.length / answerKeywords.length : 0;
    const titleQuestionMatched = questionKeywords.filter(token => titleTokens.has(token));
    const titleQuestionRatio = questionKeywords.length ? titleQuestionMatched.length / questionKeywords.length : 0;

    const contextMatched = contextTokens.filter(token => extractTokens.has(token));
    const contextRatio = contextTokens.length ? contextMatched.length / contextTokens.length : 0;

    let score = 0;
    score += answerHit ? 0.5 : 0;
    score += Math.min(0.2, answerRatio * 0.2);
    score += Math.min(0.2, questionRatio * 0.2);
    score += Math.min(0.08, titleAnswerRatio * 0.08);
    score += Math.min(0.05, titleQuestionRatio * 0.05);
    score += Math.min(0.08, contextRatio * 0.08);
    if (introHit) score += CONFIG.introBonus;
    if (titleHit) score += CONFIG.titleBonus;

    const hasAnchor = answerHit || titleAnswerRatio > 0 || titleQuestionRatio > 0;
    if (!hasAnchor && questionRatio < 0.2) {
        score = Math.min(score, 0.2);
    }
    const questionPenaltyThreshold = questionKeywords.length >= 4 ? 0.25 : (questionKeywords.length >= 2 ? 0.2 : 0);
    if (questionPenaltyThreshold > 0 && questionRatio < questionPenaltyThreshold) {
        score = Math.min(score, 0.45);
    }
    const anchorTokens = strongTokens.filter(token => !STRONG_COMMON.has(token));
    const strongHit = anchorTokens.some(token => extractTokens.has(token) || titleTokens.has(token));
    if (anchorTokens.length > 0 && !strongHit) {
        score = Math.min(score, 0.4);
    }
    if (contextTokens.length > 0 && contextRatio === 0) {
        score = Math.min(score, 0.45);
    }
    if (!answerHit) score = Math.min(score, CONFIG.maxScoreWithoutAnswerHit);

    return {
        confidence: Math.min(1, score),
        answerHit,
        keywordRatio: questionRatio,
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

const buildContextTerms = ({ categoryTitle, question }) => {
    const terms = new Set();
    if (categoryTitle) terms.add(categoryTitle);
    if (Array.isArray(question.tag)) {
        question.tag.forEach(tag => {
            if (tag) terms.add(String(tag));
        });
    }
    return Array.from(terms).join(' ');
};

const buildContextTokens = categoryTitle => {
    if (!categoryTitle) return [];
    return extractKeywords(categoryTitle);
};

const buildSearchQueries = ({ question, correctAnswer, contextTerms }) => {
    const queries = [];
    const safeAnswer = String(correctAnswer || '').trim();
    const safeQuestion = String(question || '').trim();
    const safeContext = String(contextTerms || '').trim();

    const quote = value => `"${String(value).replace(/"/g, '')}"`;
    if (safeAnswer) {
        queries.push(`intitle:${quote(safeAnswer)} ${safeContext}`.trim());
        queries.push(`${safeAnswer} ${safeContext}`.trim());
        queries.push(`${safeQuestion} ${safeAnswer}`.trim());
    }
    if (safeQuestion && safeContext) {
        queries.push(`${safeQuestion} ${safeContext}`.trim());
    }
    if (safeQuestion) {
        queries.push(safeQuestion);
    }
    if (safeAnswer) {
        queries.push(safeAnswer);
    }

    const seen = new Set();
    return queries.filter(query => {
        if (!query) return false;
        if (seen.has(query)) return false;
        seen.add(query);
        return true;
    });
};

const verifyQuestion = async (question, context) => {
    const correctAnswer = question.answers?.[question.correct] ?? '';
    const contextTerms = buildContextTerms({ categoryTitle: context?.categoryTitle, question });
    const contextTokens = buildContextTokens(context?.categoryTitle);
    const tryQueries = buildSearchQueries({
        question: question.question,
        correctAnswer,
        contextTerms
    });
    let best = { confidence: 0, sourceUrl: '', matchedText: '' };

    for (const query of tryQueries) {
        await delay(CONFIG.requestDelayMs);
        const hits = await searchWikipedia(query, CONFIG.searchLimit);
        if (!hits.length) continue;

        for (const hit of hits) {
            await delay(CONFIG.requestDelayMs);
            const page = await fetchWikipediaPage(hit.title);
            if (!page) continue;

            const score = scoreExtract({
                extract: page.extract,
                question: question.question,
                answer: correctAnswer,
                title: page.title,
                contextTokens
            });

            if (score.confidence > best.confidence) {
                best = {
                    confidence: score.confidence,
                    sourceUrl: page.url,
                    matchedText: pickSnippet(page.extract, correctAnswer)
                };
            }
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

const updateQuestionsFile = async (filePath, context) => {
    const data = readJson(filePath);
    if (!Array.isArray(data.questions)) return;

    const options = parseArgs();
    const maxQuestions = Number.isFinite(options.max) ? options.max : null;
    const offset = Number.isFinite(options.offset) ? Math.max(0, options.offset) : 0;
    const skipVerified = options.skipVerified === true;
    let processed = 0;
    let index = 0;

    for (const question of data.questions) {
        if (index < offset) {
            index += 1;
            continue;
        }
        if (maxQuestions !== null && processed >= maxQuestions) break;
        if (skipVerified && question?.meta?.verificationWiki?.sourceUrlWiki) {
            index += 1;
            continue;
        }
        const verification = await verifyQuestion(question, context);
        question.meta = {
            ...question.meta,
            ...verification.meta
        };
        await delay(CONFIG.perQuestionDelayMs);
        processed += 1;
        index += 1;
    }

    fs.writeFileSync(filePath, JSON.stringify(data, null, 4) + '\n', 'utf8');
};

const resolveInputFiles = () => {
    const options = parseArgs();
    const arg = options.file;
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
    const options = parseArgs();
    applyRuntimeConfig(options);
    const categoryMap = buildCategoryMap();
    const files = resolveInputFiles();
    for (const file of files) {
        console.log(`Verifiziere: ${path.basename(file)}`);
        const relPath = path.normalize(path.relative(path.join(__dirname, '..'), file));
        const category = categoryMap.get(relPath);
        const context = {
            categoryId: category?.id || '',
            categoryTitle: category?.title || ''
        };
        await updateQuestionsFile(file, context);
    }
};

run().catch(error => {
    console.error(error);
    process.exit(1);
});
