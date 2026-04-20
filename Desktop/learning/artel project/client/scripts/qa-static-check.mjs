/**
 * אימותים סטטיים אחרי `npm run build` — robots, sitemap, נכסים ב-dist.
 * יציאה עם קוד 1 אם נכשל.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const dist = path.join(root, "dist");

const errors = [];

function assert(cond, msg) {
  if (!cond) {
    errors.push(msg);
  }
}

function read(p) {
  return fs.readFileSync(p, "utf8");
}

assert(fs.existsSync(path.join(dist, "index.html")), "חסר dist/index.html");
if (fs.existsSync(path.join(dist, "index.html"))) {
  const idx = read(path.join(dist, "index.html"));
  assert(
    /fonts\.googleapis\.com.*subset=hebrew/i.test(idx) || /subset=hebrew/.test(idx),
    "index.html: צפוי קישור גופנים עם subset (ביצועים)"
  );
}
assert(fs.existsSync(path.join(dist, "robots.txt")), "חסר dist/robots.txt");
assert(fs.existsSync(path.join(dist, "sitemap.xml")), "חסר dist/sitemap.xml");
assert(fs.existsSync(path.join(dist, "og-default.svg")), "חסר dist/og-default.svg");

const PUBLIC_PATHS = [
  "/",
  "/about",
  "/projects",
  "/clients",
  "/testimonials",
  "/contact",
  "/privacy",
  "/terms",
  "/accessibility",
];

if (fs.existsSync(path.join(dist, "robots.txt"))) {
  const robots = read(path.join(dist, "robots.txt"));
  assert(/Disallow:\s*\/admin/i.test(robots), "robots.txt: חסר Disallow: /admin");
  assert(/Sitemap:\s*https?:\/\//i.test(robots), "robots.txt: חסר שורת Sitemap עם URL מלא");
}

if (fs.existsSync(path.join(dist, "sitemap.xml"))) {
  const sm = read(path.join(dist, "sitemap.xml"));
  for (const p of PUBLIC_PATHS) {
    if (p === "/") {
      assert(/<loc>https?:\/\/[^<]+<\/loc>/.test(sm), "sitemap.xml: חסר <loc> לדף הבית");
    } else {
      assert(sm.includes(`${p}</loc>`), `sitemap.xml: חסר נתיב ${p}`);
    }
  }
}

const assetsDir = path.join(dist, "assets");
if (fs.existsSync(assetsDir)) {
  const files = fs.readdirSync(assetsDir);
  assert(
    files.some((f) => f.startsWith("react-vendor") && f.endsWith(".js")),
    "dist/assets: חסר chunk react-vendor*.js (פיצול bundle)"
  );
}

if (errors.length) {
  console.error("[qa-static-check] נכשל:\n", errors.map((e) => `  - ${e}`).join("\n"));
  process.exit(1);
}

console.log("[qa-static-check] עבר בהצלחה — dist, robots, sitemap, og-default, react-vendor chunk");
