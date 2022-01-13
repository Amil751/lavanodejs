const { Model, DataTypes } = require("sequelize");
const sequelize = require("./database");
class Auth extends Model {}
Auth.init(
  {
    name: {
      type: DataTypes.STRING,
    },
    surname: {
      type: DataTypes.STRING,
    },
    email: {
      type: DataTypes.STRING,
    },
    password: {
      type: DataTypes.STRING,
    },
  },
  {
    sequelize,
    modelName: "auth",
  }
);
module.exports = Auth;
