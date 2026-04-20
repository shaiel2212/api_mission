import { DataTypes, Model } from "sequelize";
import { sequelize } from "../db.js";

export class Project extends Model {}

Project.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    category: {
      type: DataTypes.ENUM("renovation", "office", "construction"),
      allowNull: false,
    },
    subtitle: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    year: {
      type: DataTypes.STRING(4),
      allowNull: false,
    },
    location: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    image: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    modalImage: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    beforeImage: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    afterImage: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "",
    },
    featuredOnHome: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    areaLabel: {
      type: DataTypes.STRING(80),
      allowNull: true,
    },
    architect: {
      type: DataTypes.STRING(120),
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "Project",
    tableName: "projects",
    indexes: [
      { fields: ["category"] },
      { fields: ["featured_on_home", "year"] },
    ],
  }
);
