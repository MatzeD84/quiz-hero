const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const stylesDir = path.join(rootDir, 'styles');
const buildScript = path.join(rootDir, 'scripts', 'build-css.js');
const pollIntervalMs = 500;
const debounceMs = 150;

let knownFiles = new Map();
let buildTimer = null;
let buildRunning = false;
let buildQueued = false;

const collectCssFiles = dir => {
    const files = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const entryPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            files.push(...collectCssFiles(entryPath));
            continue;
        }
        if (entry.isFile() && entry.name.endsWith('.css')) {
            files.push(entryPath);
        }
    }
    return files;
};

const snapshot = () => {
    const next = new Map();
    for (const filePath of collectCssFiles(stylesDir)) {
        const stat = fs.statSync(filePath);
        next.set(filePath, `${stat.mtimeMs}:${stat.size}`);
    }
    return next;
};

const hasChanged = next => {
    if (next.size !== knownFiles.size) {
        return true;
    }
    for (const [filePath, signature] of next.entries()) {
        if (knownFiles.get(filePath) !== signature) {
            return true;
        }
    }
    return false;
};

const runBuild = () => {
    if (buildRunning) {
        buildQueued = true;
        return;
    }

    buildRunning = true;
    const child = spawn(process.execPath, [buildScript], {
        cwd: rootDir,
        stdio: 'inherit'
    });

    child.on('exit', code => {
        buildRunning = false;
        if (code !== 0) {
            console.error(`CSS build failed with exit code ${code}.`);
        }
        if (buildQueued) {
            buildQueued = false;
            runBuild();
        }
    });
};

const scheduleBuild = () => {
    clearTimeout(buildTimer);
    buildTimer = setTimeout(runBuild, debounceMs);
};

knownFiles = snapshot();
runBuild();

console.log(`Watching ${path.relative(rootDir, stylesDir)} for CSS changes...`);

setInterval(() => {
    try {
        const next = snapshot();
        if (hasChanged(next)) {
            knownFiles = next;
            scheduleBuild();
        }
    } catch (error) {
        console.error(`CSS watcher error: ${error.message}`);
    }
}, pollIntervalMs);
