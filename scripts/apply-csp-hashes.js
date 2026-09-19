const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const HASH_MARKER = '# Inline script hashes are added to the deploy copy by scripts/apply-csp-hashes.js.';

const walkHtmlFiles = directory => {
    const files = [];
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const fullPath = path.join(directory, entry.name);
        if (entry.isDirectory()) files.push(...walkHtmlFiles(fullPath));
        else if (entry.isFile() && entry.name.endsWith('.html')) files.push(fullPath);
    }
    return files;
};

const collectInlineScriptHashes = directory => {
    const hashes = new Set();
    for (const file of walkHtmlFiles(directory)) {
        const html = fs.readFileSync(file, 'utf8');
        const pattern = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
        let match;
        while ((match = pattern.exec(html)) !== null) {
            if (/\bsrc\s*=/i.test(match[1]) || match[2] === '') continue;
            const digest = crypto.createHash('sha256').update(match[2], 'utf8').digest('base64');
            hashes.add(`'sha256-${digest}'`);
        }
    }
    return [...hashes].sort();
};

const applyCspHashes = directory => {
    const configPath = path.join(directory, '.htaccess');
    if (!fs.existsSync(configPath)) throw new Error(`Fehlende .htaccess in ${directory}`);

    const hashes = collectInlineScriptHashes(directory);
    if (hashes.length === 0) throw new Error('Keine Inline-Skripte für CSP-Hashes gefunden.');

    const original = fs.readFileSync(configPath, 'utf8');
    if (!original.includes(HASH_MARKER)) throw new Error('CSP-Hash-Markierung fehlt in .htaccess.');
    if (/Content-Security-Policy-Report-Only[^\r\n]*'sha256-/i.test(original)) {
        throw new Error('Die CSP enthält vor dem Build bereits Inline-Hashes.');
    }

    const needle = "script-src 'self' https://www.googletagmanager.com";
    if (!original.includes(needle)) throw new Error('script-src der Report-Only-CSP wurde nicht gefunden.');
    const next = original.replace(needle, `${needle} ${hashes.join(' ')}`);
    fs.writeFileSync(configPath, next, 'utf8');
    return hashes;
};

if (require.main === module) {
    const target = path.resolve(process.cwd(), process.argv[2] || 'deploy');
    const hashes = applyCspHashes(target);
    console.log(`CSP um ${hashes.length} Inline-Script-Hashes ergänzt.`);
}

module.exports = { HASH_MARKER, collectInlineScriptHashes, applyCspHashes };
