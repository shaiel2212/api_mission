/**
 * מופעל אחרי שהשרת (vite preview) כבר רץ — יוצר dist/lighthouse-report.html
 */
import { spawnSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const cli = path.join(root, "node_modules", "lighthouse", "cli", "index.js");
const out = path.join(root, "dist", "lighthouse-report.html");
const url = process.env.LH_URL || "http://127.0.0.1:4173/";

const r = spawnSync(
  process.execPath,
  [
    cli,
    url,
    "--only-categories=performance,accessibility,seo",
    "--output=html",
    `--output-path=${out}`,
    '--chrome-flags=--headless --no-sandbox',
  ],
  { stdio: "inherit", cwd: root }
);
if (r.status !== 0) {
  process.exit(r.status ?? 1);
}
console.log(`[run-lighthouse] נשמר: ${out}`);
