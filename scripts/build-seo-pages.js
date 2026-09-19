const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const categoriesPath = path.join(rootDir, 'data/categories.json');
const outputRoot = path.resolve(process.env.SEO_OUTPUT_DIR || path.join(rootDir, '.build', 'seo'));
const outputDir = path.join(outputRoot, 'kategorie');
const sourceMode = process.env.SEO_SOURCE || 'export';
const siteTitle = 'Quiz-Hero';
const siteUrl = (process.env.SITE_URL || '').replace(/\/+$/, '');
const seoExportUrl = (process.env.SEO_EXPORT_URL || '').trim();
const seoExportToken = (process.env.SEO_EXPORT_TOKEN || '').trim();
const apiVersion = (process.env.QUIZ_HERO_API_VERSION || '1').trim();

const readJson = filePath => {
    const raw = fs.readFileSync(filePath, 'utf8');
    const cleaned = raw.replace(/^\uFEFF/, '');
    return JSON.parse(cleaned);
};

const loadCategoriesFromJson = () => {
    const { categories = [] } = readJson(categoriesPath);
    const enabledCategories = categories.filter(category => category && category.enabled !== false);

    return enabledCategories.map(category => {
        let questions = [];
        if (category.questionsFile) {
            const questionsPath = path.join(rootDir, category.questionsFile);
            if (fs.existsSync(questionsPath)) {
                const data = readJson(questionsPath);
                questions = Array.isArray(data.questions) ? data.questions.filter(q => q && q.active !== false) : [];
            }
        }
        return { ...category, questions };
    });
};

const withApiVersion = url => {
    if (!apiVersion) {
        return url;
    }
    const parsed = new URL(url);
    if (!parsed.searchParams.has('v')) {
        parsed.searchParams.set('v', apiVersion);
    }
    return parsed.toString();
};

const loadCategoriesFromSeoExport = async () => {
    if (!seoExportUrl || !seoExportToken || typeof fetch !== 'function') {
        throw new Error('SEO_EXPORT_URL und SEO_EXPORT_TOKEN sowie Node.js mit fetch sind erforderlich. Für lokale Vorschauen SEO_SOURCE=json ausdrücklich setzen.');
    }

    const versionedSeoExportUrl = withApiVersion(seoExportUrl);
    const response = await fetch(versionedSeoExportUrl, {
        signal: AbortSignal.timeout(15000),
        redirect: 'error',
        headers: {
            'Accept': 'application/json',
            'X-Quiz-Hero-SEO-Token': seoExportToken
        }
    });

    if (!response.ok) {
        throw new Error(`SEO export request failed (${response.status})`);
    }

    const data = await response.json();
    if (!data.ok || !Array.isArray(data.categories)) {
        throw new Error('SEO export response is invalid');
    }

    return data.categories
        .filter(category => category && category.enabled !== false)
        .map(category => ({
            ...category,
            questions: Array.isArray(category.questions)
                ? category.questions.filter(question => question && question.active !== false)
                : []
        }));
};

const loadCategories = async () => {
    if (sourceMode === 'json') {
        if (process.env.CI) throw new Error('JSON-Vorschauen dürfen nicht als CI-Produktionsbuild veröffentlicht werden.');
        console.log('SEO-Datenquelle: ausdrücklich gewählte lokale JSON-Vorschau');
        return loadCategoriesFromJson();
    }
    if (sourceMode !== 'export') throw new Error('Unbekannte SEO_SOURCE.');
    const categories = await loadCategoriesFromSeoExport();
    console.log('SEO-Datenquelle: bestätigter API-Export');
    return categories;
};

const escapeHtml = value => {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
};

const toText = value => (value == null ? '' : String(value));
const normalizeGeneratedText = value => String(value).replace(/[ \t]+$/gm, '');

