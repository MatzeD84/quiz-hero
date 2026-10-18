import { accountMenuLinks } from '../public/js/account-menu.js';
import { buildPassportModel, selectionUrl, passportDate, difficultySuccessCards } from '../public/js/passport.js';
import { createQuizInvitation, readQuizInvitation, shareQuizInvitation } from '../public/js/quiz-invitation.js';
import { QuizController } from '../public/js/quiz-controller.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { validateCategories, validateTags } from '../public/js/validators.js';
import { QuizDataService } from '../public/js/quiz-data-service.js';
import { UserService, SESSION_EXPIRED_MESSAGE } from '../public/js/user-service.js';
import { createRequire } from 'node:module';
import { createFormGuard } from '../public/js/form-guard.js';
import { QuizState } from '../public/js/quiz-state.js';
import { revealStatus } from '../public/js/status-navigation.js';
import { createResultShare, supportsResultShare, shareResult } from '../public/js/result-share.js';

test('image result metadata excludes account data and rejects impossible results', () => {
    const payload = createResultShare({ score: 8, maxScore: 10, total: 5, solved: 4, label: '  Rom  ', email: 'private@example.test', roundId: 'secret' });
    assert.deepEqual(payload, { score: 8, maxScore: 10, total: 5, solved: 4, label: 'Rom' });
    assert.throws(() => createResultShare({ score: 11, maxScore: 10, total: 5 }));
    assert.throws(() => createResultShare({ score: 1, maxScore: 10, total: 5, solved: 6 }));
    assert.equal(createResultShare({ score: 0, maxScore: 0, total: 1 }).score, 0);
    const result = { score: 8, maxScore: 10, total: 5, label: 'Rom' };
    assert.equal(createResultShare({ ...result, image: 'images/website/kategorie/kategorie-rom-2.png' }).image, 'images/website/kategorie/kategorie-rom-2.png');
    for (const image of ['https://external.test/avatar.png', 'javascript:alert(1)', 'images/../private/config.php']) {
        assert.equal(createResultShare({ ...result, image }).image, undefined);
    }
});

test('image sharing requires file support and handles cancellation and failure', async () => {
    const file = new File(['png'], 'result.png', { type: 'image/png' });
    assert.equal(supportsResultShare(file, {}), false);
    assert.equal(supportsResultShare(file, { share() {} }), false);
    assert.equal(supportsResultShare(file, { share() {}, canShare() { throw Error('blocked'); } }), false);
    assert.equal(await shareResult(file, {}), 'unavailable');
    const browser = { canShare: data => data.files[0] === file, share: async () => { throw { name: 'AbortError' }; } };
    assert.equal(await shareResult(file, browser), 'cancelled');
    browser.share = async () => { throw Error('denied'); };
    assert.equal(await shareResult(file, browser), 'failed');
    let received;
    browser.share = async data => { received = data; };
    assert.equal(await shareResult(file, browser), 'opened');
    assert.deepEqual(received.files, [file]);
    assert.equal(received.url, undefined);
    const invitation = createQuizInvitation({ categoryId: 'rom', total: 5 });
    assert.equal(await shareResult(file, browser, invitation), 'opened');
    assert.deepEqual(received, { files: [file] });
});

test('status feedback scrolls into view and respects reduced motion', () => {
    const previousWindow = globalThis.window;
    let scrollOptions;
    globalThis.window = {
        matchMedia: () => ({ matches: true }),
        requestAnimationFrame: callback => callback()
    };
    try {
        revealStatus({ textContent: 'Gespeichert', scrollIntoView: options => { scrollOptions = options; } });
        assert.deepEqual(scrollOptions, { behavior: 'auto', block: 'start' });
        scrollOptions = undefined;
        revealStatus({ textContent: '   ', scrollIntoView: options => { scrollOptions = options; } });
        assert.equal(scrollOptions, undefined);
    } finally {
        if (previousWindow === undefined) delete globalThis.window;
        else globalThis.window = previousWindow;
    }
});

test('CSS class selectors follow the project BEM convention', () => {
    const { findBemViolations } = createRequire(import.meta.url)('../scripts/check-bem.js');
    assert.deepEqual(findBemViolations(), []);
});

