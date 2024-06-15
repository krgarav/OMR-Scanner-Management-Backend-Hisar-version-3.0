const Sequelize = require("sequelize");

const sequelize = require("../../utils/database");

const Templete = sequelize.define("templetes", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  TempleteType: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  pageCount: {
    type: Sequelize.INTEGER,
  },
  typeOption: {
    type: Sequelize.STRING,
  },
  // rollNumberRange: {
  //   type: Sequelize.STRING,
  //   defaultValue: null,
  // },
});

module.exports = Templete;
