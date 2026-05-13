const fs = require('fs');
const path = require('path');
const vm = require('vm');

function loadJsExport(filePath, exportName) {
    const source = fs.readFileSync(filePath, 'utf8');
    const sanitized = source.replace(/export const\s+([A-Za-z0-9_$]+)\s*=/g, 'const $1 =');
    const context = {
        module: { exports: {} },
        exports: {},
        require,
        console,
        process,
        Buffer,
        __dirname: path.dirname(filePath),
        __filename: filePath
    };
    vm.createContext(context);
    const script = new vm.Script(`${sanitized}\nmodule.exports = ${exportName};`, { filename: filePath });
    script.runInContext(context);
    return context.module.exports;
}

function loadSpellData() {
    const dataDir = path.join(__dirname, '..', 'data', 'Spells_data');
    const allSpellsPath = path.join(dataDir, 'allSpells.js');
    const classSpellsPath = path.join(dataDir, 'ClassSpells.js');

    if (!fs.existsSync(allSpellsPath)) {
        throw new Error(`Spell data file not found: ${allSpellsPath}`);
    }
    if (!fs.existsSync(classSpellsPath)) {
        throw new Error(`Class-spell mapping file not found: ${classSpellsPath}`);
    }

    const allSpells = loadJsExport(allSpellsPath, 'allSpells');
    const classSpells = loadJsExport(classSpellsPath, 'classSpells');

    return { allSpells, classSpells };
}

module.exports = { loadSpellData };
