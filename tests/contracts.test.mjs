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
