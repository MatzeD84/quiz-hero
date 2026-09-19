import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { validateCategories, validateTags } from '../js/validators.js';
import { QuizDataService } from '../js/quiz-data-service.js';
import { UserService, SESSION_EXPIRED_MESSAGE } from '../js/user-service.js';

const question = { question: 'Which?', answers: ['A', 'B', 'C', 'D'], correct: 0, active: true };
const category = { id: 'sample', title: 'Sample', enabled: true, badge: { active: false, text: '' }, questions: [question] };

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
    globalThis.window = { localStorage: { removeItem: () => removed++ } };
    const service = new UserService({ fetchFn: async () => ({ ok: false, status: 401, text: async () => JSON.stringify({ ok: false, code: 'SESSION_EXPIRED' }) }) });
    await assert.rejects(service.getCurrentUser({ id: 1, token: 'test' }), { message: SESSION_EXPIRED_MESSAGE });
    assert.equal(removed, 1);
    const offline = new UserService({ fetchFn: async () => { throw new Error('offline'); } });
    await assert.rejects(offline.logout({ id: 1, token: 'test' }), /offline/);
    assert.equal(removed, 1);
    delete globalThis.window;
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
    let status = 200;
    let payload = { ok: true, categories: [{ ...category, questions: [question, { ...question, question: 'Unpublished', active: false }] }] };
    const server = http.createServer((req, res) => {
        assert.equal(req.headers['x-quiz-hero-seo-token'], 'fixture-only');
        res.writeHead(status, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(payload));
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const env = { SITE_URL: 'https://example.test', SEO_SOURCE: 'export', SEO_EXPORT_URL: `http://127.0.0.1:${server.address().port}/export`, SEO_EXPORT_TOKEN: 'fixture-only', SEO_OUTPUT_DIR: temp };
    try {
        let result = await build(env);
        assert.equal(result.code, 0, result.output);
        const file = path.join(temp, 'kategorie/sample.html');
        const good = fs.readFileSync(file, 'utf8');
        assert.equal((good.match(/<details>/g) || []).length, 1);
        assert.ok(!good.includes('Unpublished'));
        fs.writeFileSync(path.join(temp, 'kategorie/removed.html'), 'old generated page');
        const manifestPath = path.join(temp, 'seo-manifest.json');
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        manifest.pages.push({ file: 'removed.html', count: 1 });
        fs.writeFileSync(manifestPath, JSON.stringify(manifest));
        result = await build(env);
        assert.equal(result.code, 0, result.output);
        assert.ok(!fs.existsSync(path.join(temp, 'kategorie/removed.html')));
        status = 503;
        assert.notEqual((await build(env)).code, 0);
        assert.equal(fs.readFileSync(file, 'utf8'), good);
        status = 200;
        payload = { ok: true, categories: [] };
        assert.notEqual((await build(env)).code, 0);
        payload = { ok: true, categories: [{ ...category, id: '../escape' }] };
        assert.notEqual((await build(env)).code, 0);
        assert.equal(fs.readFileSync(file, 'utf8'), good);
        assert.notEqual((await build({ ...env, SEO_EXPORT_TOKEN: '' })).code, 0);
    } finally {
        await new Promise(resolve => server.close(resolve));
        fs.rmSync(temp, { recursive: true, force: true });
    }
});