test('form guard retains edits on cancel, restores on discard and guards unload', () => {
    const previous = globalThis.window;
    let unload, accept = false;
    globalThis.window = { addEventListener: (_, callback) => unload = callback, confirm: () => accept };
    try {
        const field = { id: 'question', value: 'original', checked: false };
        const form = { elements: [field], addEventListener() {} };
        const status = {};
        const guard = createFormGuard([form], status);
        field.value = 'changed';
        assert.equal(guard.confirm(), false); assert.equal(field.value, 'changed');
        let prevented = false; unload({ preventDefault() { prevented = true; } }); assert.equal(prevented, true);
        accept = true; assert.equal(guard.confirm(), true); assert.equal(field.value, 'original');
        field.value = 'saved'; guard.clean(form); assert.equal(guard.refresh(), false);
    } finally { globalThis.window = previous; }
});

test('a solved question cannot award points twice', () => {
    const state = new QuizState(); state.currentSequence = [{ correct: 0 }];
    assert.equal(state.registerAttempt(true, 'easy'), 2);
    assert.equal(state.registerAttempt(true, 'easy'), 0);
    assert.equal(state.score, 2); assert.equal(state.attempts, 1);
});

test('score feedback reports zero for a wrong answer and one point for a correct second try', () => {
    const state = new QuizState(); state.currentSequence = [{ correct: 0 }];
    assert.equal(state.registerAttempt(false, 'hero'), 0);
    assert.equal(state.registerAttempt(true, 'hero'), 1);
    assert.equal(state.score, 1);
});

const question = { question: 'Which?', answers: ['A', 'B', 'C', 'D'], correct: 0, active: true };
const category = { id: 'sample', title: 'Sample', enabled: true, badge: { active: false, text: '' }, questions: [question] };

test('SEO content includes image context, stable citations and escaped editorial fields', () => {
    const { buildCategoryPage } = createRequire(import.meta.url)('../scripts/build-seo-pages.js');
    const html = buildCategoryPage({ category: { ...category, questions: [{ ...question, id: 42, imageUrl: '/images/sample.png', imageAlt: 'An illustration', sourceUrl: 'https://example.test/source', reviewedBy: '<script>alert(1)</script>', reviewedAt: '2026-01-01' }] }, questionCount: 1, relatedCategories: [], seoDescription: 'Test' });
    assert.match(html, /Sample-Quiz: 1 Fragen und Antworten/);
    assert.match(html, /id="frage-42"/);
    assert.match(html, /src="\/images\/sample.png"/);
    assert.match(html, /alt="An illustration" width="1536" height="1024"/);
    assert.match(html, /href="https:\/\/example.test\/source"/);
    assert.ok(!html.includes('<script>alert(1)</script>'));
    const fallback = buildCategoryPage({ category: { ...category, questions: [{ ...question, id: 43, imageUrl: '/images/sample.png' }] }, questionCount: 1, relatedCategories: [], seoDescription: 'Test' });
    assert.match(fallback, /alt="Abbildung zur Frage: Which\?" width="1536" height="1024"/);
});

test('deployment enforces hashed scripts and rejects inline styles', () => {
    const { applyCspHashes } = createRequire(import.meta.url)('../scripts/apply-csp-hashes.js');
    const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'quiz-hero-csp-test-'));
    try {
        fs.writeFileSync(path.join(temp, '.htaccess'), `Header always set Content-Security-Policy "base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'"\nHeader always set Content-Security-Policy-Report-Only "default-src 'self'; script-src 'self' https://www.googletagmanager.com; style-src 'self'; object-src 'none'"\n# Inline script hashes are added to the deploy copy by scripts/apply-csp-hashes.js.\n`);
        fs.writeFileSync(path.join(temp, 'index.html'), '<p style="color: red">Blocked</p><script>{"ok":true}</script>');
        assert.throws(() => applyCspHashes(temp), /Inline-Styles/);
        fs.writeFileSync(path.join(temp, 'index.html'), '<script type="application/ld+json">{"@type":"FAQPage"}</script><script src="/external.js"></script>');
        const hashes = applyCspHashes(temp);
        const config = fs.readFileSync(path.join(temp, '.htaccess'), 'utf8');
        assert.equal(hashes.length, 1);
        assert.ok(config.includes(hashes[0]));
        assert.ok(!config.includes("'unsafe-inline'"));
        assert.ok(!config.includes('Content-Security-Policy-Report-Only'));
        assert.equal((config.match(/Header always set Content-Security-Policy /g) || []).length, 1);
        assert.throws(() => applyCspHashes(temp), /bereits Inline-Hashes/);
    } finally {
        fs.rmSync(temp, { recursive: true, force: true });
    }
});

