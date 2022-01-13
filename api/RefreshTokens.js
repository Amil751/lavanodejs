const { Model, DataTypes } = require("sequelize");
const sequelize = require("./database");
class RefreshTokens extends Model {}
RefreshTokens.init(
  {
    email: {
        type: DataTypes.STRING,
      },
    refreshToken: {
      type: DataTypes.STRING,
    },
  },
  {
    sequelize,
    modelName: "refreshtoken",
  }
);
module.exports = RefreshTokens;
