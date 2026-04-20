import { DataTypes, Model } from "sequelize";
import { sequelize } from "../db.js";

export class MarketingMetricSnapshot extends Model {}

MarketingMetricSnapshot.init(
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
    snapshotDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    campaignKey: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: null,
    },
    impressions: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: 0,
    },
    reach: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: 0,
    },
    clicks: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: 0,
    },
    sessions: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: 0,
    },
    conversions: {
      type: DataTypes.DECIMAL(14, 4),
      allowNull: false,
      defaultValue: 0,
    },
    spend: {
      type: DataTypes.DECIMAL(14, 4),
      allowNull: false,
      defaultValue: 0,
    },
    ctr: {
      type: DataTypes.DECIMAL(10, 6),
      allowNull: true,
    },
    cpc: {
      type: DataTypes.DECIMAL(14, 4),
      allowNull: true,
    },
    cvr: {
      type: DataTypes.DECIMAL(10, 6),
      allowNull: true,
    },
    rawPayload: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  },
  {
    sequelize,
    underscored: true,
    modelName: "MarketingMetricSnapshot",
    tableName: "marketing_metric_snapshots",
    indexes: [
      { unique: true, fields: ["provider", "snapshot_date", "campaign_key"] },
      { fields: ["snapshot_date"] },
    ],
  }
);