const buildPageShell = ({ title, description, canonicalPath, body, extraHead = '' }) => {
    const canonicalUrl = siteUrl ? `${siteUrl}${canonicalPath}` : canonicalPath;
    const year = new Date().getFullYear();
    return `<!doctype html>
<html lang="de">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}">
    <link rel="canonical" href="${escapeHtml(canonicalUrl)}">
    <meta property="og:title" content="${escapeHtml(title)}">
    <meta property="og:description" content="${escapeHtml(description)}">
    <meta property="og:type" content="website">
    <link rel="stylesheet" href="../fonts/fonts.css?v=dev">
    <link rel="stylesheet" href="../styles.css?v=dev">
    ${extraHead}
</head>
<body>
    <main class="container">
        ${body}
    </main>
    <footer class="footer">
        <p class="footer__text">
            <small>
                &copy; <span class="js-footer-year">${year}</span> Quiz-Hero. Alle Rechte vorbehalten.
                <a href="#" class="js-footer-modal-link" data-footer-modal-url="../content/impressum.html">Impressum</a> |
                <a href="#" class="js-footer-modal-link" data-footer-modal-url="../content/datenschutz.html">Datenschutz</a> |
                <a href="#" class="js-footer-modal-link" data-footer-modal-url="../content/cookies.html">Cookies</a>
            </small>
        </p>
    </footer>
    <dialog id="js-footer-modal" class="modal hide" role="dialog" aria-modal="true">
        <div class="modal__content">
            <div class="modal__close">
                <button id="js-footer-modal-close" class="modal__close_btn" type="button" aria-label="Modal schliessen">
                    <svg class="quiz__abort_svg" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <path d="m12 10.93 5.719-5.72c.146-.146.339-.219.531-.219.404 0 .75.324.75.749 0 .193-.073.385-.219.532l-5.72 5.719 5.719 5.719c.147.147.22.339.22.531 0 .427-.349.75-.75.75-.192 0-.385-.073-.531-.219l-5.719-5.719-5.719 5.719c-.146.146-.339.219-.531.219-.401 0-.75-.323-.75-.75 0-.192.073-.384.22-.531l5.719-5.719-5.72-5.719c-.146-.147-.219-.339-.219-.532 0-.425.346-.749.75-.749.192 0 .385.073.531.219z"/>
                    </svg>
                </button>
            </div>
            <div id="js-footer-modal-content"></div>
        </div>
    </dialog>
    <script type="module">
        import { initFooter } from '../js/footer.js?v=dev';
        import { applyAccountHeaderLogo } from '../js/account-logo.js?v=dev';
        initFooter();
        applyAccountHeaderLogo();
    </script>
</body>
</html>`;
};

const buildOgImageUrl = relativePath => {
    if (!relativePath) {
        return '';
    }
    if (siteUrl) {
        return `${siteUrl}/${relativePath.replace(/^\/+/, '')}`;
    }
    return relativePath.startsWith('/') ? relativePath : `../${relativePath}`;
};

const buildBreadcrumbs = items => {
    if (!items.length) {
        return '';
    }
    const links = items
        .map((item, idx) => {
            const label = escapeHtml(item.label);
            if (!item.href || idx === items.length - 1) {
                return `<span class="breadcrumb__current">${label}</span>`;
            }
            return `<a class="breadcrumb__link" href="${escapeHtml(item.href)}">${label}</a>`;
        })
        .join('<span class="breadcrumb__sep">|</span>');
    return `<nav class="breadcrumb" aria-label="Breadcrumb">${links}</nav>`;
};

const buildBreadcrumbsJsonLd = items => {
    const entries = items
        .filter(item => item.href)
        .map((item, idx) => ({
            '@type': 'ListItem',
            position: idx + 1,
            name: item.label,
            item: item.href
        }));

    if (!entries.length) {
        return '';
    }

    const json = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: entries
    });
    return json.replace(/</g, '\\u003c');
};

const buildGeneralDescriptionSection = () => {
    const paragraphs = [
        'Quiz-Hero ist ein persönliches Herzensprojekt. Ich wollte ein Quiz, das Wissen, Neugier und Reisegefühl verbindet. Deshalb pflege ich die Inhalte kontinuierlich, erweitere Kategorien und passe Fragen an, damit sie fair und abwechslungsreich bleiben.',
        'Das Punktesystem ist klar geregelt: Normale Fragen bringen 2 Punkte, schwere Fragen 3 Punkte und Hero-Fragen 5 Punkte. Beim zweiten Versuch gibt es unabhängig von der Schwierigkeit immer 1 Punkt.',
        'Die Bilder sind KI-generiert und im gleichen Stil gehalten, damit die Kategorien visuell zusammenpassen. Ziel ist ein ruhiger, konsistenter Look, der das Quiz atmosphärisch macht, aber den Inhalt in den Vordergrund stellt.',
        'Wenn du Lust hast mitzumachen oder das Quiz mit Fragen und Kategorien zu erweitern und Teil des Projekts zu sein, schreib mir gern an helden@quiz-hero.de.'
    ];

    return `
        <section class="lp__general_description">
            <h2>Über Quiz-Hero</h2>
            ${paragraphs.map(text => `<p>${escapeHtml(text)}</p>`).join('')}
        </section>
    `;
};

