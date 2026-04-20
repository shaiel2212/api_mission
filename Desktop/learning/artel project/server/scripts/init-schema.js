import "dotenv/config";
import mysql from "mysql2/promise";
import { sequelize } from "../src/db.js";
import { Lead } from "../src/models/Lead.js";
import { Project } from "../src/models/Project.js";
import { LeadEvent } from "../src/models/LeadEvent.js";
import { User } from "../src/models/User.js";
import { IntegrationConnection } from "../src/models/IntegrationConnection.js";
import { MarketingMetricSnapshot } from "../src/models/MarketingMetricSnapshot.js";
import { MarketingAlert } from "../src/models/MarketingAlert.js";
import { AutomationRule } from "../src/models/AutomationRule.js";
import { AutomationExecutionLog } from "../src/models/AutomationExecutionLog.js";

const {
  DB_HOST = "127.0.0.1",
  DB_PORT = "3306",
  DB_NAME = "artel",
  DB_USER = "artel",
  DB_PASSWORD = "artel_dev",
} = process.env;

async function ensureDatabaseExists() {
  const connection = await mysql.createConnection({
    host: DB_HOST,
    port: Number(DB_PORT),
    user: DB_USER,
    password: DB_PASSWORD,
  });

  try {
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
  } finally {
    await connection.end();
  }
}

async function initSchema() {
  try {
    console.log("Ensuring database exists...");
    await ensureDatabaseExists();

    console.log("Connecting with Sequelize...");
    await sequelize.authenticate();

    // Model imports above are intentional so Sequelize registers all tables.
    const alter = process.env.DB_SYNC_ALTER === "true";
    await sequelize.sync({ alter });

    const tableNames = [
      Lead.getTableName(),
      Project.getTableName(),
      LeadEvent.getTableName(),
      User.getTableName(),
      IntegrationConnection.getTableName(),
      MarketingMetricSnapshot.getTableName(),
      MarketingAlert.getTableName(),
      AutomationRule.getTableName(),
      AutomationExecutionLog.getTableName(),
    ]
      .map((name) => (typeof name === "string" ? name : name.tableName))
      .join(", ");

    console.log(`Schema ready. Tables ensured: ${tableNames}`);
    process.exit(0);
  } catch (error) {
    console.error("Failed to initialize schema:", error.message);
    process.exit(1);
  }
}

initSchema();
