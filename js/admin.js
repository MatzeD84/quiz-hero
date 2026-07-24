import { CONFIG } from './config.js?v=dev';
import { applyAccountHeaderLogo } from './account-logo.js?v=dev';

applyAccountHeaderLogo();

const $ = selector => document.querySelector(selector);
const $$ = selector => Array.from(document.querySelectorAll(selector));
let csrfToken = '';
const API_VERSION = CONFIG.apiVersion || '1';
const MAX_IMAGE_UPLOAD_BYTES = 6 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const apiUrl = action => {
    const params = new URLSearchParams({ action, v: API_VERSION });
    return `../${CONFIG.apiUrl}?${params.toString()}`;
};

const resolveAssetUrl = path => {
    if (!path) return '';
    if (/^https?:\/\//i.test(path)) return path;
    return path.startsWith('../') ? path : `../${path.replace(/^\/+/, '')}`;
};

const fileNameFromPath = path => {
    if (!path) return '';
    const normalized = path.split(/[?#]/)[0].replace(/\\/g, '/');
    return normalized.split('/').filter(Boolean).pop() || '';
};

const api = async (action, payload = null) => {
    const headers = { 'Accept': 'application/json' };
    if (payload) {
        headers['Content-Type'] = 'application/json';
    }
    if (csrfToken && action !== 'admin-login') {
        headers['X-Quiz-Hero-CSRF'] = csrfToken;
    }
    const options = payload ? {
        method: 'POST',
        headers,
        credentials: 'same-origin',
        body: JSON.stringify(payload)
    } : { headers, credentials: 'same-origin', cache: 'no-store' };
    const response = await fetch(apiUrl(action), options);
    const text = await response.text();
    let data;
    try {
        data = JSON.parse(text);
    } catch (error) {
        const preview = text.replace(/\s+/g, ' ').slice(0, 220);
        throw new Error(`API antwortet nicht mit JSON (HTTP ${response.status}): ${preview || response.statusText}`);
    }
    if (data.csrfToken) {
        csrfToken = data.csrfToken;
    }
    return data;
};

const validateImageFile = file => {
    if (!file) {
        throw new Error('Bitte waehle zuerst ein Bild aus.');
    }
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        throw new Error('Erlaubt sind JPG, PNG und WebP.');
    }
    if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
        throw new Error('Das Bild darf maximal 6 MB gross sein.');
    }
};

const uploadImage = async ({ file, context = 'question', categoryId = '', categoryTitle = '' }) => {
    validateImageFile(file);

    const formData = new FormData();
    formData.append('context', context);
    formData.append('categoryId', categoryId);
    formData.append('categoryTitle', categoryTitle);
    formData.append('image', file);

    const headers = { 'Accept': 'application/json' };
    if (csrfToken) {
        headers['X-Quiz-Hero-CSRF'] = csrfToken;
    }

    const response = await fetch(apiUrl('admin-image-upload'), {
        method: 'POST',
        headers,
        credentials: 'same-origin',
        body: formData
    });
    const text = await response.text();
    let data;
    try {
        data = JSON.parse(text);
    } catch (error) {
        const preview = text.replace(/\s+/g, ' ').slice(0, 220);
        throw new Error(`Upload antwortet nicht mit JSON (HTTP ${response.status}): ${preview || response.statusText}`);
    }
    if (!response.ok || !data.ok) {
        throw new Error(data.error || `Upload fehlgeschlagen (HTTP ${response.status}).`);
    }

    return data;
};

let categories = [];
let questions = [];
let selectedQuestionId = '';
let activeAdminTab = 'edit';
let pendingCategoryImageFile = null;
let pendingCategoryPreviewUrl = '';
let mediaItems = [];
let selectedMediaPath = '';
let pendingMediaPreviewUrl = '';
let pendingMediaUploadFile = null;

const inferStatusType = message => {
    if (!message) return '';
    const lower = message.toLowerCase();
    if (lower.includes('fehler') || lower.includes('fehl') || lower.includes('nicht ') || lower.includes('ungueltig') || lower.includes('ungültig')) {
        return 'error';
    }
    if (lower.includes('gespeichert') || lower.includes('hochgeladen') || lower.includes('gelöscht') || lower.includes('eingeloggt')) {
        return 'success';
    }
    return 'info';
};

const setStatus = (message, type = '') => {
    const status = $('#js-admin-status');
    status.textContent = message || '';
    status.dataset.status = message ? (type || inferStatusType(message)) : '';
};
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
    if (!selectedQuestionId && questions[0]) {
        fillQuestion(questions[0]);
    } else if (selectedQuestionId) {
        const selected = questions.find(question => String(question.id) === String(selectedQuestionId));
        if (selected) fillQuestion(selected);
    }
}

