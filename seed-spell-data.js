const { sequelize, Spell, ClassSpell } = require('./models/database');
const { loadSpellData } = require('./models/spell-data-loader');

async function seedSpellData() {
    await sequelize.authenticate();
    await sequelize.sync();

    const force = process.argv.includes('--force') || process.argv.includes('-f');
    if (force) {
        await ClassSpell.destroy({ where: {} });
        await Spell.destroy({ where: {} });
        console.log('Forced reset: existing spell data removed.');
    }

    const spellCount = await Spell.count();
    const classSpellCount = await ClassSpell.count();
    if (!force && spellCount > 0 && classSpellCount > 0) {
        console.log(`Spell data already exists in the database (spells: ${spellCount}, class links: ${classSpellCount}).`);
        process.exit(0);
    }

    const { allSpells, classSpells } = loadSpellData();
    let savedSpells;
    let spellIdByName;

    if (spellCount === 0) {
        const spellRecords = allSpells.map((spell) => ({
            name: spell.en?.name || spell.ru?.name || 'Unknown spell',
            description: spell.en?.text || spell.ru?.text || '',
            level: parseInt(spell.en?.level || spell.ru?.level || '0', 10) || 0,
            school: spell.en?.school || spell.ru?.school || '',
            jsonData: JSON.stringify(spell)
        }));

        await Spell.bulkCreate(spellRecords);
        console.log(`Loaded spells: ${spellRecords.length}`);
    }

    savedSpells = await Spell.findAll({ attributes: ['id', 'name'] });
    spellIdByName = new Map(savedSpells.map((row) => [row.name, row.id]));

    let classSpellRecords = [];
    if (classSpellCount === 0) {
        classSpellRecords = [];
        for (const [classKey, cls] of Object.entries(classSpells)) {
            const classNameRu = cls.title?.ru || null;
            const spells = Array.isArray(cls.spells) ? cls.spells : [];
            spells.forEach((spellName) => {
                const spellId = spellIdByName.get(spellName);
                if (!spellId) {
                    console.warn(`Skipped class mapping: spell not found - ${spellName} for class ${classKey}`);
                    return;
                }
                classSpellRecords.push({
                    className: classKey,
                    classNameRu,
                    spellId,
                    spellName
                });
            });
        }

        if (classSpellRecords.length > 0) {
            await ClassSpell.bulkCreate(classSpellRecords);
            console.log(`Loaded class-spell links: ${classSpellRecords.length}`);
        } else {
            console.log('No class-spell links were created; check spell names in the database.');
        }
    }

    process.exit(0);
}

seedSpellData().catch((error) => {
    console.error('Error seeding spell data:', error);
    process.exit(1);
});