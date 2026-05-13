const { sequelize, Race } = require('./models/database');
const { raceSeed } = require('./models/seed-data');

async function seedRaces() {
    await sequelize.authenticate();
    await sequelize.sync();

    const count = await Race.count();
    if (count > 0) {
        console.log(`Расы уже загружены в базе данных (${count} записей).`);
        process.exit(0);
    }

    const records = raceSeed.map(race => ({
        name: race.name,
        description: race.description,
        traits: JSON.stringify(race.traits),
        jsonData: JSON.stringify(race.jsonData)
    }));

    await Race.bulkCreate(records);
    console.log(`Загружено рас: ${records.length}`);
    process.exit(0);
}

seedRaces().catch(error => {
    console.error('Ошибка при заполнении базы данных рас:', error);
    process.exit(1);
});
