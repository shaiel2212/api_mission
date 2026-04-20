import { Router } from "express";
import Joi from "joi";
import { User } from "../models/User.js";
import { verifyPassword } from "../auth/password.js";
import {
  getSessionMaxAgeMs,
  getSessionSecret,
  SESSION_COOKIE_NAME,
  signSessionToken,
} from "../auth/sessionCookie.js";
import { createTraceId, fail, ok } from "../utils/api.js";
import { resolveSessionUser } from "../middleware/requireAdmin.js";
import { ensureCsrfCookie, setCsrfCookie, CSRF_COOKIE_NAME } from "../middleware/csrf.js";

const router = Router();

const loginSchema = Joi.object({
  email: Joi.string().trim().email().required(),
  password: Joi.string().min(1).max(500).required(),
});

function publicUser(user) {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
  };
}

function sessionCookieOptions() {
  const secure = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure,
    sameSite: "lax",
    maxAge: getSessionMaxAgeMs(),
    path: "/",
  };
}

router.post("/login", async (req, res) => {
  const traceId = createTraceId();
  const secret = getSessionSecret();
  if (!secret || secret.length < 16) {
    return fail(res, 503, "AUTH_003", "Session support is not configured (SESSION_SECRET).", undefined, traceId);
  }

  const { error, value } = loginSchema.validate(req.body || {}, { abortEarly: false, stripUnknown: true });
  if (error) {
    return fail(res, 400, "AUTH_001", "Invalid login payload.", error.details.map((d) => d.message), traceId);
  }

  const email = value.email.toLowerCase();
  try {
    const user = await User.findOne({ where: { email } });
    if (!user || !user.isActive) {
      return fail(res, 401, "AUTH_002", "Invalid email or password.", undefined, traceId);
    }
    if (!verifyPassword(value.password, user.passwordHash)) {
      return fail(res, 401, "AUTH_002", "Invalid email or password.", undefined, traceId);
    }

    await user.update({ lastLoginAt: new Date() });
    const token = signSessionToken(user.id, secret);
    res.cookie(SESSION_COOKIE_NAME, token, sessionCookieOptions());
    setCsrfCookie(res);
    return ok(res, { user: publicUser(user), traceId });
  } catch (e) {
    console.error(`[auth.login.error] traceId=${traceId}`, e?.message || e);
    return fail(res, 500, "AUTH_004", "Login failed.", undefined, traceId);
  }
});

router.post("/logout", (_req, res) => {
  const traceId = createTraceId();
  res.clearCookie(SESSION_COOKIE_NAME, { path: "/", httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production" });
  res.clearCookie(CSRF_COOKIE_NAME, { path: "/", sameSite: "lax", secure: process.env.NODE_ENV === "production" });
  return ok(res, { traceId });
});

router.get("/me", async (req, res) => {
  const traceId = createTraceId();
  try {
    ensureCsrfCookie(req, res);
    const user = await resolveSessionUser(req);
    if (!user) {
      return ok(res, { user: null, traceId });
    }
    if (!user.isActive) {
      return ok(res, { user: null, traceId });
    }
    return ok(res, { user: publicUser(user), traceId });
  } catch (e) {
    console.error(`[auth.me.error] traceId=${traceId}`, e?.message || e);
    return fail(res, 500, "AUTH_005", "Failed to read session.", undefined, traceId);
  }
});

export default router;
