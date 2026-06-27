import { CONFIG } from './config.js';

const $ = selector => document.querySelector(selector);
const $$ = selector => Array.from(document.querySelectorAll(selector));
const api = async (action, payload = null) => {
    const options = payload ? {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(payload)
    } : { headers: { 'Accept': 'application/json' }, credentials: 'same-origin', cache: 'no-store' };
    const response = await fetch(`../${CONFIG.apiUrl}?action=${encodeURIComponent(action)}`, options);
    const text = await response.text();
    try {
        return JSON.parse(text);
    } catch (error) {
        const preview = text.replace(/\s+/g, ' ').slice(0, 220);
        throw new Error(`API antwortet nicht mit JSON (HTTP ${response.status}): ${preview || response.statusText}`);
    }
};

let categories = [];
let questions = [];

const setStatus = message => { $('#js-admin-status').textContent = message || ''; };
const setLoggedIn = loggedIn => {
    $('#js-admin-login').classList.toggle('admin-hidden', loggedIn);
    $('#js-admin-app').classList.toggle('admin-hidden', !loggedIn);
};

async function loadData() {
    const data = await api('admin-data');
    if (!data.ok) throw new Error(data.error || 'Daten konnten nicht geladen werden.');
    categories = data.categories || [];
    questions = categories.flatMap(category => (category.questions || []).map(question => ({ ...question, categoryTitle: category.title })));
    renderCategories();
    renderQuestions();
}

function renderCategories() {
    const select = $('#js-admin-category');
    select.innerHTML = '';
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = category.title;
        select.appendChild(option);
    });
}

function renderQuestions() {
    const list = $('#js-admin-question-list');
    list.innerHTML = '';
    questions.forEach(question => {
        const item = document.createElement('li');
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'btn btn--modal';
        button.textContent = `${question.categoryTitle}: ${question.question}`;
        button.addEventListener('click', () => fillQuestion(question));
        item.appendChild(button);
        list.appendChild(item);
    });
}

function fillQuestion(question = {}) {
    $('#js-admin-form-title').textContent = question.id ? 'Frage bearbeiten' : 'Neue Frage';
    $('#js-admin-question-id').value = question.id || '';
    $('#js-admin-category').value = question.categoryId || categories[0]?.id || '';
    $('#js-admin-question').value = question.question || '';
    $$('.js-admin-answer').forEach((input, index) => { input.value = question.answers?.[index] || ''; });
    $('#js-admin-correct').value = String(question.correct ?? 0);
    $('#js-admin-difficulty').value = question.difficulty || 'easy';
    $('#js-admin-type').value = question.type || 'text';
    $('#js-admin-image').value = question.imageUrl || '';
    $('#js-admin-tags').value = (question.tag || []).join(', ');
    $('#js-admin-background').value = question.backgroundKnowledge || '';
    $('#js-admin-sort').value = question.sortOrder || 100;
    $('#js-admin-active').checked = question.active !== false;
}

function collectQuestion() {
    return {
        id: $('#js-admin-question-id').value,
        categoryId: $('#js-admin-category').value,
        question: $('#js-admin-question').value,
        answers: $$('.js-admin-answer').map(input => input.value),
        correct: Number($('#js-admin-correct').value),
        difficulty: $('#js-admin-difficulty').value,
        type: $('#js-admin-type').value,
        imageUrl: $('#js-admin-image').value,
        tags: $('#js-admin-tags').value,
        backgroundKnowledge: $('#js-admin-background').value,
        sortOrder: Number($('#js-admin-sort').value || 100),
        active: $('#js-admin-active').checked
    };
}

async function init() {
    const me = await api('admin-me');
    setLoggedIn(Boolean(me.admin));
    if (me.admin) await loadData();

    $('#js-admin-login-btn').addEventListener('click', async () => {
        const result = await api('admin-login', { username: $('#js-admin-user').value, password: $('#js-admin-password').value });
        if (!result.ok) { setStatus(result.error); return; }
        setLoggedIn(true);
        setStatus('Eingeloggt.');
        await loadData();
    });

    $('#js-admin-logout').addEventListener('click', async () => {
        await api('admin-logout', {});
        setLoggedIn(false);
        setStatus('Ausgeloggt.');
    });

    $('#js-admin-refresh').addEventListener('click', loadData);
    $('#js-admin-new-question').addEventListener('click', () => fillQuestion());
    $('#js-admin-question-form').addEventListener('submit', async event => {
        event.preventDefault();
        const result = await api('admin-question-save', collectQuestion());
        setStatus(result.ok ? 'Frage gespeichert.' : result.error);
        if (result.ok) await loadData();
    });
    $('#js-admin-delete').addEventListener('click', async () => {
        const id = $('#js-admin-question-id').value;
        if (!id || !window.confirm('Diese Frage wirklich löschen?')) return;
        const result = await api('admin-question-delete', { id });
        setStatus(result.ok ? 'Frage gelöscht.' : result.error);
        if (result.ok) { fillQuestion(); await loadData(); }
    });
    $('#js-admin-new-category').addEventListener('click', () => $('#js-admin-category-title').focus());
    $('#js-admin-category-form').addEventListener('submit', async event => {
        event.preventDefault();
        const result = await api('admin-category-save', {
            id: $('#js-admin-category-id').value,
            title: $('#js-admin-category-title').value,
            description: $('#js-admin-category-description').value,
            seoDescription: $('#js-admin-category-seo').value,
            icon: $('#js-admin-category-icon').value,
            sortOrder: Number($('#js-admin-category-sort').value || 100),
            enabled: $('#js-admin-category-enabled').checked,
            badgeActive: $('#js-admin-category-badge-active').checked,
            badgeText: $('#js-admin-category-badge-text').value
        });
        setStatus(result.ok ? 'Kategorie gespeichert.' : result.error);
        if (result.ok) await loadData();
    });
}

init().catch(error => {
    console.error(error);
    setStatus(error.message || 'Admin-App konnte nicht gestartet werden.');
});
