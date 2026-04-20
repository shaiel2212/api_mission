import { DataTypes, Model } from "sequelize";
import { sequelize } from "../db.js";

export class LeadEvent extends Model {}

LeadEvent.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    leadId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    eventType: {
      type: DataTypes.ENUM(
        "created",
        "status_changed",
        "note_added",
        "call_attempted",
        "whatsapp_sent",
        "duplicate_detected",
        "assigned"
      ),
      allowNull: false,
    },
    payloadJson: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    createdBy: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "LeadEvent",
    tableName: "lead_events",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
    indexes: [{ fields: ["lead_id", "created_at"] }],
  }
);