test('data contracts accept inactive empty badges, reject fractional indices and answer counts', () => {
    assert.deepEqual(validateCategories([category]), []);
    assert.deepEqual(validateTags([{ id: 'Antike', title: 'Antike', badge: { active: false, text: '' } }]), []);
    for (const changed of [{ correct: 0.5 }, { answers: ['A', 'B'] }]) {
        assert.ok(validateCategories([{ ...category, questions: [{ ...question, ...changed }] }]).length);
    }
    assert.ok(validateCategories([{ ...category, badge: { active: true, text: '' } }]).length);
});

test('configured API failures never silently read repository fallback data', async () => {
    let calls = 0;
    const service = new QuizDataService({ apiUrl: '/api', fetchFn: async () => { calls++; return { ok: false, status: 503 }; } });
    await assert.rejects(service.loadAll(), /503/);
    assert.equal(calls, 1);
});

test('revoked sessions clear browser login and logout failures retain the retryable session', async () => {
    let removed = 0;
    globalThis.window = { localStorage: { removeItem: () => removed++ }, sessionStorage: { getItem: () => '', removeItem() {}, setItem() {} } };
    const service = new UserService({ fetchFn: async () => ({ ok: false, status: 401, text: async () => JSON.stringify({ ok: false, code: 'SESSION_EXPIRED' }) }) });
    await assert.rejects(service.getCurrentUser({ id: 1 }), { message: SESSION_EXPIRED_MESSAGE });
    assert.equal(removed, 1);
    const offline = new UserService({ fetchFn: async () => { throw new Error('offline'); } });
    await assert.rejects(offline.logout({ id: 1 }), /offline/);
    assert.equal(removed, 1);
    delete globalThis.window;
});

test('user auth keeps credentials in cookies and sends CSRF only for protected writes', async () => {
    const stored = new Map();
    const calls = [];
    globalThis.window = {
        localStorage: { getItem: key => stored.get(key) || null, setItem: (key, value) => stored.set(key, value), removeItem: key => stored.delete(key) },
        sessionStorage: { getItem: key => stored.get(key) || null, setItem: (key, value) => stored.set(key, value), removeItem: key => stored.delete(key) }
    };
    const fetchFn = async (url, options) => {
        calls.push({ url, options });
        return { ok: true, status: 200, text: async () => JSON.stringify(calls.length === 1
            ? { ok: true, csrfToken: 'csrf-test', user: { id: 7, username: 'hero', token: 'must-not-persist' } }
            : { ok: true }) };
    };
    try {
        const service = new UserService({ fetchFn });
        const user = await service.login({ identifier: 'hero', password: 'secret' });
        await service.saveResult(user, { score: 2, maxScore: 2, solved: 1, total: 1 }, {});
        assert.equal(user.token, undefined);
        assert.ok(!stored.get('quizHeroUser').includes('must-not-persist'));
        assert.equal(calls[0].options.credentials, 'same-origin');
        assert.equal(calls[0].options.headers['X-Quiz-Hero-CSRF'], undefined);
        assert.equal(calls[1].options.headers['X-Quiz-Hero-CSRF'], 'csrf-test');
        assert.deepEqual(JSON.parse(calls[1].options.body), { score: 2, maxScore: 2, solved: 1, total: 1, categoryId: '', tagId: '' });
    } finally { delete globalThis.window; }
});

function build(env) {
    return new Promise(resolve => {
        const child = spawn(process.execPath, ['scripts/build-seo-pages.js'], { cwd: path.resolve(import.meta.dirname, '..'), env: { ...process.env, ...env } });
        let output = '';
        child.stdout.on('data', chunk => output += chunk);
        child.stderr.on('data', chunk => output += chunk);
        child.on('close', code => resolve({ code, output }));
    });
}