async function loadMedia() {
    const data = await api('admin-media-list');
    if (!data.ok) throw new Error(data.error || 'Mediathek konnte nicht geladen werden.');
    mediaItems = data.media || [];
    renderMediaFilters();
    renderMedia();
}

function renderCategories() {
    const select = $('#js-admin-category');
    const filterSelect = $('#js-admin-filter-category');
    const editSelect = $('#js-admin-category-edit-select');
    select.innerHTML = '';
    filterSelect.innerHTML = '<option value="">Alle Kategorien</option>';
    editSelect.innerHTML = '<option value="">Neue Kategorie</option>';
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = category.title;
        select.appendChild(option);

        const filterOption = option.cloneNode(true);
        filterSelect.appendChild(filterOption);

        const editOption = option.cloneNode(true);
        editSelect.appendChild(editOption);
    });
    renderTagFilter();
}

function renderMediaFilters() {
    const categorySelect = $('#js-admin-media-filter-category');
    const tagSelect = $('#js-admin-media-filter-tag');
    const currentCategory = categorySelect.value;
    const currentTag = tagSelect.value;
    const mediaCategories = [...new Set(mediaItems.flatMap(item => item.categories || []))].filter(Boolean).sort();
    const mediaTags = [...new Set(mediaItems.flatMap(item => item.tags || []))].filter(Boolean).sort((a, b) => a.localeCompare(b, 'de'));

    categorySelect.innerHTML = '<option value="">Alle Kategorien</option>';
    mediaCategories.forEach(categoryId => {
        const category = categories.find(item => item.id === categoryId);
        const option = document.createElement('option');
        option.value = categoryId;
        option.textContent = category?.title || categoryId;
        categorySelect.appendChild(option);
    });
    if (mediaCategories.includes(currentCategory)) categorySelect.value = currentCategory;

    tagSelect.innerHTML = '<option value="">Alle Tags</option>';
    mediaTags.forEach(tag => {
        const option = document.createElement('option');
        option.value = tag;
        option.textContent = tag;
        tagSelect.appendChild(option);
    });
    if (mediaTags.includes(currentTag)) tagSelect.value = currentTag;
}

function getFilteredMedia() {
    const search = $('#js-admin-media-search').value.trim().toLowerCase();
    const categoryId = $('#js-admin-media-filter-category').value;
    const tag = $('#js-admin-media-filter-tag').value;
    const unusedOnly = $('#js-admin-media-unused').checked;

    return mediaItems.filter(item => {
        const searchable = [item.filename, item.path, item.folder].join(' ').toLowerCase();
        return (!search || searchable.includes(search))
            && (!categoryId || (item.categories || []).includes(categoryId))
            && (!tag || (item.tags || []).includes(tag))
            && (!unusedOnly || !item.used);
    });
}

function clearMediaFilters() {
    $('#js-admin-media-search').value = '';
    $('#js-admin-media-filter-category').value = '';
    $('#js-admin-media-filter-tag').value = '';
    $('#js-admin-media-unused').checked = false;
}

