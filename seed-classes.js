const { sequelize, ClassModel } = require('./models/database');
const { classSeed } = require('./models/seed-data');

async function seedClasses() {
    await sequelize.authenticate();
    await sequelize.sync();

    const count = await ClassModel.count();
    if (count > 0) {
        console.log(`Классы уже загружены в базе данных (${count} записей).`);
        process.exit(0);
    }

    const records = classSeed.map(cls => ({
        name: cls.name,
        description: cls.description,
        hitDice: cls.hitDice,
        jsonData: JSON.stringify(cls.jsonData)
    }));

    await ClassModel.bulkCreate(records);
    console.log(`Загружено классов: ${records.length}`);
    process.exit(0);
}

seedClasses().catch(error => {
    console.error('Ошибка при заполнении базы данных классами:', error);
    process.exit(1);
});