test('SEO export fails closed, excludes inactive questions, removes stale generated pages, protects good output', async () => {
    const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'quiz-hero-seo-test-'));
    const fileTransport = process.env.QUIZ_HERO_TEST_EXPORT_FILE === 'true';
    const exportFile = path.join(temp, 'fixture-export.json');
    let status = 200;
    let payload = { ok: true, categories: [{ ...category, questions: [question, { ...question, question: 'Unpublished', active: false }] }] };
    const server = http.createServer((req, res) => {
        assert.equal(req.headers['x-quiz-hero-seo-token'], 'fixture-only');
        res.writeHead(status, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(payload));
    });
    if (!fileTransport) await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const env = { SITE_URL: 'https://example.test', SEO_SOURCE: 'export', SEO_EXPORT_URL: fileTransport ? '' : `http://127.0.0.1:${server.address().port}/export`, SEO_EXPORT_TOKEN: 'fixture-only', SEO_OUTPUT_DIR: temp, SEO_EXPORT_FILE: fileTransport ? exportFile : '' };
    const runBuild = async (overrides = {}) => {
        if (fileTransport) fs.writeFileSync(exportFile, JSON.stringify(status === 200 ? payload : { ok: false }));
        return build({ ...env, ...overrides });
    };
    try {
        let result = await runBuild();
        assert.equal(result.code, 0, result.output);
        const file = path.join(temp, 'kategorie/sample.html');
        const good = fs.readFileSync(file, 'utf8');
        assert.equal((good.match(/<details\b/g) || []).length, 1);
        assert.ok(!good.includes('Unpublished'));
        fs.writeFileSync(path.join(temp, 'kategorie/removed.html'), 'old generated page');
        const manifestPath = path.join(temp, 'seo-manifest.json');
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        manifest.pages.push({ file: 'removed.html', count: 1 });
        fs.writeFileSync(manifestPath, JSON.stringify(manifest));
        result = await runBuild();
        assert.equal(result.code, 0, result.output);
        assert.ok(!fs.existsSync(path.join(temp, 'kategorie/removed.html')));
        status = 503;
        assert.notEqual((await runBuild()).code, 0);
        assert.equal(fs.readFileSync(file, 'utf8'), good);
        status = 200;
        payload = { ok: true, categories: [] };
        assert.notEqual((await runBuild()).code, 0);
        payload = { ok: true, categories: [{ ...category, id: '../escape' }] };
        assert.notEqual((await runBuild()).code, 0);
        assert.equal(fs.readFileSync(file, 'utf8'), good);
        assert.notEqual((await runBuild(fileTransport ? { SEO_EXPORT_FILE: path.join(temp, 'missing-export.json') } : { SEO_EXPORT_TOKEN: '' })).code, 0);
    } finally {
        if (!fileTransport) await new Promise(resolve => server.close(resolve));
        fs.rmSync(temp, { recursive: true, force: true });
    }
});

test('question counts and unfinished navigation cannot corrupt a round', () => {
    const state = new QuizState();
    for (const value of [-2, '5abc', 0, 1.5, '', null]) assert.throws(() => state.applyCountLimit([1, 2, 3], value));
    assert.deepEqual(state.applyCountLimit([1, 2], '5'), [1, 2]);
    state.currentSequence = [{ correct: 0 }, { correct: 1 }];
    state.nextQuestion();
    assert.equal(state.currentIndex, 0);
    state.registerAttempt(false, 'easy');
    state.registerAttempt(false, 'easy');
    state.nextQuestion();
    assert.equal(state.currentIndex, 1);
});

test('blocked optional storage retains the in-memory profile and cookie session lookup', async () => {
    const previousWindow = globalThis.window;
    globalThis.window = { localStorage: { getItem() { throw Error('blocked'); }, setItem() { throw Error('blocked'); }, removeItem() { throw Error('blocked'); } }, sessionStorage: { getItem() { throw Error('blocked'); }, setItem() { throw Error('blocked'); }, removeItem() { throw Error('blocked'); } } };
    try {
        let calls = 0;
        const user = { id: 42, username: 'hero' };
        const service = new UserService({ fetchFn: async () => { calls++; return { ok: true, text: async () => JSON.stringify({ ok: true, user }) }; } });
        assert.equal((await service.getCurrentUser(null)).id, 42);
        assert.equal(calls, 1);
        assert.equal(service.getStoredUser().id, 42);
        service.clearUser();
        assert.equal(service.getStoredUser(), null);
    } finally { globalThis.window = previousWindow; }
});

