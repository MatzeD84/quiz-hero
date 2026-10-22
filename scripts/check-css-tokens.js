const fs = require('node:fs');
const path = require('node:path');
const rootDir = path.resolve(__dirname, '..');
const stylesDir = path.join(rootDir, 'styles');
const tokenFiles = new Set(['abstracts/tokens.css', 'themes/app-tokens.css']);
const listCssFiles = directory => fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry =>
    entry.isDirectory() ? listCssFiles(path.join(directory, entry.name))
        : entry.name.endsWith('.css') ? [path.join(directory, entry.name)] : []);
const declarations = css => [...css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/(?:^|[;{])\s*([\w-]+)\s*:\s*([^;{}]+)(?=;)/g)]
    .map(match => ({ property: match[1], value: match[2], offset: match.index }));

function findCssTokenViolations({ files = listCssFiles(stylesDir), readFile = file => fs.readFileSync(file, 'utf8') } = {}) {
    const violations = [];
    const defined = new Set();
    const references = [];
    const effectiveDefinitions = new Map();
    const centralDefinitions = new Set();
    for (const file of files) {
        const name = path.relative(stylesDir, file).replace(/\\/g, '/');
        const css = readFile(file);
        const central = tokenFiles.has(name);
        if (name.startsWith('themes/') && !central) {
            violations.push(`${name}: themes contain only central token definitions; place layout and component rules in their owning modules.`);
        }
        for (const { property, value } of declarations(css)) {
            if (central && property.startsWith('--')) {
                if (centralDefinitions.has(property)) violations.push(`${name}: duplicate central token ${property}; define each token only once.`);
                centralDefinitions.add(property);
                if (name === 'abstracts/tokens.css' && property.startsWith('--color-')) violations.push(`${name}: define the application palette in themes/app-tokens.css.`);
            }
            if (central && !property.startsWith('--')) {
                violations.push(`${name}: token files may only declare custom properties, not ${property}.`);
            }
            if (property.startsWith('--')) { defined.add(property); effectiveDefinitions.set(property, value); }
            for (const match of value.matchAll(/var\(\s*(--[\w-]+)/g)) references.push({ file: name, variable: match[1] });
            if (!central && /#[a-f\d]{3,8}\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklch|oklab|color)\s*\(|\b(?:white|black|red|blue|green|purple|yellow|gr[ae]y)\b/i.test(value.replace(/--[\w-]+/g, ''))) {
                violations.push(`${name}: ${property} contains a color literal; define a semantic token centrally.`);
            }
            if (central || property.startsWith('--')) continue;
            if (property === 'box-shadow' && !/^(var\(|none|inherit|initial|unset)/.test(value.trim())) violations.push(`${name}: use central shadow tokens.`);
            if (property === 'font-size' && /\d+(?:px|rem)\b/.test(value)) violations.push(`${name}: use the shared type scale.`);
            if (property === 'font-family' && !value.includes('var(--font-')) violations.push(`${name}: use the central font family tokens.`);
            if (/^(?:transition|animation)/.test(property) && /\b\d*\.?\d+m?s\b/.test(value)) violations.push(`${name}: use motion tokens.`);
            if (/^(?:border(?:-(?:top|right|bottom|left))?(?:-width)?|outline(?:-width)?)$/.test(property) && /\b[123]px\b/.test(value)) violations.push(`${name}: use the shared border width tokens.`);
        }
    }
    for (const [prefix, limit] of [['--text-', 10], ['--space-', 10], ['--radius-', 5]]) {
        if ([...defined].filter(name => name.startsWith(prefix)).length > limit) violations.push(`Too many ${prefix} tokens; keep the shared scale within ${limit} steps.`);
    }
    for (const { file, variable } of references) if (!defined.has(variable)) violations.push(`${file}: undefined custom property ${variable}.`);
    // Detect cycles in the effective custom property references.
    const visited = new Set();
    const visiting = new Set();
    function visit(variable) {
        if (visiting.has(variable)) { violations.push(`Custom property cycle involving ${variable}.`); return; }
        if (visited.has(variable)) return;
        visiting.add(variable);
        for (const match of (effectiveDefinitions.get(variable) || '').matchAll(/var\(\s*(--[\w-]+)/g)) if (effectiveDefinitions.has(match[1])) visit(match[1]);
        visiting.delete(variable); visited.add(variable);
    }
    for (const variable of effectiveDefinitions.keys()) visit(variable);
    return [...new Set(violations)];
}

if (require.main === module) {
    const violations = findCssTokenViolations();
    if (violations.length) { console.error(violations.join('\n')); process.exitCode = 1; }
    else console.log('CSS token check passed.');
}
module.exports = { findCssTokenViolations };
