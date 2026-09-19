const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const manifestPath = path.join(rootDir, 'styles', 'main.css');
const outputPath = path.join(rootDir, 'styles.css');

const readManifestImports = manifest => {
    const importPattern = /@import\s+['"](.+?)['"]\s*;/g;
    const imports = [];
    let match;
    while ((match = importPattern.exec(manifest)) !== null) {
        imports.push(match[1]);
    }
    return imports;
};

const manifest = fs.readFileSync(manifestPath, 'utf8');
const imports = readManifestImports(manifest);

if (imports.length === 0) {
    throw new Error('styles/main.css enthaelt keine @import-Regeln.');
}

const output = [
    '/*',
    ' * Generated from styles/main.css.',
    ' * Edit files in styles/, then run: node scripts/build-css.js',
    ' */',
    ''
];

for (const importPath of imports) {
    const sourcePath = path.resolve(path.dirname(manifestPath), importPath);
    const relativePath = path.relative(rootDir, sourcePath).replace(/\\/g, '/');
    const css = fs.readFileSync(sourcePath, 'utf8').replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/[ \t]+$/gm, '').trimEnd();
    output.push(`/* === ${relativePath} === */`);
    output.push(css);
    output.push('');
}

fs.writeFileSync(outputPath, `${output.join('\n').trimEnd()}\n`, 'utf8');
console.log(`Built ${path.relative(rootDir, outputPath)} from ${imports.length} source files.`);