const buildCategoryCard = ({ category, href, showBadge = true, showMeta = false }) => {
    const iconPath = category.icon ? (/^https?:\/\//.test(category.icon) ? category.icon : `/${category.icon.replace(/^\/+/, '')}`) : '';
    const badge = category.badge?.active && showBadge
        ? `<span class="category-card__badge">${escapeHtml(category.badge.text || 'Neu')}</span>`
        : '';
    const description = category.description
        ? `<span class="category-card__description">${escapeHtml(category.description)}</span>`
        : '';
    return `
        <a class="js-category-btn btn btn--category category-card" href="${escapeHtml(href)}" data-category="${escapeHtml(category.id)}">
            ${badge}
            ${iconPath ? `<img class="category-card__icon" src="${escapeHtml(iconPath)}" alt="${escapeHtml(category.title)} Icon" width="1536" height="1024">` : ''}
            <div class="category-card__text">
                <span class="category-card__title">${escapeHtml(category.title)}</span>
                ${description}
            </div>
        </a>
    `;
};

const safeContentUrl = value => {
    if (typeof value !== 'string' || /[\\\x00-\x20]/.test(value)) return '';
    if (/^\/?images\//.test(value) && !value.includes('..') && !value.includes('%')) return '/' + value.replace(/^\/+/, '');
    try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password ? url.href : ''; } catch { return ''; }
};
const questionAnchor = question => 'frage-' + (Number.isInteger(question.id) ? question.id : require('crypto').createHash('sha256').update(question.question).digest('hex').slice(0, 16));
const buildFurtherReading = category => {
    const sources = readJson(path.join(rootDir, 'data/category-sources.json'))[category.id] || [];
    if (!sources.length) return '';
    return `<section><h2>Weiterlesen bei offiziellen Einrichtungen</h2>
        <p>Hier findest du vertiefende Informationen zur Kategorie. Belege zu einzelnen Antworten stehen, soweit hinterlegt, direkt bei der jeweiligen Frage.</p>
        <ul>${sources.map(source => `<li><a href="${escapeHtml(safeContentUrl(source.url))}" rel="noopener noreferrer">${escapeHtml(source.title)}</a></li>`).join('')}</ul></section>`;
};
const buildFaqSection = questions => {
    if (!questions.length) {
        return '<p>Aktuell sind keine Fragen verfuegbar.</p>';
    }

    return `<div class="lp__faq_list">
        ${questions.map((question, index) => {
            const title = toText(question.question).trim();
            const answers = Array.isArray(question.answers) ? question.answers : [];
            const correctIndex = Number.isInteger(question.correct) ? question.correct : null;
            const correctAnswer = correctIndex != null ? toText(answers[correctIndex]).trim() : '';
            const backgroundKnowledge = toText(question.backgroundKnowledge).trim();

            const answerHtml = correctAnswer
                ? `<p class="seo-answer">
                    <span class="seo-answer__label">Antwort</span>
                    <strong class="seo-answer__text">${escapeHtml(correctAnswer)}</strong>
                </p>`
                : '<p class="seo-answer seo-answer--missing">Keine richtige Antwort hinterlegt.</p>';

            const hintHtml = backgroundKnowledge
                ? `<p class="seo-answer__hint">
                    <span class="seo-answer__hint-label">Hinweis</span>
                    ${escapeHtml(backgroundKnowledge)}
                </p>`
                : '';

            return `
                <details id="${questionAnchor(question)}">
                    <summary>${escapeHtml(title || `Frage ${index + 1}`)}</summary>
                    <div class="seo-answer__content">
                        ${safeContentUrl(question.imageUrl) ? '<figure><img class="seo-question-image" src="' + escapeHtml(safeContentUrl(question.imageUrl)) + '" alt="' + escapeHtml(question.imageAlt || 'Abbildung zur Frage: ' + title) + '" width="1536" height="1024" loading="lazy"><figcaption>KI-generierte Abbildung zur Frage</figcaption></figure>' : ''}
                        ${answerHtml}
                        ${hintHtml}
                        ${safeContentUrl(question.sourceUrl || question.meta?.sourceUrl) ? '<p>Quelle: <a rel="noopener noreferrer" href="' + escapeHtml(safeContentUrl(question.sourceUrl || question.meta?.sourceUrl)) + '">' + escapeHtml(question.sourceUrl || question.meta?.sourceUrl) + '</a></p>' : ''}
                        ${question.reviewedBy ? '<p>Fachlich geprüft von ' + escapeHtml(question.reviewedBy) + (question.reviewedAt ? ' am ' + escapeHtml(question.reviewedAt) : '') + '</p>' : ''}
                        <a href="#${questionAnchor(question)}">Link zu dieser Frage</a>
                    </div>
                </details>
            `;
        }).join('')}
    </div>`;
};

const buildFaqJsonLd = questions => {
    const entries = questions
        .map(question => {
            const qText = toText(question.question).trim();
            const answers = Array.isArray(question.answers) ? question.answers : [];
            const correctIndex = Number.isInteger(question.correct) ? question.correct : null;
            const correct = correctIndex != null ? toText(answers[correctIndex]).trim() : '';
            const backgroundKnowledge = toText(question.backgroundKnowledge).trim();
            if (!qText || !correct) {
                return null;
            }
            const answerText = backgroundKnowledge
                ? `${correct}. ${backgroundKnowledge}`
                : correct;
            return {
                '@type': 'Question',
                name: qText,
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: answerText
                }
            };
        })
        .filter(Boolean);

    if (entries.length === 0) {
        return '';
    }

    const json = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: entries
    });
    return json.replace(/</g, '\\u003c');
};

