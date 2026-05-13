const Sequelize = require('sequelize')

const sequelize = new Sequelize('sqlite::memory:')

const User = sequelize.define('user', {
    id: {
        type: DataTypes.UUID,
        defaultValue: Sequelize.UUIDV4
    },
    username: Sequelize.STRING,
    birthday: Sequelize.DATE,
    autorisation: Sequelize.STRING
})