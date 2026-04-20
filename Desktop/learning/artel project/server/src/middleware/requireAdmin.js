import { createTraceId, fail } from "../utils/api.js";
import { User } from "../models/User.js";
import { getSessionSecret, SESSION_COOKIE_NAME, verifySessionToken } from "../auth/sessionCookie.js";

/**
 * Legacy static admin API key (server-to-server or tooling).
 */
export function requireAdminApiKey(req, res, next) {
  const expected = process.env.ADMIN_API_KEY;
  if (!expected) {
    return fail(res, 503, "ADMIN_003", "Admin API is disabled.", undefined, createTraceId());
  }

  const token = req.get("x-admin-api-key");
  if (token !== expected) {
    return fail(res, 401, "ADMIN_001", "Unauthorized admin request.", undefined, createTraceId());
  }

  return next();
}

export function isValidAdminApiKey(req) {
  const expected = process.env.ADMIN_API_KEY;
  if (!expected) {
    return false;
  }
  const token = req.get("x-admin-api-key");
  return token === expected;
}

/**
 * Resolves logged-in user from httpOnly session cookie (no API key).
 * @param {import("express").Request} req
 */
export async function resolveSessionUser(req) {
  const secret = getSessionSecret();
  if (!secret) {
    return null;
  }
  const raw = req.cookies?.[SESSION_COOKIE_NAME];
  if (!raw || typeof raw !== "string") {
    return null;
  }
  const claims = verifySessionToken(raw, secret);
  if (!claims) {
    return null;
  }
  const user = await User.findByPk(claims.sub);
  return user;
}

/**
 * API key OR any active user session (admin, manager, agent).
 */
export async function requireAdminAccess(req, res, next) {
  const traceId = createTraceId();
  try {
    if (isValidAdminApiKey(req)) {
      req.adminPrincipal = { kind: "api" };
      return next();
    }
    const user = await resolveSessionUser(req);
    if (user && user.isActive) {
      req.adminPrincipal = { kind: "user", user };
      return next();
    }
    return fail(res, 401, "ADMIN_001", "Unauthorized admin request.", undefined, traceId);
  } catch (e) {
    console.error("[requireAdminAccess]", e?.message || e);
    return fail(res, 500, "ADMIN_005", "Auth check failed.", undefined, traceId);
  }
}

/**
 * API key OR active session with role admin or manager (projects, marketing, integrations UI).
 */
export async function requireCmsManager(req, res, next) {
  const traceId = createTraceId();
  try {
    if (isValidAdminApiKey(req)) {
      req.adminPrincipal = { kind: "api" };
      return next();
    }
    const user = await resolveSessionUser(req);
    if (user && user.isActive && (user.role === "admin" || user.role === "manager")) {
      req.adminPrincipal = { kind: "user", user };
      return next();
    }
    if (user && user.isActive) {
      return fail(res, 403, "ADMIN_004", "Insufficient permissions for this action.", undefined, traceId);
    }
    return fail(res, 401, "ADMIN_001", "Unauthorized admin request.", undefined, traceId);
  } catch (e) {
    console.error("[requireCmsManager]", e?.message || e);
    return fail(res, 500, "ADMIN_005", "Auth check failed.", undefined, traceId);
  }
}
