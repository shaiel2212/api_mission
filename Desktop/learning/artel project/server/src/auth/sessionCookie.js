import crypto from "crypto";

export const SESSION_COOKIE_NAME = "artel_session";

export function getSessionSecret() {
  return process.env.SESSION_SECRET || "";
}

export function getSessionMaxAgeMs() {
  const raw = Number(process.env.SESSION_MAX_AGE_MS || 7 * 24 * 60 * 60 * 1000);
  if (!Number.isFinite(raw) || raw < 60_000) {
    return 7 * 24 * 60 * 60 * 1000;
  }
  return raw;
}

/**
 * @param {number} userId
 * @param {string} secret
 * @returns {string}
 */
export function signSessionToken(userId, secret) {
  const exp = Date.now() + getSessionMaxAgeMs();
  const payload = JSON.stringify({ sub: userId, exp });
  const b64 = Buffer.from(payload, "utf8").toString("base64url");
  const sig = crypto.createHmac("sha256", secret).update(b64).digest("base64url");
  return `${b64}.${sig}`;
}

/**
 * @param {string} token
 * @param {string} secret
 * @returns {{ sub: number, exp: number } | null}
 */
export function verifySessionToken(token, secret) {
  if (!token || !secret) {
    return null;
  }
  const dot = token.indexOf(".");
  if (dot <= 0 || dot === token.length - 1) {
    return null;
  }
  const b64 = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expectedSig = crypto.createHmac("sha256", secret).update(b64).digest("base64url");
  const sigBuf = Buffer.from(sig, "utf8");
  const expBuf = Buffer.from(expectedSig, "utf8");
  if (sigBuf.length !== expBuf.length) {
    return null;
  }
  if (!crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }
  let parsed;
  try {
    parsed = JSON.parse(Buffer.from(b64, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (!parsed || typeof parsed.sub !== "number" || typeof parsed.exp !== "number") {
    return null;
  }
  if (parsed.exp < Date.now()) {
    return null;
  }
  return parsed;
}
