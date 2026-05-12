const Sequelize = require('sequelize')

const sequelize = new Sequelize('sqlite::memory:')

const User = sequelize.define('user', {
  username: Sequelize.STRING,
  birthday: Sequelize.DATE,
  autorisation: Sequelize.STRING
  })