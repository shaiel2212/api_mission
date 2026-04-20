import { DataTypes, Model } from "sequelize";
import { sequelize } from "../db.js";

export class AutomationExecutionLog extends Model {}

AutomationExecutionLog.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    ruleId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("success", "failure", "skipped"),
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    startedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    finishedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    underscored: true,
    modelName: "AutomationExecutionLog",
    tableName: "automation_execution_logs",
    indexes: [{ fields: ["rule_id"] }, { fields: ["started_at"] }],
  }
);
