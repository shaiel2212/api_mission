/**
 * מעתיק את כל שורות הפרויקטים (כולל URLי תמונות) ממסד מקומי ליעד MySQL.
 *
 * שימוש (מתוך תיקיית server):
 *   node scripts/copy-projects-from-local-to-mysql.mjs "mysql://USER:PASS@HOST:PORT/DATABASE"
 *
 * מקור: משתני DB_* מ־.env (או ברירות מחדל כמו ב־db.js).
 * יעד: מחרוזת חיבור MySQL מלאה (כמו MYSQL_PUBLIC_URL מ־Railway).
 *
 * אפשרויות:
 *   --dry-run   רק מדפיס כמה שורות יועתקו בלי לכתוב ליעד
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mysql from "mysql2/promise";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadDotenv() {
  const envPath = path.join(__dirname, "..", ".env");
  if (!fs.existsSync(envPath)) {
    return;
  }
  const txt = fs.readFileSync(envPath, "utf8");
  for (const line of txt.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;
    const key = m[1];
    let val = m[2].trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
    // סקריפט זה מניח שהמקור הוא המסד המקומי מ־server/.env — דורס DB_* מהסביבה
    // (למשל אחרי `railway link` שנשאר באותה סשן טרמינל).
    if (key.startsWith("DB_")) {
      process.env[key] = val;
    } else if (process.env[key] === undefined) {
      process.env[key] = val;
    }
  }
}

function parseArgs(argv) {
  const dryRun = argv.includes("--dry-run");
  const pos = argv.filter((a) => !a.startsWith("--"));
  const targetUrl = pos[0] || process.env.COPY_TARGET_MYSQL_URL;
  return { dryRun, targetUrl };
}

function sourceConfig() {
  return {
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT || "3306"),
    user: process.env.DB_USER || "artel",
    password: process.env.DB_PASSWORD || "artel_dev",
    database: process.env.DB_NAME || "artel",
  };
}

function parseMysqlUrl(urlString) {
  const u = new URL(urlString);
  if (u.protocol !== "mysql:") {
    throw new Error('יעד חייב להתחיל ב-mysql:// (למשל MYSQL_PUBLIC_URL מ-Railway)');
  }
  const database = u.pathname.replace(/^\//, "");
  if (!database) {
    throw new Error("בכתובת היעד חסר שם מסד נתונים (path אחרי ה-host)");
  }
  return {
    host: u.hostname,
    port: Number(u.port || 3306),
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    database,
  };
}

async function main() {
  loadDotenv();
  const { dryRun, targetUrl } = parseArgs(process.argv.slice(2));

  const srcCfg = sourceConfig();
  const source = await mysql.createConnection(srcCfg);
  const [rows] = await source.query(
    "SELECT * FROM `projects` ORDER BY `id` ASC"
  );
  await source.end();

  if (!Array.isArray(rows) || rows.length === 0) {
    console.error("אין פרויקטים במסד המקומי — אין מה להעתיק.");
    process.exit(1);
  }

  console.log(
    `נמצאו ${rows.length} פרויקטים במקור (${srcCfg.user}@${srcCfg.host}/${srcCfg.database})`
  );

  if (dryRun) {
    console.log("dry-run: לא נכתב ליעד.");
    process.exit(0);
  }

  if (!targetUrl) {
    console.error(
      "חסר יעד. דוגמה:\n  node scripts/copy-projects-from-local-to-mysql.mjs \"mysql://root:SECRET@host:PORT/artel_staging\""
    );
    process.exit(1);
  }

  const tgtCfg = parseMysqlUrl(targetUrl);

  const target = await mysql.createConnection(tgtCfg);
  await target.beginTransaction();
  try {
    await target.query("SET FOREIGN_KEY_CHECKS=0");
    await target.query("DELETE FROM `projects`");

    for (const row of rows) {
      const cols = Object.keys(row).filter((k) => k !== "updated_at");
      const placeholders = cols.map(() => "?").join(", ");
      const sql = `INSERT INTO \`projects\` (${cols.map((c) => `\`${c}\``).join(", ")}) VALUES (${placeholders})`;
      const values = cols.map((c) => row[c]);
      await target.query(sql, values);
    }

    const [[{ maxId }]] = await target.query(
      "SELECT COALESCE(MAX(`id`), 0) AS maxId FROM `projects`"
    );
    await target.query(
      `ALTER TABLE \`projects\` AUTO_INCREMENT = ${Number(maxId) + 1}`
    );

    await target.query("SET FOREIGN_KEY_CHECKS=1");
    await target.commit();
    console.log(
      `הועתקו ${rows.length} פרויקטים ליעד (${tgtCfg.user}@${tgtCfg.host}/${tgtCfg.database})`
    );
  } catch (e) {
    await target.rollback();
    console.error("העתקה נכשלה:", e.message);
    process.exit(1);
  } finally {
    await target.end();
  }
}

await main();