function formatBytes(bytes) {
    if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB';
    const units = ['B', 'KB', 'MB'];
    let value = bytes;
    let unit = 0;
    while (value >= 1024 && unit < units.length - 1) {
        value /= 1024;
        unit += 1;
    }
    return `${value.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`;
}

function renderMedia() {
    const grid = $('#js-admin-media-grid');
    const filtered = getFilteredMedia();
    grid.innerHTML = '';
    $('#js-admin-media-count').textContent = `${filtered.length} / ${mediaItems.length}`;
    if (filtered.length === 0) {
        const empty = document.createElement('p');
        empty.className = 'admin-list__empty';
        empty.textContent = 'Keine passenden Bilder gefunden.';
        grid.appendChild(empty);
        renderMediaDetail(null);
        return;
    }

    filtered.forEach(item => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'admin-media-card';
        if (item.path === selectedMediaPath) button.classList.add('admin-media-card--active');
        button.innerHTML = '<img alt="" loading="lazy"><span class="admin-media-card__name"></span><span class="admin-media-card__meta"></span>';
        button.querySelector('img').src = item.url;
        button.querySelector('.admin-media-card__name').textContent = item.filename;
        button.querySelector('.admin-media-card__meta').textContent = item.used ? `${item.usage.length} Verwendung(en)` : 'Unbenutzt';
        button.addEventListener('click', () => {
            selectedMediaPath = item.path;
            renderMedia();
            renderMediaDetail(item);
        });
        grid.appendChild(button);
    });

    const selected = mediaItems.find(item => item.path === selectedMediaPath);
    renderMediaDetail(selected || filtered[0]);
}

function renderMediaDetail(item) {
    const detail = $('#js-admin-media-detail');
    if (!item) {
        detail.innerHTML = '<p class="admin-list__empty">Wähle ein Bild aus.</p>';
        return;
    }
    selectedMediaPath = item.path;
    detail.innerHTML = '<img class="admin-media-detail__image" alt=""><dl class="admin-media-detail__meta"><div><dt>Dateiname</dt><dd></dd></div><div><dt>Pfad</dt><dd></dd></div><div><dt>Größe</dt><dd></dd></div><div><dt>Abmessungen</dt><dd></dd></div><div><dt>Verwendung</dt><dd></dd></div></dl><div class="admin-media-detail__usage"></div><div class="admin-media-detail__actions"></div>';
    detail.querySelector('.admin-media-detail__image').src = item.url;
    const values = [
        item.filename,
        item.path,
        formatBytes(Number(item.size || 0)),
        item.width && item.height ? `${item.width} × ${item.height}px` : 'Unbekannt',
        item.used ? `${item.usage.length} Verwendung(en)` : 'Unbenutzt'
    ];
    detail.querySelectorAll('.admin-media-detail__meta dd').forEach((node, index) => {
        node.textContent = values[index];
    });
    const usageWrap = detail.querySelector('.admin-media-detail__usage');
    if (item.used) {
        const title = document.createElement('h3');
        title.textContent = 'Verwendet in';
        usageWrap.appendChild(title);
        const list = document.createElement('ul');
        item.usage.forEach(ref => {
            const li = document.createElement('li');
            const span = document.createElement('span');
            span.textContent = `${ref.type === 'category' ? 'Kategorie' : 'Frage'}: ${ref.title}`;
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'account-action-link';
            button.textContent = ref.type === 'category' ? 'Zur Kategorie' : 'Zur Frage';
            button.addEventListener('click', () => openMediaReference(ref));
            li.appendChild(span);
            li.appendChild(button);
            list.appendChild(li);
        });
        usageWrap.appendChild(list);
    }
    const actions = detail.querySelector('.admin-media-detail__actions');
    if (item.deletable) {
        const deleteButton = document.createElement('button');
        deleteButton.id = 'js-admin-media-delete';
        deleteButton.className = 'btn btn--modal';
        deleteButton.type = 'button';
        deleteButton.textContent = 'Bild löschen';
        deleteButton.addEventListener('click', () => deleteMedia(item));
        actions.appendChild(deleteButton);
    } else if (item.used) {
        const note = document.createElement('p');
        note.className = 'admin-media-detail__note';
        note.textContent = 'Löschen nicht möglich, Bild wird noch verwendet.';
        actions.appendChild(note);
    } else {
        const note = document.createElement('p');
        note.className = 'admin-media-detail__note';
        note.textContent = 'Bestandsbild aus dem Projektbestand. Löschen ist hier nicht möglich.';
        actions.appendChild(note);
    }
}

