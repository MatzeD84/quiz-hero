const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const stylesDir = path.join(rootDir, 'styles');
const bemClassPattern = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*(?:__[a-z0-9]+(?:-[a-z0-9]+)*)?(?:--[a-z0-9]+(?:-[a-z0-9]+)*)?$/;
const allowedUtilityPattern = /^u-[a-z][a-z0-9-]*$/;

const listCssFiles = directory => fs.readdirSync(directory, { withFileTypes: true })
    .flatMap(entry => entry.isDirectory()
        ? listCssFiles(path.join(directory, entry.name))
        : entry.name.endsWith('.css') && entry.name !== 'main.css'
            ? [path.join(directory, entry.name)]
            : []);

const findBemViolations = () => {
    const violations = [];
    for (const file of listCssFiles(stylesDir)) {
        const relativeFile = path.relative(rootDir, file).replace(/\\/g, '/');
        const css = fs.readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
        let buffer = '';
        let line = 1;
        let bufferLine = 1;

        for (const character of css) {
            if (character === '\n') line += 1;
            if (character === '{') {
                const selectorPart = buffer.trim();
                if (selectorPart && !selectorPart.startsWith('@')) {
                    if (/(^|[\s>+~,])#[a-z_-]/i.test(selectorPart)) {
                        violations.push(`${relativeFile}:${bufferLine}: ID-Selektor ist nicht erlaubt: ${selectorPart}`);
                    }
                    for (const match of selectorPart.matchAll(/\.(-?[_a-zA-Z]+[_a-zA-Z0-9-]*)/g)) {
                        const className = match[1];
                        if (!bemClassPattern.test(className) && !allowedUtilityPattern.test(className)) {
                            violations.push(`${relativeFile}:${bufferLine}: ungültiger BEM-Klassenname .${className}`);
                        }
                    }
                }
                buffer = '';
                bufferLine = line;
                continue;
            }
            if (character === '}') {
                buffer = '';
                bufferLine = line;
                continue;
            }
            if (!buffer && !/\s/.test(character)) bufferLine = line;
            buffer += character;
        }
    }
    return violations;
};

if (require.main === module) {
    const violations = findBemViolations();
    if (violations.length) {
        console.error(violations.join('\n'));
        process.exitCode = 1;
    } else {
        console.log('BEM-Prüfung erfolgreich.');
    }
}

module.exports = { findBemViolations };
