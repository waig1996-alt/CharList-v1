const { sequelize, Spell } = require('./models/database');
const { spellSeed } = require('./models/seed-data');

async function seedSpells() {
    await sequelize.authenticate();
    await sequelize.sync();

    const count = await Spell.count();
    if (count > 0) {
        console.log(`Заклинания уже загружены в базе данных (${count} записей).`);
        process.exit(0);
    }

    const records = spellSeed.map(spell => ({
        name: spell.name,
        description: spell.description,
        level: spell.level,
        school: spell.school,
        jsonData: JSON.stringify(spell.jsonData)
    }));

    await Spell.bulkCreate(records);
    console.log(`Загружено заклинаний: ${records.length}`);
    process.exit(0);
}

seedSpells().catch(error => {
    console.error('Ошибка при заполнении базы данных заклинаниями:', error);
    process.exit(1);
});