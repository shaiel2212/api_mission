import crypto from "crypto";

export const CSRF_COOKIE_NAME = "artel_csrf";

function secureCookie() {
  return process.env.NODE_ENV === "production";
}

export function csrfCookieOptions() {
  return {
    httpOnly: false,
    sameSite: "lax",
    secure: secureCookie(),
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
}

/**
 * Set double-submit CSRF token cookie (readable by JS for the header).
 * @param {import("express").Response} res
 * @param {string} [token] random token; if omitted, a new one is created
 * @returns {string} token value
 */
export function setCsrfCookie(res, token) {
  const t = token || crypto.randomBytes(32).toString("base64url");
  res.cookie(CSRF_COOKIE_NAME, t, csrfCookieOptions());
  return t;
}

/**
 * Ensure a CSRF cookie exists; if missing, set a new one.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @returns {string} current token
 */
export function ensureCsrfCookie(req, res) {
  const existing = req.cookies?.[CSRF_COOKIE_NAME];
  if (existing && typeof existing === "string" && existing.length >= 8) {
    return existing;
  }
  return setCsrfCookie(res);
}

/**
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 */
export function requireCsrfForMutations(req, res, next) {
  const p = req.path || "";
  if (!p.startsWith("/api/")) {
    return next();
  }
  const method = req.method;
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    return next();
  }
  if (p === "/api/auth/login" && method === "POST") {
    return next();
  }
  if (p === "/api/leads" && method === "POST") {
    return next();
  }
  if (p.startsWith("/api/integrations/") && p.includes("/callback") && method === "GET") {
    return next();
  }
  const expectedKey = process.env.ADMIN_API_KEY;
  if (expectedKey) {
    const h = req.get("x-admin-api-key");
    if (h && h === expectedKey) {
      return next();
    }
  }
  const header = req.get("X-CSRF-Token") || req.get("x-csrf-token");
  const cookie = req.cookies?.[CSRF_COOKIE_NAME];
  if (!header || !cookie || typeof header !== "string" || header !== cookie) {
    return res.status(403).json({
      status: "error",
      code: "CSRF_001",
      message: "Invalid or missing CSRF token.",
    });
  }
  return next();
}
