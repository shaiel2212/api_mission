import { DataTypes, Model } from "sequelize";
import { sequelize } from "../db.js";

export class IntegrationConnection extends Model {}

IntegrationConnection.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    provider: {
      type: DataTypes.ENUM("google_analytics", "instagram", "tiktok"),
      allowNull: false,
    },
    accessToken: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    refreshToken: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    tokenExpiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    externalId: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    externalMetadata: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("active", "revoked", "error"),
      allowNull: false,
      defaultValue: "active",
    },
  },
  {
    sequelize,
    underscored: true,
    modelName: "IntegrationConnection",
    tableName: "integration_connections",
    indexes: [{ unique: true, fields: ["provider"] }],
  }
);
