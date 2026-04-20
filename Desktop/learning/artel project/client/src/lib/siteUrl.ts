/** בסיס URL ל-production — הגדר VITE_SITE_URL (ללא סלאש בסוף), למשל https://www.example.co.il */
export function getSiteOrigin(): string {
  const raw = import.meta.env.VITE_SITE_URL?.trim();
  if (raw) {
    return raw.replace(/\/$/, "");
  }
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return "";
}

export function absoluteUrl(path: string): string {
  const base = getSiteOrigin();
  const p = path.startsWith("/") ? path : `/${path}`;
  return base ? `${base}${p}` : p;
}