function openMediaReference(ref) {
    if (ref.type === 'question') {
        const question = questions.find(item => Number(item.id) === Number(ref.id));
        if (question) {
            setAdminTab('edit');
            fillQuestion(question);
            setStatus('Frage zur Bildverwendung geöffnet.');
        }
        return;
    }
    const category = categories.find(item => item.id === ref.id || item.id === ref.categoryId);
    if (category) {
        setAdminTab('categories');
        fillCategory(category);
        setStatus('Kategorie zur Bildverwendung geöffnet.');
    }
}

function clearPendingMediaPreview() {
    pendingMediaUploadFile = null;
    if (pendingMediaPreviewUrl) {
        URL.revokeObjectURL(pendingMediaPreviewUrl);
        pendingMediaPreviewUrl = '';
    }
    $('#js-admin-media-dropzone-thumb').classList.add('admin-hidden');
    $('#js-admin-media-dropzone-thumb').removeAttribute('src');
    $('#js-admin-media-upload-actions').classList.add('admin-hidden');
    $('#js-admin-media-file').value = '';
}

function renderPendingMediaDetail(file) {
    clearPendingMediaPreview();
    pendingMediaUploadFile = file;
    pendingMediaPreviewUrl = URL.createObjectURL(file);
    const thumb = $('#js-admin-media-dropzone-thumb');
    thumb.src = pendingMediaPreviewUrl;
    thumb.classList.remove('admin-hidden');
    $('#js-admin-media-upload-actions').classList.remove('admin-hidden');
    const detail = $('#js-admin-media-detail');
    detail.innerHTML = '<img class="admin-media-detail__image" alt=""><dl class="admin-media-detail__meta"><div><dt>Dateiname</dt><dd></dd></div><div><dt>Pfad</dt><dd>Noch nicht gespeichert</dd></div><div><dt>Größe</dt><dd></dd></div><div><dt>Verwendung</dt><dd>Upload läuft</dd></div></dl>';
    detail.querySelector('.admin-media-detail__image').src = pendingMediaPreviewUrl;
    detail.querySelectorAll('.admin-media-detail__meta dd')[0].textContent = file.name;
    detail.querySelectorAll('.admin-media-detail__meta dd')[2].textContent = formatBytes(file.size);
}

function renderTagFilter() {
    const tagSelect = $('#js-admin-filter-tag');
    const currentValue = tagSelect.value;
    const tags = [...new Set(questions.flatMap(question => question.tag || []))]
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b, 'de'));
    tagSelect.innerHTML = '<option value="">Alle Tags</option>';
    tags.forEach(tag => {
        const option = document.createElement('option');
        option.value = tag;
        option.textContent = tag;
        tagSelect.appendChild(option);
    });
    if (tags.includes(currentValue)) {
        tagSelect.value = currentValue;
    }
}

function getFilteredQuestions() {
    const search = $('#js-admin-question-search').value.trim().toLowerCase();
    const categoryId = $('#js-admin-filter-category').value;
    const tag = $('#js-admin-filter-tag').value;

    return questions.filter(question => {
        const tags = question.tag || [];
        const searchable = [
            question.question,
            question.categoryTitle,
            question.backgroundKnowledge,
            ...(question.answers || []),
            ...tags
        ].join(' ').toLowerCase();

        return (!categoryId || question.categoryId === categoryId)
            && (!tag || tags.includes(tag))
            && (!search || searchable.includes(search));
    });
}

