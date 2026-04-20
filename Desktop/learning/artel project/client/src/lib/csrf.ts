const CSRF_NAME = "artel_csrf=";

/**
 * Value of double-submit CSRF cookie (set by `GET /api/auth/me` or `POST /api/auth/login`).
 */
export function getCsrfTokenFromCookie(): string {
  if (typeof document === "undefined") {
    return "";
  }
  const raw = document.cookie.split(";").map((s) => s.trim());
  for (const part of raw) {
    if (part.startsWith(CSRF_NAME)) {
      return decodeURIComponent(part.slice(CSRF_NAME.length));
    }
  }
  return "";
}

export function buildCsrfHeaders(): HeadersInit {
  const t = getCsrfTokenFromCookie();
  if (!t) {
    return {};
  }
  return { "X-CSRF-Token": t };
}
