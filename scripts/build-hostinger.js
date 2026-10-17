// Portable PHP-hosting build. No upload and no database writes.
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const output = path.join(root, '.build', 'hostinger', 'public');
const siteUrl = process.env.SITE_URL || 'https://quiz-hero-stage.matzeverse.de';
const parsedUrl = new URL(siteUrl);
if (parsedUrl.protocol !== 'https:' || parsedUrl.origin !== siteUrl) throw new Error('SITE_URL must be an HTTPS origin without a trailing slash.');
const siteRoot = process.env.HOSTINGER_SITE_ROOT || '/home/u199598707/domains/quiz-hero-stage.matzeverse.de';
if (!/^\/home\/[a-z0-9]+\/domains\/[a-z0-9.-]+$/.test(siteRoot)) throw new Error('Invalid HOSTINGER_SITE_ROOT');
const staging = process.env.DEPLOY_ENVIRONMENT !== 'production';
if (!staging && process.env.ALLOW_PRODUCTION_BUILD !== 'true') throw new Error('Production requires ALLOW_PRODUCTION_BUILD=true');
const run = (script, args = [], env = {}) => {
    const result = spawnSync(process.execPath, [path.join(root, 'scripts', script), ...args], {
        cwd: root, env: { ...process.env, ...env }, stdio: 'inherit'
    });
    if (result.status !== 0) throw new Error(`${script} failed`);
};
run('build-css.js');
run('build-seo-pages.js', [], { SITE_URL: siteUrl, SEO_OUTPUT_DIR: path.join(root, '.build', 'hostinger-seo') });
fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output, { recursive: true });
for (const name of ['index.html', 'login.html', 'account.html', 'styles.css', '.htaccess', '.user.ini', '404.html',
    'admin', 'api', 'content', 'data', 'fonts', 'images', 'js']) {
    fs.cpSync(path.join(root, name), path.join(output, name), {
        recursive: true,
        filter: source => !['config.local.php', 'config.local.example.php', 'config.hostinger.example.php', 'desktop.ini', 'uploads'].includes(path.basename(source))
    });
}
for (const name of ['kategorie', 'sitemap.xml', 'seo-manifest.json']) {
    fs.cpSync(path.join(root, '.build', 'hostinger-seo', name), path.join(output, name), { recursive: true });
}
fs.copyFileSync(path.join(root, '.build', 'hostinger-seo', 'robots.txt'), path.join(output, 'robots.txt'));
if (staging) {
    fs.writeFileSync(path.join(output, 'robots.txt'), 'User-agent: *\nDisallow: /\n');
    fs.appendFileSync(path.join(output, '.htaccess'), `\n<IfModule mod_headers.c>\nHeader always set X-Robots-Tag "noindex, nofollow, noarchive"\n</IfModule>\nAuthType Basic\nAuthName "Quiz-Hero Staging"\nAuthUserFile ${siteRoot}/private/.htpasswd\nRequire valid-user\n`);
}
fs.writeFileSync(path.join(output, 'api', 'config.local.php'), `<?php\ndeclare(strict_types=1);\nreturn require '${siteRoot}/private/config.php';\n`);
fs.writeFileSync(path.join(output, 'required-migrations.json'), JSON.stringify(fs.readdirSync(path.join(root, 'database', 'migrations')).filter(name => name.endsWith('.sql')).sort()));
const configPath = path.join(output, 'js', 'config.js');
if (staging) fs.writeFileSync(configPath, fs.readFileSync(configPath, 'utf8').replace(/googleAnalyticsId:\s*'[^']*'/, "googleAnalyticsId: ''"));
const version = process.env.ASSET_VERSION || `stage-${Date.now()}`;
run('apply-asset-version.js', [version, output]);
run('apply-csp-hashes.js', [output]);
fs.writeFileSync(path.join(output, 'version.json'), JSON.stringify({ version, commit: process.env.GITHUB_SHA || process.env.DEPLOY_COMMIT || null, environment: staging ? 'hostinger-staging' : 'production', siteUrl, builtAt: new Date().toISOString() }, null, 2));
console.log(`Hostinger staging files: ${output}`);
console.log('Database, migrations and credentials are deliberately outside this public artifact.');