test('admin import validation remains independent of DOM and flags duplicate questions', async () => {
    const { validateImportQuestions } = await import('../public/js/admin/import-validation.js');
    const entry = { categoryId: 'rom', question: 'Existing?', answers: ['A','B','C','D'], correct: 0 };
    const result = validateImportQuestions([entry], { questions: [{question:'Existing?'}], categories:[{id:'rom'}] });
    assert.equal(result[0].valid, false);
    assert.ok(result[0].errors.some(error => error.includes('bereits')));
});


test('CSS design values use central tokens with no unresolved references or cycles', () => {
    const { findCssTokenViolations } = createRequire(import.meta.url)('../scripts/check-css-tokens.js');
    assert.deepEqual(findCssTokenViolations(), []);
    const definitions = path.resolve('styles/abstracts/tokens.css');
    const component = path.resolve('styles/components/example.css');
    const fixtures = new Map([
        [definitions, ':root { --color-white: #fff; --a: var(--b); --b: var(--a); }'],
        [component, '.example { color: #fff; padding: 8px; border-radius: 8px; font-size: 15px; gap: var(--missing); }']
    ]);
    const violations = findCssTokenViolations({ files: [...fixtures.keys()], readFile: file => fixtures.get(file) });
    assert.ok(violations.some(issue => issue.includes('color literal')));
    assert.ok(violations.some(issue => issue.includes('type scale')));
    assert.ok(violations.some(issue => issue.includes('--missing')));
    assert.ok(violations.some(issue => issue.includes('cycle')));
    fixtures.set(definitions, ':root { --color-white: #fff; --space-2: 8px; }');
    fixtures.set(component, '.example { color: color-mix(in srgb, var(--color-white) 12%, transparent); gap: var(--space-2); padding: 3px; border-radius: 3px; }');
    assert.deepEqual(findCssTokenViolations({ files: [...fixtures.keys()], readFile: file => fixtures.get(file) }), []);
    fixtures.set(definitions, ':root { --color-white: #fff; --space-2: 8px; ' + Array.from({ length: 11 }, (_, i) => `--text-${i}: 1rem;`).join(' ') + ' }');
    assert.ok(findCssTokenViolations({ files: [...fixtures.keys()], readFile: file => fixtures.get(file) }).some(issue => issue.includes('Too many --text-')));
});

test('friend invitations contain only selection and size, never scores, identities or fixed questions', () => {
    const invitation = createQuizInvitation({ categoryId: 'rom', total: 5, label: 'Rom', score: 20, email: 'private@test.invalid', questions: [1,2] });
    assert.equal(invitation.url, 'https://quiz-hero.de/?category=rom&invite=1&count=5');
    assert.doesNotMatch(JSON.stringify(invitation), /private@|questions|score/);
    assert.equal(invitation.text, 'Du wurdest herausgefordert. 5 Fragen zum Quiz „Rom“. Bist du bereit?');
    const tag = createQuizInvitation({ tagId: 'essen & trinken', total: 3 });
    assert.equal(new URL(tag.url).searchParams.get('tag'), 'essen & trinken');
    for (const count of ['0', '-1', '1.5', 'Infinity', '10001', 'all']) {
        assert.equal(readQuizInvitation(new URLSearchParams('category=rom&invite=1&count=' + count)), null);
    }
    assert.equal(readQuizInvitation(new URLSearchParams('category=rom&count=5')), null);
    assert.equal(createQuizInvitation({ total: 5 }), null);
});

test('opening an invitation offers a fresh round without starting it or taking a question sequence from the URL', () => {
    const oldWindow = globalThis.window;
    let offered, started;
    globalThis.window = { location: { search: '?category=rom&invite=1&count=10' } };
    try {
        const controller = new QuizController({ state: { getCategory: () => ({ enabled: true }), getAvailableCountForSelection: () => 7, selectionLabel: 'Rom' }, view: { renderInvitation: data => { offered = data; } } });
        controller.handleCategorySelected = () => {};
        controller.handleQuestionCountSelected = count => { started = count; };
        controller.applyInitialSelectionFromUrl();
        assert.equal(started, undefined);
        assert.equal(offered.count, 7);
        assert.equal(offered.reduced, true);
        offered.onStart();
        assert.equal(started, 7);
    } finally { globalThis.window = oldWindow; }
});