function renderQuestions() {
    const list = $('#js-admin-question-list');
    const filteredQuestions = getFilteredQuestions();
    list.innerHTML = '';
    $('#js-admin-question-count').textContent = `${filteredQuestions.length} / ${questions.length}`;
    if (filteredQuestions.length === 0) {
        const item = document.createElement('li');
        item.className = 'admin-list__empty';
        item.textContent = 'Keine passenden Fragen gefunden.';
        list.appendChild(item);
        return;
    }
    filteredQuestions.forEach(question => {
        const item = document.createElement('li');
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'admin-question-button';
        if (String(question.id) === String(selectedQuestionId)) {
            button.classList.add('admin-question-button--active');
        }
        const tags = (question.tag || []).slice(0, 3).join(', ');
        button.innerHTML = `
            <span class="admin-question-button__title"></span>
            <span class="admin-question-button__meta"></span>
        `;
        button.querySelector('.admin-question-button__title').textContent = question.question;
        button.querySelector('.admin-question-button__meta').textContent = [question.categoryTitle, question.difficulty, tags].filter(Boolean).join(' · ');
        button.addEventListener('click', () => {
            setAdminTab('edit');
            fillQuestion(question);
        });
        item.appendChild(button);
        list.appendChild(item);
    });
}

function setAdminTab(tab, options = {}) {
    if (options.clearStatus) {
        setStatus('');
    }
    activeAdminTab = tab;
    $$('[data-admin-tab]').forEach(button => {
        const active = button.dataset.adminTab === tab;
        button.classList.toggle('tab--active', active);
        button.setAttribute('aria-selected', String(active));
    });
    $('#js-admin-question-panel').classList.toggle('admin-hidden', tab === 'categories' || tab === 'media');
    $('#js-admin-category-panel').classList.toggle('admin-hidden', tab !== 'categories');
    $('#js-admin-media-panel').classList.toggle('admin-hidden', tab !== 'media');
    $('#js-admin-question-browser').classList.toggle('admin-hidden', tab === 'new');
    if (tab === 'new') {
        fillQuestion();
    } else if (tab === 'categories' && !$('#js-admin-category-id').value) {
        const currentCategoryId = $('#js-admin-category').value;
        const category = categories.find(item => item.id === currentCategoryId) || categories[0];
        fillCategory(category || {});
    } else if (tab === 'media') {
        loadMedia().catch(error => setStatus(error.message || 'Mediathek konnte nicht geladen werden.'));
    }
}

function updateImageState() {
    const imageUrl = $('#js-admin-image').value.trim();
    $('#js-admin-type').value = imageUrl ? 'image' : 'text';
    const previewWrap = $('#js-admin-image-preview-wrap');
    const preview = $('#js-admin-image-preview');
    $('#js-admin-image-filename').textContent = fileNameFromPath(imageUrl);
    $('#js-admin-image-path').textContent = imageUrl;
    previewWrap.classList.toggle('admin-hidden', !imageUrl);
    if (imageUrl) {
        preview.src = resolveAssetUrl(imageUrl);
    } else {
        preview.removeAttribute('src');
    }
}

function updateCategoryImageState() {
    const imageUrl = $('#js-admin-category-icon').value.trim();
    const dropzone = $('#js-admin-category-image-dropzone');
    const previewWrap = $('#js-admin-category-image-preview-wrap');
    const preview = $('#js-admin-category-image-preview');

    const previewUrl = imageUrl ? resolveAssetUrl(imageUrl) : pendingCategoryPreviewUrl;
    $('#js-admin-category-image-filename').textContent = imageUrl ? fileNameFromPath(imageUrl) : (pendingCategoryImageFile?.name || '');
    $('#js-admin-category-image-path').textContent = imageUrl || (pendingCategoryImageFile ? 'Noch nicht gespeichert' : '');
    dropzone.classList.toggle('admin-hidden', Boolean(previewUrl));
    previewWrap.classList.toggle('admin-hidden', !previewUrl);
    if (previewUrl) {
        preview.src = previewUrl;
    } else {
        preview.removeAttribute('src');
    }
}

