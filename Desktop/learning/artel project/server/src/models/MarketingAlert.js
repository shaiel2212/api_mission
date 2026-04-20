import { DataTypes, Model } from "sequelize";
import { sequelize } from "../db.js";

export class MarketingAlert extends Model {}

MarketingAlert.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    alertType: {
      type: DataTypes.STRING(80),
      allowNull: false,
    },
    severity: {
      type: DataTypes.ENUM("info", "warning", "critical"),
      allowNull: false,
      defaultValue: "warning",
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    recommendation: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    dismissedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    underscored: true,
    modelName: "MarketingAlert",
    tableName: "marketing_alerts",
    indexes: [{ fields: ["dismissed_at"] }, { fields: ["created_at"] }],
  }
);
