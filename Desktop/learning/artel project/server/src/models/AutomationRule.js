import { DataTypes, Model } from "sequelize";
import { sequelize } from "../db.js";

export class AutomationRule extends Model {}

AutomationRule.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    enabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    conditionsJson: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    actionsJson: {
      type: DataTypes.JSON,
      allowNull: false,
    },
  },
  {
    sequelize,
    underscored: true,
    modelName: "AutomationRule",
    tableName: "automation_rules",
    indexes: [{ fields: ["enabled"] }],
  }
);