function clearPendingCategoryImage() {
    pendingCategoryImageFile = null;
    if (pendingCategoryPreviewUrl) {
        URL.revokeObjectURL(pendingCategoryPreviewUrl);
        pendingCategoryPreviewUrl = '';
    }
}

function setPendingCategoryImage(file) {
    clearPendingCategoryImage();
    pendingCategoryImageFile = file;
    pendingCategoryPreviewUrl = URL.createObjectURL(file);
    updateCategoryImageState();
}

async function uploadQuestionImage(file) {
    try {
        setStatus('Bild wird hochgeladen...');
        const result = await uploadImage({
            file,
            context: 'question',
            categoryId: $('#js-admin-category').value
        });
        $('#js-admin-image').value = result.path;
        $('#js-admin-image-file').value = '';
        updateImageState();
        setStatus('Bild wurde hochgeladen. Bitte Frage speichern.');
    } catch (error) {
        setStatus(error.message || 'Bild konnte nicht hochgeladen werden.');
    }
}

async function uploadCategoryImage(file, options = {}) {
    const deferIfMissing = options.deferIfMissing !== false;
    try {
        validateImageFile(file);
        const categoryId = $('#js-admin-category-id').value.trim();
        const categoryTitle = $('#js-admin-category-title').value.trim();
        if (!categoryId && !categoryTitle) {
            if (deferIfMissing) {
                setPendingCategoryImage(file);
                $('#js-admin-category-image-file').value = '';
                setStatus('Bild ist vorgemerkt. Bitte Kategorie-Titel oder ID eintragen und speichern.');
                return false;
            }
            throw new Error('Bitte zuerst eine Kategorie-ID oder einen Titel eintragen.');
        }
        setStatus('Kategorie-Bild wird hochgeladen...');
        const result = await uploadImage({
            file,
            context: 'category',
            categoryId,
            categoryTitle
        });
        $('#js-admin-category-icon').value = result.path;
        $('#js-admin-category-image-file').value = '';
        clearPendingCategoryImage();
        updateCategoryImageState();
        setStatus('Kategorie-Bild wurde hochgeladen. Bitte Kategorie speichern.');
        return true;
    } catch (error) {
        setStatus(error.message || 'Kategorie-Bild konnte nicht hochgeladen werden.');
        return false;
    }
}

function stageMediaImage(file) {
    try {
        validateImageFile(file);
        clearMediaFilters();
        renderPendingMediaDetail(file);
        setStatus('Bild ist ausgewählt. Bitte mit "Hochladen" bestätigen.');
    } catch (error) {
        clearPendingMediaPreview();
        setStatus(error.message || 'Bild konnte nicht ausgewählt werden.');
    }
}

async function uploadPendingMediaImage() {
    if (!pendingMediaUploadFile) {
        setStatus('Bitte zuerst ein Bild auswählen.');
        return;
    }
    try {
        setStatus('Bild wird in die Mediathek hochgeladen...');
        const result = await uploadImage({ file: pendingMediaUploadFile, context: 'media' });
        $('#js-admin-media-file').value = '';
        selectedMediaPath = result.path || '';
        await loadMedia();
        clearPendingMediaPreview();
        setStatus('Bild wurde hochgeladen und ausgewählt.');
    } catch (error) {
        clearPendingMediaPreview();
        setStatus(error.message || 'Bild konnte nicht hochgeladen werden.');
    }
}

async function deleteMedia(item) {
    if (!item || !item.deletable) return;
    if (!window.confirm(`Bild "${item.filename}" wirklich vom Server löschen?`)) return;
    const result = await api('admin-media-delete', { path: item.path });
    setStatus(result.ok ? 'Bild wurde gelöscht.' : result.error);
    if (result.ok) {
        selectedMediaPath = '';
        await loadMedia();
    }
}

