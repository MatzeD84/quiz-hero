const fs = require('fs');
const path = require('path');

const [, , versionArg, targetArg = '.'] = process.argv;
const version = (versionArg || process.env.ASSET_VERSION || '').trim();

if (!version) {
    console.error('Usage: node scripts/apply-asset-version.js <version> [target-dir]');
    process.exit(1);
}

const targetDir = path.resolve(process.cwd(), targetArg);
const files = [
    'index.html',
    'admin/index.html',
    'js/config.js',
];

const pagesDir = path.join(targetDir, 'pages');
if (fs.existsSync(pagesDir)) {
    for (const entry of fs.readdirSync(pagesDir)) {
        if (entry.endsWith('.html')) {
            files.push(`pages/${entry}`);
        }
    }
}

const replaceVersionParams = content => content.replace(
    /(\b(?:href|src)="[^"]+\?v=)[^"]+(")/g,
    `$1${version}$2`
);

const replaceConfigVersion = content => content.replace(
    /export const ASSET_VERSION = ['"][^'"]+['"];/,
    `export const ASSET_VERSION = '${version}';`
);

let updated = 0;
for (const relativePath of files) {
    const filePath = path.join(targetDir, relativePath);
    if (!fs.existsSync(filePath)) {
        continue;
    }

    const original = fs.readFileSync(filePath, 'utf8');
    let next = replaceVersionParams(original);
    if (relativePath === 'js/config.js') {
        next = replaceConfigVersion(next);
    }

    if (next !== original) {
        fs.writeFileSync(filePath, next, 'utf8');
        updated += 1;
    }
}

console.log(`Applied asset version ${version} to ${updated} files in ${path.relative(process.cwd(), targetDir) || '.'}.`);