const buildSeoDescription = ({ category, questionCount, questions }) => {
    if (category.seoDescription && String(category.seoDescription).trim()) {
        return String(category.seoDescription).trim();
    }

    const tagCounts = new Map();
    questions.forEach(question => {
        const tags = Array.isArray(question.tag) ? question.tag : [];
        tags.forEach(tag => {
            const key = String(tag).trim();
            if (!key) {
                return;
            }
            tagCounts.set(key, (tagCounts.get(key) || 0) + 1);
        });
    });

    const topTags = Array.from(tagCounts.entries())
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'de'))
        .slice(0, 6)
        .map(([tag]) => tag);

    const tagText = topTags.length ? ` Schwerpunkte: ${topTags.join(', ')}.` : '';
    if (category.description) {
        return `${category.title} Quiz - ${category.description} Quiz mit ${questionCount} Fragen.${tagText}`;
    }
    return `${category.title} Quiz - Quiz mit ${questionCount} Fragen.${tagText}`;
};

const buildCategoryPage = ({ category, questionCount, relatedCategories, seoDescription }) => {
    const title = `${category.title} Quiz - Fragen \u0026 Antworten | ${siteTitle}`;
    const description = category.description
        ? `${category.title} Quiz - ${category.description} Quiz mit ${questionCount} Fragen.`
        : `${category.title} Quiz - Quiz mit ${questionCount} Fragen.`;
    const canonicalPath = `/kategorie/${category.id}.html`;
    const breadcrumbItems = [
        { label: 'Quiz-Hero', href: siteUrl ? `${siteUrl}/` : '../' },
        { label: `${category.title} Quiz`, href: siteUrl ? `${siteUrl}${canonicalPath}` : '' }
    ];
    const breadcrumbHtml = buildBreadcrumbs(breadcrumbItems);
    const cardHtml = buildCategoryCard({
        category: { ...category, questionCount },
        href: `../?category=${encodeURIComponent(category.id)}`,
        showBadge: false,
        showMeta: true
    });

    const body = `
        <section id="js-category-container" class="lp main-section">
            <header class="main__header">
                <a class="main__logo-link" href="../" title="Zur Startseite">
                    <img class="main_image" src="../images/website/avatar/logo.png" alt="Zur Startseite" width="1024" height="1024" loading="eager">
                </a>
                <h1 class="main_headline" tabindex="-1">${escapeHtml(category.title)}-Quiz: ${questionCount} Fragen und Antworten</h1>
            </header>
            ${breadcrumbHtml}
            <section class="lp__category_grid container_small">
                <h2>${escapeHtml(category.title)}</h2>
                <div class="category" aria-live="polite">
                    ${cardHtml}
                </div>
            </section>
            <section class="lp__category_description">
                <h2>Über dieses Quiz</h2>
                <p>${escapeHtml(seoDescription)}</p>
            </section>
            <section class="lp__quiz_start container_small">
                <h2>Quiz starten</h2>
                <a class="btn" href="../?category=${encodeURIComponent(category.id)}">Jetzt spielen</a>
            </section>
            ${relatedCategories.length ? `
            <section class="lp__related_categories">
                <h2>Auch interessant</h2>
                <div class="category" aria-live="polite">
                    ${relatedCategories.map(related => buildCategoryCard({
                        category: related,
                        href: `./${encodeURIComponent(related.id)}.html`
                    })).join('')}
                </div>
            </section>
            ` : ''}
            ${buildGeneralDescriptionSection()}
            ${buildFurtherReading(category)}
            <section class="lp__faq_section">
                <h2>Alle Fragen und Antworten</h2>
                ${buildFaqSection(category.questions || [])}
            </section>
        </section>
    `;

    const jsonLd = buildFaqJsonLd(category.questions || []);
    const breadcrumbsJsonLd = buildBreadcrumbsJsonLd([
        { label: 'Kategorien', href: siteUrl ? `${siteUrl}/` : '../' },
        { label: `${category.title} Quiz`, href: siteUrl ? `${siteUrl}${canonicalPath}` : '' }
    ]);
    const ogImagePath = category.icon || 'images/website/avatar/logo.png';
    const ogImageUrl = buildOgImageUrl(ogImagePath);
    const ogMeta = ogImageUrl
        ? `<meta property="og:image" content="${escapeHtml(ogImageUrl)}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:image" content="${escapeHtml(ogImageUrl)}">`
        : '';
    const extraHead = `${jsonLd ? `<script type="application/ld+json">${jsonLd}</script>` : ''}${breadcrumbsJsonLd ? `<script type="application/ld+json">${breadcrumbsJsonLd}</script>` : ''}${ogMeta}`;
    return buildPageShell({ title, description, canonicalPath, body, extraHead });
};