function setupDropzone({ dropzoneSelector, fileInputSelector, onFile }) {
    const dropzone = $(dropzoneSelector);
    const fileInput = $(fileInputSelector);
    const selectFile = () => fileInput.click();

    dropzone.addEventListener('click', event => {
        if (event.target !== fileInput) selectFile();
    });
    dropzone.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            selectFile();
        }
    });
    fileInput.addEventListener('change', () => {
        const file = fileInput.files?.[0];
        if (file) onFile(file);
    });
    ['dragenter', 'dragover'].forEach(eventName => {
        dropzone.addEventListener(eventName, event => {
            event.preventDefault();
            dropzone.classList.add('admin-dropzone--dragover');
        });
    });
    ['dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, event => {
            event.preventDefault();
            dropzone.classList.remove('admin-dropzone--dragover');
        });
    });
    dropzone.addEventListener('drop', event => {
        const file = event.dataTransfer?.files?.[0];
        if (file) onFile(file);
    });
}

function fillQuestion(question = {}) {
    $('#js-admin-form-title').textContent = question.id ? 'Frage bearbeiten' : 'Neue Frage';
    selectedQuestionId = question.id || '';
    $('#js-admin-question-id').value = question.id || '';
    $('#js-admin-category').value = question.categoryId || categories[0]?.id || '';
    $('#js-admin-question').value = question.question || '';
    $$('.js-admin-answer').forEach((input, index) => { input.value = question.answers?.[index] || ''; });
    $('#js-admin-correct').value = String(question.correct ?? 0);
    $('#js-admin-difficulty').value = question.difficulty || 'easy';
    $('#js-admin-image').value = question.imageUrl || '';
    $('#js-admin-type').value = question.imageUrl ? 'image' : 'text';
    $('#js-admin-image-file').value = '';
    $('#js-admin-tags').value = (question.tag || []).join(', ');
    $('#js-admin-background').value = question.backgroundKnowledge || '';
    $('#js-admin-sort').value = question.sortOrder || 100;
    $('#js-admin-active').checked = question.active !== false;
    $('#js-admin-delete').classList.toggle('admin-hidden', !question.id);
    updateImageState();
    renderQuestions();
}

function fillCategory(category = {}) {
    clearPendingCategoryImage();
    $('#js-admin-category-edit-select').value = category.id || '';
    $('#js-admin-category-id').value = category.id || '';
    $('#js-admin-category-id').disabled = Boolean(category.id);
    $('#js-admin-category-title').value = category.title || '';
    $('#js-admin-category-description').value = category.description || '';
    $('#js-admin-category-seo').value = category.seoDescription || '';
    $('#js-admin-category-icon').value = category.icon || '';
    $('#js-admin-category-sort').value = category.sortOrder || 100;
    $('#js-admin-category-enabled').checked = category.enabled !== false;
    $('#js-admin-category-badge-active').checked = Boolean(category.badge?.active);
    $('#js-admin-category-badge-text').value = category.badge?.text || 'Neu';
    updateCategoryImageState();
}

