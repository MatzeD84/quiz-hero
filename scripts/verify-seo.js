const fs = require('fs');

async function verify() {
    const manifest = JSON.parse(fs.readFileSync(process.argv[2] || '.build/seo/seo-manifest.json', 'utf8'));
    const siteUrl = (process.env.SITE_URL || manifest.siteUrl).replace(/\/+$/, '');
    if (manifest.source !== 'export' || manifest.pages.length === 0) throw new Error('Kein gültiger Produktions-SEO-Build.');
    for (const { file, count } of manifest.pages) {
        const url = `${siteUrl}/kategorie/${file}`;
        const response = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(15000), headers: { 'Cache-Control': 'no-cache' } });
        if (!response.ok) throw new Error(`${file}: HTTP ${response.status}`);
        const html = await response.text();
        if (!html.includes(`<link rel="canonical" href="${url}">`) || (html.match(/<details>/g) || []).length !== count) {
            throw new Error(`${file}: Canonical oder Fragenanzahl stimmt nicht.`);
        }
    }
    console.log(`${manifest.pages.length} veröffentlichte SEO-Seiten geprüft.`);
}

verify().catch(error => { console.error(error.message); process.exitCode = 1; });
