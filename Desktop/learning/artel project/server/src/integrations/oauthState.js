import crypto from "crypto";
import { getMarketingEnv } from "../config/marketingEnv.js";

function getSecret() {
  const env = getMarketingEnv();
  const s = env.INTEGRATION_STATE_SECRET;
  if (s && String(s).length >= 8) {
    return crypto.createHash("sha256").update(String(s), "utf8").digest();
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("INTEGRATION_STATE_SECRET is required in production for OAuth state (min 8 chars in .env).");
  }
  if (process.env.ADMIN_API_KEY && String(process.env.ADMIN_API_KEY).length >= 8) {
    return crypto.createHash("sha256").update(String(process.env.ADMIN_API_KEY), "utf8").digest();
  }
  return crypto.createHash("sha256").update("artel-dev-oauth-state-salt", "utf8").digest();
}

/**
 * @param {Record<string, unknown>} payload
 */
export function signOAuthState(payload) {
  const body = Buffer.from(JSON.stringify({ ...payload, iat: Date.now() }), "utf8").toString("base64url");
  const sig = crypto.createHmac("sha256", getSecret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

/**
 * @returns {Record<string, unknown> | null}
 */
export function verifyOAuthState(token) {
  if (!token || typeof token !== "string") {
    return null;
  }
  const parts = token.split(".");
  if (parts.length !== 2) {
    return null;
  }
  const [body, sig] = parts;
  const expected = crypto.createHmac("sha256", getSecret()).update(body).digest("base64url");
  try {
    if (!crypto.timingSafeEqual(Buffer.from(String(sig), "utf8"), Buffer.from(String(expected), "utf8"))) {
      return null;
    }
  } catch {
    return null;
  }
  try {
    const json = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (Date.now() - (json.iat || 0) > 15 * 60 * 1000) {
      return null;
    }
    return json;
  } catch {
    return null;
  }
}