function collectQuestion() {
    const imageUrl = $('#js-admin-image').value.trim();
    return {
        id: $('#js-admin-question-id').value,
        categoryId: $('#js-admin-category').value,
        question: $('#js-admin-question').value,
        answers: $$('.js-admin-answer').map(input => input.value),
        correct: Number($('#js-admin-correct').value),
        difficulty: $('#js-admin-difficulty').value,
        type: imageUrl ? 'image' : 'text',
        imageUrl,
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
        csrfToken = result.csrfToken || csrfToken;
        setLoggedIn(true);
        setStatus('Eingeloggt.');
        await loadData();
    });

    $('#js-admin-logout').addEventListener('click', async () => {
        await api('admin-logout', {});
        csrfToken = '';
        setLoggedIn(false);
        setStatus('Ausgeloggt.');
    });

    $('#js-admin-refresh').addEventListener('click', loadData);
    $$('[data-admin-tab]').forEach(button => {
        button.addEventListener('click', () => setAdminTab(button.dataset.adminTab, { clearStatus: true }));
    });
    ['#js-admin-question-search', '#js-admin-filter-category', '#js-admin-filter-tag'].forEach(selector => {
        $(selector).addEventListener('input', renderQuestions);
        $(selector).addEventListener('change', renderQuestions);
    });
    setupDropzone({
        dropzoneSelector: '#js-admin-image-dropzone',
        fileInputSelector: '#js-admin-image-file',
        onFile: uploadQuestionImage
    });
    setupDropzone({
        dropzoneSelector: '#js-admin-category-image-dropzone',
        fileInputSelector: '#js-admin-category-image-file',
        onFile: uploadCategoryImage
    });
    setupDropzone({
        dropzoneSelector: '#js-admin-media-dropzone',
        fileInputSelector: '#js-admin-media-file',
        onFile: stageMediaImage
    });
    $('#js-admin-media-upload-btn').addEventListener('click', uploadPendingMediaImage);
    $('#js-admin-media-clear-btn').addEventListener('click', () => {
        clearPendingMediaPreview();
        setStatus('Bildauswahl entfernt.');
    });
    ['#js-admin-media-search', '#js-admin-media-filter-category', '#js-admin-media-filter-tag', '#js-admin-media-unused'].forEach(selector => {
        $(selector).addEventListener('input', renderMedia);
        $(selector).addEventListener('change', renderMedia);
    });
    $('#js-admin-image-remove').addEventListener('click', () => {
        $('#js-admin-image').value = '';
        $('#js-admin-image-file').value = '';
        updateImageState();
        setStatus('Bild aus der Frage entfernt. Bitte Frage speichern.');
    });
    $('#js-admin-category-image-remove').addEventListener('click', () => {
        $('#js-admin-category-icon').value = '';
        $('#js-admin-category-image-file').value = '';
        clearPendingCategoryImage();
        updateCategoryImageState();
        setStatus('Kategorie-Bild entfernt. Bitte Kategorie speichern.');
    });
    $('#js-admin-question-form').addEventListener('submit', async event => {
        event.preventDefault();
        const result = await api('admin-question-save', collectQuestion());
        setStatus(result.ok ? 'Frage gespeichert.' : result.error);
        if (result.ok) {
            await loadData();
            if (activeAdminTab === 'new') setAdminTab('edit');
        }
    });
    $('#js-admin-delete').addEventListener('click', async () => {
        const id = $('#js-admin-question-id').value;
        if (!id || !window.confirm('Diese Frage wirklich löschen?')) return;
        const result = await api('admin-question-delete', { id });
        setStatus(result.ok ? 'Frage gelöscht.' : result.error);
        if (result.ok) { fillQuestion(); await loadData(); }
    });
    $('#js-admin-new-category').addEventListener('click', () => {
        fillCategory();
        $('#js-admin-category-title').focus();
    });
    $('#js-admin-category-edit-select').addEventListener('change', event => {
        const category = categories.find(item => item.id === event.target.value);
        fillCategory(category || {});
    });
    $('#js-admin-category-form').addEventListener('submit', async event => {
        event.preventDefault();
        if (pendingCategoryImageFile && !$('#js-admin-category-icon').value) {
            const uploaded = await uploadCategoryImage(pendingCategoryImageFile, { deferIfMissing: false });
            if (!uploaded) return;
        }
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
        if (result.ok) {
            await loadData();
            const category = categories.find(item => item.id === $('#js-admin-category-id').value);
            fillCategory(category || {});
        }
    });
}

init().catch(error => {
    console.error(error);
    setStatus(error.message || 'Admin-App konnte nicht gestartet werden.');
});