test('invitations use text sharing even when a browser cannot share images', async () => {
    const invitation = createQuizInvitation({ categoryId: 'rom', total: 5 });
    let received;
    const browser = { canShare: data => !data.files, share: async data => { received = data; } };
    assert.equal(await shareQuizInvitation(invitation, browser), 'opened');
    assert.equal(received.url, invitation.url);
    assert.equal(received.files, undefined);
    assert.equal(await shareQuizInvitation(invitation, {}), 'unavailable');
    browser.share = async () => { throw { name: 'AbortError' }; };
    assert.equal(await shareQuizInvitation(invitation, browser), 'cancelled');
});

test('practice entry waits for confirmation and refreshes unresolved questions before starting', async () => {
    const oldWindow = globalThis.window;
    globalThis.window = { location: { search: '?category=rom&practice=1' } };
    try {
        const state = new QuizState();
        state.setData({ categories: [{ id: 'rom', title: 'Rom', enabled: true, questions: [1,2,3].map(id => ({ id, answers: ['A','B','C','D'], correct: 0, difficulty: 'easy' })) }], tags: [], feedback: {} });
        let offered, submitted, mode, shown = false;
        const service = { getStoredUser: () => ({ id: 1 }), getJourney: async () => ({ practice: [{ id: 'rom', count: 2 }] }), startRound: async (ids, context) => { submitted = context; return { roundId: 'practice-round', questions: [state.getCategory('rom').questions[1]], isPractice: true }; } };
        const view = { renderInvitation: data => { offered = data; }, renderQuizSelectionLabel: () => {}, renderRoundMode: value => { mode = value; }, showQuiz: () => { shown = true; }, updateScore: () => {}, showLoadingMessage: message => { throw new Error(message); } };
        const controller = new QuizController({ state, view, userService: service });
        controller.handleCategorySelected = () => { state.activeCategoryId = 'rom'; state.selectionLabel = 'Rom'; };
        controller.renderCurrentQuestion = () => {};
        await controller.applyInitialSelectionFromUrl();
        assert.equal(submitted, undefined);
        assert.equal(offered.practice, true); assert.equal(offered.count, 2);
        await offered.onStart();
        assert.equal(submitted.practice, true); assert.equal(mode, true); assert.deepEqual(state.currentSequence.map(question => question.id), [2]); assert.equal(shown, true);
        assert.equal(state.roundId, 'practice-round');
    } finally { globalThis.window = oldWindow; }
});

test('practice cannot start anonymously or with an empty current mistake list', async () => {
    const oldWindow = globalThis.window;
    globalThis.window = { location: { search: '?category=rom&practice=1' } };
    try {
        for (const user of [null, { id: 1 }]) {
            let status, offered = false;
            const controller = new QuizController({ state: { getCategory: () => ({ enabled: true }) }, view: { showCategories: () => {}, renderUserStatus: message => { status = message; }, renderInvitation: () => { offered = true; } }, userService: { getStoredUser: () => user, getJourney: async () => ({ practice: [] }) } });
            controller.handleCategorySelected = () => {};
            await controller.applyInitialSelectionFromUrl();
            assert.equal(offered, false); assert.ok(status);
        }
    } finally { globalThis.window = oldWindow; }
});

