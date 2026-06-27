const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const categoriesPath = path.join(rootDir, 'categories.json');
const outputDir = path.join(rootDir, 'pages');
const siteTitle = 'Quiz-Hero';
const siteUrl = (process.env.SITE_URL || '').replace(/\/+$/, '');
const seoExportUrl = (process.env.SEO_EXPORT_URL || '').trim();
const seoExportToken = (process.env.SEO_EXPORT_TOKEN || '').trim();

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
                questions = Array.isArray(data.questions) ? data.questions : [];
            }
        }
        return { ...category, questions };
    });
};

const loadCategoriesFromSeoExport = async () => {
    if (!seoExportUrl || !seoExportToken || typeof fetch !== 'function') {
        return null;
    }

    const response = await fetch(seoExportUrl, {
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
    try {
        const exportedCategories = await loadCategoriesFromSeoExport();
        if (exportedCategories) {
            console.log(`SEO-Datenquelle: MySQL-Export (${seoExportUrl})`);
            return exportedCategories;
        }
    } catch (error) {
        console.warn(`SEO-Export nicht verfuegbar, nutze JSON-Fallback: ${error.message}`);
    }

    console.log('SEO-Datenquelle: JSON-Fallback');
    return loadCategoriesFromJson();
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
    <link rel="stylesheet" href="../fonts/fonts.css?v=20250211">
    <link rel="stylesheet" href="../styles.css?v=20250211">
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
    <section id="js-footer-modal" class="modal hide" role="dialog" aria-modal="true">
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
    </section>
    <script type="module">
        import { initFooter } from '../js/footer.js';
        initFooter();
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
    const iconPath = category.icon ? `../${category.icon}` : '';
    const badge = category.badge?.active && showBadge
        ? `<span class="category-card__badge">${escapeHtml(category.badge.text || 'Neu')}</span>`
        : '';
    const description = category.description
        ? `<span class="category-card__description">${escapeHtml(category.description)}</span>`
        : '';
    return `
        <a class="js-category-btn btn btn--category category-card" href="${escapeHtml(href)}" data-category="${escapeHtml(category.id)}">
            ${badge}
            ${iconPath ? `<img class="category-card__icon" src="${escapeHtml(iconPath)}" alt="${escapeHtml(category.title)} Icon">` : ''}
            <div class="category-card__text">
                <span class="category-card__title">${escapeHtml(category.title)}</span>
                ${description}
            </div>
        </a>
    `;
};

const buildFaqSection = questions => {
    if (!questions.length) {
        return '<p>Aktuell sind keine Fragen verfuegbar.</p>';
    }

    return `<div>
        ${questions.map((question, index) => {
            const title = toText(question.question).trim();
            const answers = Array.isArray(question.answers) ? question.answers : [];
            const correctIndex = Number.isInteger(question.correct) ? question.correct : null;

            const answersHtml = answers.length
                ? `<ul class="lp__faq_section_answers">
                    ${answers.map((answer, idx) => {
                        const isCorrect = idx === correctIndex;
                        const className = isCorrect ? ' class="seo-answer--correct"' : '';
                        return `<li${className}>${escapeHtml(answer)}</li>`;
                    }).join('')}
                </ul>`
                : '<p>Keine Antworten hinterlegt.</p>';

            return `
                <details>
                    <summary>${escapeHtml(title || `Frage ${index + 1}`)}</summary>
                    ${answersHtml}
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
            const correct = correctIndex != null ? answers[correctIndex] : '';
            if (!qText || !correct) {
                return null;
            }
            return {
                '@type': 'Question',
                name: qText,
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: correct
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
    const canonicalPath = `/pages/${category.id}.html`;
    const breadcrumbItems = [
        { label: 'Quiz-Hero', href: siteUrl ? `${siteUrl}/index.html` : '../index.html' },
        { label: `${category.title} Quiz`, href: siteUrl ? `${siteUrl}${canonicalPath}` : '' }
    ];
    const breadcrumbHtml = buildBreadcrumbs(breadcrumbItems);
    const cardHtml = buildCategoryCard({
        category: { ...category, questionCount },
        href: `../index.html?category=${encodeURIComponent(category.id)}`,
        showBadge: false,
        showMeta: true
    });

    const body = `
        <section id="js-category-container" class="lp main-section">
            <header class="main__header">
                <a class="main__logo-link" href="../index.html" title="Zur Startseite">
                    <img class="main_image" src="../images/website/logo.png" alt="Zur Startseite" loading="eager">
                </a>
                <h1 class="main_headline">Quiz-Hero</h1>
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
                <a class="btn" href="../index.html?category=${encodeURIComponent(category.id)}">Jetzt spielen</a>
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
            <section class="lp__faq_section">
                <h2>Alle Fragen und Antworten</h2>
                ${buildFaqSection(category.questions || [])}
            </section>
        </header>
        </section>
    `;

    const jsonLd = buildFaqJsonLd(category.questions || []);
    const breadcrumbsJsonLd = buildBreadcrumbsJsonLd([
        { label: 'Kategorien', href: siteUrl ? `${siteUrl}/pages/index.html` : './index.html' },
        { label: `${category.title} Quiz`, href: siteUrl ? `${siteUrl}${canonicalPath}` : '' }
    ]);
    const ogImagePath = category.icon || 'images/website/logo.png';
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
    const canonicalPath = '/pages/index.html';
    const breadcrumbItems = [
        { label: 'Quiz-Hero', href: siteUrl ? `${siteUrl}/index.html` : '../index.html' },
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
                <a class="main__logo-link" href="../index.html" title="Zur Startseite">
                    <img class="main_image" src="../images/website/logo.png" alt="Zur Startseite" loading="eager">
                </a>
                <h1 class="main_headline">Quiz-Hero</h1>
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

    const ogImageUrl = buildOgImageUrl('images/website/logo.png');
    const ogMeta = ogImageUrl
        ? `<meta property="og:image" content="${escapeHtml(ogImageUrl)}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:image" content="${escapeHtml(ogImageUrl)}">`
        : '';
    const breadcrumbsJsonLd = buildBreadcrumbsJsonLd([
        { label: 'Kategorien', href: siteUrl ? `${siteUrl}${canonicalPath}` : '' }
    ]);
    const extraHead = `${breadcrumbsJsonLd ? `<script type="application/ld+json">${breadcrumbsJsonLd}</script>` : ''}${ogMeta}`;
    return buildPageShell({ title, description, canonicalPath, body, extraHead });
};

const buildSitemap = urls => {
    const now = new Date().toISOString();
    const urlset = urls
        .map(url => {
            return `  <url>
    <loc>${escapeHtml(url)}</loc>
    <lastmod>${now}</lastmod>
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
    fs.mkdirSync(outputDir, { recursive: true });

    const sitemapUrls = [];
    const categoriesWithQuestions = await loadCategories();

    categoriesWithQuestions.forEach(category => {
        const questionCount = category.questions.length;
        const seoDescription = buildSeoDescription({
            category,
            questionCount,
            questions: category.questions
        });
        const relatedCategories = pickRelatedCategories(categoriesWithQuestions, category, 3);
        const html = buildCategoryPage({ category, questionCount, relatedCategories, seoDescription });
        const pagePath = path.join(outputDir, `${category.id}.html`);
        fs.writeFileSync(pagePath, normalizeGeneratedText(html), 'utf8');

        if (siteUrl) {
            sitemapUrls.push(`${siteUrl}/pages/${category.id}.html`);
        }
    });

    const indexHtml = buildIndexPage(categoriesWithQuestions);
    fs.writeFileSync(path.join(outputDir, 'index.html'), normalizeGeneratedText(indexHtml), 'utf8');

    if (siteUrl) {
        sitemapUrls.unshift(`${siteUrl}/pages/index.html`);
        sitemapUrls.unshift(`${siteUrl}/index.html`);
        sitemapUrls.unshift(`${siteUrl}/`);

        const sitemapXml = buildSitemap(sitemapUrls);
        fs.writeFileSync(path.join(rootDir, 'sitemap.xml'), normalizeGeneratedText(sitemapXml), 'utf8');

        const robots = `User-agent: *\nAllow: /\nSitemap: ${siteUrl}/sitemap.xml\n`;
        fs.writeFileSync(path.join(rootDir, 'robots.txt'), normalizeGeneratedText(robots), 'utf8');
    } else {
        console.log('SITE_URL fehlt. sitemap.xml und robots.txt werden nicht erzeugt.');
    }
};

run().catch(error => {
    console.error(error);
    process.exit(1);
});








