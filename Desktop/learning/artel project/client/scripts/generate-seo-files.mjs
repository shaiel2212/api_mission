/**
 * קורא VITE_SITE_URL מ-.env ויוצר robots.txt ו-sitemap.xml ב-public/ לפני build.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const envPath = path.join(root, ".env");

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

function readSiteUrl() {
  let base = process.env.VITE_SITE_URL || "https://www.example.com";
  if (fs.existsSync(envPath)) {
    const txt = fs.readFileSync(envPath, "utf8");
    const m = txt.match(/^\s*VITE_SITE_URL\s*=\s*([^#\r\n]+)/m);
    if (m && !process.env.VITE_SITE_URL) {
      base = m[1].trim().replace(/^["']|["']$/g, "").replace(/\/$/, "");
    }
  }
  return base;
}

const siteUrl = readSiteUrl();
const lastmod = new Date().toISOString().slice(0, 10);

const robots = `User-agent: *
Allow: /

Disallow: /admin

Sitemap: ${siteUrl}/sitemap.xml
`;

const urlEntries = PUBLIC_PATHS.map(
  (p) => `  <url>
    <loc>${siteUrl}${p === "/" ? "" : p}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${p === "/" ? "1.0" : "0.8"}</priority>
  </url>`
).join("\n");

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>
`;

fs.writeFileSync(path.join(root, "public", "robots.txt"), robots, "utf8");
fs.writeFileSync(path.join(root, "public", "sitemap.xml"), sitemap, "utf8");
console.log(`[generate-seo-files] siteUrl=${siteUrl} wrote robots.txt + sitemap.xml`);