const buildIndexPage = categories => {
    const title = `${siteTitle} Kategorien`;
    const description = 'Alle Quiz-Kategorien im Ueberblick.';
    const canonicalPath = '/kategorie/';
    const breadcrumbItems = [
        { label: 'Quiz-Hero', href: siteUrl ? `${siteUrl}/` : '../' },
        { label: 'Kategorien', href: siteUrl ? `${siteUrl}${canonicalPath}` : '' }
    ];
    const breadcrumbHtml = buildBreadcrumbs(breadcrumbItems);
    const items = categories
        .map(category => buildCategoryCard({
            category,
            href: `./${encodeURIComponent(category.id)}.html`
        }))
        .join('');

    const body = `
        <section id="js-category-container" class="lp main-section">
            <header class="main__header">
                <a class="main__logo-link" href="../" title="Zur Startseite">
                    <img class="main_image" src="../images/website/avatar/logo.png" alt="Zur Startseite" width="1024" height="1024" loading="eager">
                </a>
                <h1 class="main_headline" tabindex="-1">Quiz-Hero</h1>
            </header>
            ${breadcrumbHtml}
            <section class="lp__category_grid">
                <h2>Städte, Regionen und Landschaften</h2>
                <div class="category" aria-live="polite">
                    ${items}
                </div>
            </section>
            ${buildGeneralDescriptionSection()}
        </section>
    `;

    const ogImageUrl = buildOgImageUrl('images/website/avatar/logo.png');
    const ogMeta = ogImageUrl
        ? `<meta property="og:image" content="${escapeHtml(ogImageUrl)}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:image" content="${escapeHtml(ogImageUrl)}">`
        : '';
    const breadcrumbsJsonLd = buildBreadcrumbsJsonLd([
        { label: 'Kategorien', href: siteUrl ? `${siteUrl}${canonicalPath}` : '' }
    ]);
    const extraHead = `<meta name="robots" content="noindex,follow">${breadcrumbsJsonLd ? `<script type="application/ld+json">${breadcrumbsJsonLd}</script>` : ''}${ogMeta}`;
    return buildPageShell({ title, description, canonicalPath, body, extraHead });
};

