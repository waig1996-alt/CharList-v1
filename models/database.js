const fs = require('fs');
const path = require('path');
const { Sequelize, DataTypes, Model } = require('sequelize');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(dataDir, 'database.sqlite'),
    logging: false
});

// ========== ПОЛЬЗОВАТЕЛЬ ==========

class User extends Model {}
User.init({
    login: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, { sequelize, modelName: 'User' });

// ========== ПЕРСОНАЖ ==========

class Character extends Model {}
Character.init({
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'Безымянный'
    },
    sheetData: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: '{}'
    },
    tags: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: '[]'
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: true,  // null = legacy (пока не привязан к пользователю)
        references: { model: User, key: 'id' }
    }
}, { sequelize, modelName: 'Character' });

// Связи
User.hasMany(Character, { foreignKey: 'userId', as: 'characters' });
Character.belongsTo(User, { foreignKey: 'userId', as: 'user' });

class Spell extends Model {}
Spell.init({
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    level: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    school: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: ''
    },
    jsonData: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: '{}'
    }
}, { sequelize, modelName: 'Spell' });

class Race extends Model {}
Race.init({
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    traits: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: '[]'
    },
    jsonData: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: '{}'
    }
}, { sequelize, modelName: 'Race' });

class ClassModel extends Model {}
ClassModel.init({
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    hitDice: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: ''
    },
    jsonData: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: '{}'
    }
}, { sequelize, modelName: 'ClassModel' });

class ClassSpell extends Model {}
ClassSpell.init({
    className: {
        type: DataTypes.STRING,
        allowNull: false
    },
    classNameRu: {
        type: DataTypes.STRING,
        allowNull: true
    },
    spellId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    spellName: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, { sequelize, modelName: 'ClassSpell' });

Spell.hasMany(ClassSpell, { foreignKey: 'spellId', as: 'classLinks' });
ClassSpell.belongsTo(Spell, { foreignKey: 'spellId', as: 'spell' });

module.exports = { sequelize, User, Character, Spell, Race, ClassModel, ClassSpell };