test('practice completion preserves the saved submission for retry and returns to passport', async () => {
    const oldWindow = globalThis.window;
    let destination;
    globalThis.window = { location: { assign: url => { destination = url; } } };
    try {
        const state = new QuizState();
        state.currentSequence = [{ id: 2, correct: 0, answeredCorrectly: true, selectedAnswers: [0], difficulty: 'easy' }];
        state.activeCategoryId = 'rom'; state.selectionLabel = 'Rom'; state.score = 2; state.roundId = 'saved-round';
        const submissions = [];
        let actions;
        const controller = new QuizController({ state, view: { showResultModal: (stats, user, value) => { actions = value; }, showCategories: () => {} }, userService: { getStoredUser: () => ({ id: 1 }), saveResult: async (user, stats, context) => { submissions.push(JSON.stringify(context)); if (submissions.length === 1) throw new Error('Verbindungsfehler'); } } });
        controller.currentRoundIsPractice = true;
        controller.clearSelectionFromUrl = () => {};
        controller.handleNextQuestion();
        assert.equal(actions.practice, true);
        assert.equal(state.currentSequence.length, 0);
        assert.match(await actions.saveStatus, /Verbindungsfehler/);
        assert.equal(await actions.retrySave(), null);
        assert.equal(submissions[0], submissions[1]);
        actions.onOverview(); assert.equal(destination, 'passport.html');
    } finally { globalThis.window = oldWindow; }
});

test('passport recommendations use saved visits and keep archived history without claiming question mastery', () => {
    const visited = { kind: 'category', id: 'rom', title: 'Rom', available: true, rounds: 3, lastPlayed: '2026-10-18T12:00:00Z' };
    const unplayed = { kind: 'category', id: 'florenz', title: 'Florenz', available: true, rounds: 0, lastPlayed: null };
    const archived = { kind: 'category', id: 'old', title: 'Altes Quiz', available: false, rounds: 2, lastPlayed: '2026-10-19T12:00:00Z' };
    const data = { summary: { rounds: 5, categories: 2, topics: 0 }, selections: [unplayed, archived, visited], recent: [{ selectionKey: 'category:old', score: 1 }] };
    const model = buildPassportModel(data);
    assert.equal(model.next.id, 'rom'); assert.equal(model.discover.id, 'florenz');
    assert.equal(selectionUrl(archived), null);
    assert.equal(selectionUrl({ ...visited, id: 'rom & antike' }), 'index.html?category=rom+%26+antike');
    assert.equal(model.stations.length, 2);
    assert.deepEqual(model.stations.map(item => item.id), ['rom', 'florenz']);
    assert.equal(passportDate('invalid'), 'Datum unbekannt');
    const empty = buildPassportModel({ summary: { rounds: 0 }, selections: [unplayed], recent: [] });
    assert.equal(empty.next.id, 'florenz');
});

test('passport stations rank by completed rounds then German title, independently of next adventure', () => {
    const selection = (id, title, rounds, lastPlayed, available = true) => ({ kind: 'category', id, title, rounds, lastPlayed, available });
    const model = buildPassportModel({ summary: {}, recent: [], selections: [
        selection('rom', 'Rom', 3, '2026-10-18'), selection('neapel', 'Neapel', 8, '2026-10-10'),
        selection('antike', 'Antike', 3, '2026-10-09'), selection('archiv', 'Archiv', 99, '2026-10-19', false),
    ] });
    assert.deepEqual(model.stations.map(item => item.id), ['neapel', 'antike', 'rom']);
    assert.equal(model.next.id, 'rom');
});

test('difficulty cards show sample size and distinguish missing data from zero percent', () => {
    const cards = difficultySuccessCards({ easy: { percent: 82, total: 100 }, medium: { percent: 0, total: 1 } });
    assert.deepEqual(cards.map(card => card.percent), ['82 %', '0 %', '–']);
    assert.deepEqual(cards.map(card => card.count), ['100 Fragen', '1 Frage', '0 Fragen']);
    assert.deepEqual(cards.map(card => card.label), ['Normal', 'Schwer', 'Hero']);
    assert.deepEqual(difficultySuccessCards().map(card => card.count), ['0 Fragen', '0 Fragen', '0 Fragen']);
});

test('account menu exposes guest access or account and passport links without personal data', () => {
    assert.deepEqual(accountMenuLinks(null), [{ label: 'Login', href: 'login.html' }, { label: 'Registrieren', href: 'login.html?view=register' }]);
    const links = accountMenuLinks({ id: 7, username: 'Private name', email: 'private@example.test' });
    assert.deepEqual(links, [{ label: 'Mein Konto', href: 'account.html' }, { label: 'Reisepass', href: 'passport.html' }]);
    assert.doesNotMatch(JSON.stringify(links), /private|Private/);
    assert.deepEqual(accountMenuLinks({}), accountMenuLinks(null));
});
