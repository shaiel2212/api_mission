import { DataTypes, Model } from "sequelize";
import { sequelize } from "../db.js";

export class Lead extends Model {}

Lead.init(
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
    phone: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    normalizedPhone: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("new", "contacted", "qualified", "proposal_sent", "won", "lost"),
      allowNull: false,
      defaultValue: "new",
    },
    statusChangedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    priority: {
      type: DataTypes.ENUM("low", "normal", "high"),
      allowNull: false,
      defaultValue: "normal",
    },
    source: {
      type: DataTypes.STRING(80),
      allowNull: false,
      defaultValue: "website",
    },
    assignedTo: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
    lastContactAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    nextFollowUpAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    qualifiedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    proposalSentAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    wonAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    lostAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    lostReason: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    duplicateGroupId: {
      type: DataTypes.STRING(80),
      allowNull: true,
    },
    isSpamSuspected: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    utmSource: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    utmMedium: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    utmCampaign: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    utmTerm: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    utmContent: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    referrer: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    landingPath: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    firstTouchAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    consentMarketing: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    consentTimestamp: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    consentSource: {
      type: DataTypes.STRING(80),
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "Lead",
    tableName: "leads",
    indexes: [
      { fields: ["phone"] },
      { fields: ["status", "created_at"] },
      { fields: ["assigned_to"] },
      { fields: ["created_at"] },
    ],
  }
);