const buildSitemap = urls => {

    const urlset = urls
        .map(url => {
            return `  <url>
    <loc>${escapeHtml(url)}</loc>
  </url>`;
        })
        .join('\n');
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlset}
</urlset>`;
};

const collectTags = questions => {
    const tags = new Set();
    questions.forEach(question => {
        const list = Array.isArray(question.tag) ? question.tag : [];
        list.forEach(tag => {
            if (tag) {
                tags.add(String(tag));
            }
        });
    });
    return tags;
};

const countOverlap = (a, b) => {
    if (!a.size || !b.size) {
        return 0;
    }
    let count = 0;
    a.forEach(tag => {
        if (b.has(tag)) {
            count += 1;
        }
    });
    return count;
};

const pickRelatedCategories = (categories, currentCategory, maxCount) => {
    const currentTags = collectTags(currentCategory.questions || []);
    const ranked = categories
        .filter(category => category.id !== currentCategory.id)
        .map(category => {
            const tagCount = countOverlap(currentTags, collectTags(category.questions || []));
            return { category, tagCount };
        })
        .filter(entry => entry.tagCount > 0)
        .sort((a, b) => b.tagCount - a.tagCount || a.category.title.localeCompare(b.category.title, 'de'));

    const top = ranked.slice(0, maxCount).map(entry => entry.category);
    if (top.length >= maxCount) {
        return top;
    }

    const fallbackPool = categories
        .filter(category => category.id !== currentCategory.id && !top.some(item => item.id === category.id));
    const combined = top.concat(fallbackPool.slice(0, Math.max(0, maxCount - top.length)));
    return combined;
};

const run = async () => {
    if (!siteUrl || !/^https?:\/\//.test(siteUrl) || new URL(siteUrl).pathname !== '/') {
        throw new Error('SITE_URL muss eine absolute HTTP(S)-Origin ohne Pfad sein.');
    }
    const categoriesWithQuestions = await loadCategories();
    const { validateCategories } = await import('../js/validators.js');
    const errors = validateCategories(categoriesWithQuestions);
    const ids = new Set();
    if (!categoriesWithQuestions.length) errors.push('Unerwartet leerer Kategorienexport.');
    for (const category of categoriesWithQuestions) {
        if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(category.id) || ids.has(category.id)) errors.push('Ungültige oder doppelte Kategorie-ID.');
        ids.add(category.id);
        if (!category.questions?.length) errors.push('Aktive Kategorie ohne Fragen: ' + category.id);
    }
    if (errors.length) throw new Error('SEO-Build abgebrochen: ' + errors.join('\n'));
    // Render every page before touching the output. Failed validation never replaces a good build.
    const pages = categoriesWithQuestions.map(category => ({
        file: category.id + '.html',
        count: category.questions.length,
        html: normalizeGeneratedText(buildCategoryPage({
            category,
            questionCount: category.questions.length,
            relatedCategories: pickRelatedCategories(categoriesWithQuestions, category, 3),
            seoDescription: buildSeoDescription({ category, questionCount: category.questions.length, questions: category.questions })
        }))
    }));
    const manifestPath = path.join(outputRoot, 'seo-manifest.json');
    const previousPages = fs.existsSync(manifestPath) ? readJson(manifestPath).pages : [];
    if (!Array.isArray(previousPages) || previousPages.some(page => !/^[a-z0-9-]+\.html$/.test(page.file))) {
        throw new Error('Ungültiges vorheriges SEO-Manifest.');
    }
    fs.mkdirSync(outputDir, { recursive: true });
    // This directory contains generated pages only; never touch uploads or the application root.
    for (const file of fs.readdirSync(outputDir)) {
        if (!/^[a-z0-9-]+\.html$/.test(file) || !fs.lstatSync(path.join(outputDir, file)).isFile()) {
            throw new Error('Unerwartete Datei im SEO-Ausgabeverzeichnis: ' + file);
        }
        if (!pages.some(page => page.file === file) && !previousPages.some(page => page.file === file)) {
            throw new Error('Nicht vom Manifest verwaltete Datei bleibt unangetastet: ' + file);
        }
    }
    for (const page of pages) fs.writeFileSync(path.join(outputDir, page.file), page.html, 'utf8');
    for (const file of fs.readdirSync(outputDir)) {
        if (previousPages.some(page => page.file === file) && !pages.some(page => page.file === file)) fs.unlinkSync(path.join(outputDir, file));
    }
    const urls = [siteUrl + '/', ...pages.map(page => siteUrl + '/kategorie/' + page.file)];
    fs.writeFileSync(path.join(outputRoot, 'sitemap.xml'), normalizeGeneratedText(buildSitemap(urls)), 'utf8');
    fs.writeFileSync(path.join(outputRoot, 'robots.txt'), 'User-agent: *\nAllow: /\nSitemap: ' + siteUrl + '/sitemap.xml\n', 'utf8');
    fs.writeFileSync(path.join(outputRoot, 'seo-manifest.json'), JSON.stringify({ source: sourceMode, siteUrl, pages: pages.map(({file,count}) => ({file,count})) }, null, 2) + '\n');
    console.log('SEO-Build erfolgreich: ' + pages.length + ' Seiten in ' + outputRoot);
};

if (require.main === module) run().catch(error => { console.error(error.message); process.exitCode = 1; });
module.exports = { run, loadCategoriesFromJson, buildCategoryPage };
