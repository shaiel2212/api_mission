import { Sequelize } from "sequelize";
import "dotenv/config";

const {
  DB_HOST = "127.0.0.1",
  DB_PORT = "3306",
  DB_NAME = "artel",
  DB_USER = "artel",
  DB_PASSWORD = "artel_dev",
} = process.env;

export const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  port: Number(DB_PORT),
  dialect: "mysql",
  logging: false,
  define: {
    underscored: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  },
});
