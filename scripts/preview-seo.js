// Local preview of generated pages; application assets come from localhost:8080.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const directory = path.resolve(process.argv[2] || '.build/seo-local');
const port = Number(process.env.SEO_PREVIEW_PORT || 8082);
const server = http.createServer(async (request, response) => {
    try {
        if (!['GET', 'HEAD'].includes(request.method)) { response.writeHead(405).end(); return; }
        const url = new URL(request.url, 'http://localhost');
        const generated = /^\/kategorie\/[a-z0-9-]+\.html$/.test(url.pathname) || ['/robots.txt', '/sitemap.xml'].includes(url.pathname);
        if (generated) {
            const file = path.join(directory, url.pathname.slice(1));
            if (!fs.existsSync(file)) { response.writeHead(404).end(); return; }
            response.setHeader('Content-Type', file.endsWith('.html') ? 'text/html; charset=utf-8' : file.endsWith('.xml') ? 'application/xml' : 'text/plain');
            response.setHeader('Cache-Control', 'no-store');
            response.end(request.method === 'HEAD' ? undefined : fs.readFileSync(file));
            return;
        }
        if (!/^\/(js|fonts|images|content|data)\//.test(url.pathname) && url.pathname !== '/styles.css') {
            const destination = ['/', '/index.html', '/account.html', '/login.html'].includes(url.pathname) ? url.pathname + url.search : '/';
            response.writeHead(302, { Location: 'http://localhost:8080' + destination }).end(); return;
        }
        const upstream = await fetch('http://localhost:8080' + url.pathname + url.search, { redirect: 'error', signal: AbortSignal.timeout(5000) });
        response.writeHead(upstream.status, { 'Content-Type': upstream.headers.get('content-type') || 'application/octet-stream', 'Cache-Control': 'no-store' });
        response.end(request.method === 'HEAD' ? undefined : Buffer.from(await upstream.arrayBuffer()));
    } catch { response.writeHead(502).end('Lokale Vorschau nicht verfügbar. Läuft die Anwendung auf localhost:8080?'); }
});
server.listen(port, '127.0.0.1', () => console.log(`SEO-Vorschau: http://127.0.0.1:${port}/kategorie/rom.html`));
