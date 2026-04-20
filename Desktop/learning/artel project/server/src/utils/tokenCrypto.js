import crypto from "crypto";

const PREFIX = "enc1:";

/**
 * Key: 32 bytes. Env `TOKENS_ENCRYPTION_KEY` as 64 hex chars, or any string (hashed to 32 bytes).
 * @returns {Buffer | null}
 */
function getKey() {
  const raw = process.env.TOKENS_ENCRYPTION_KEY;
  if (!raw || String(raw).trim() === "") {
    return null;
  }
  const s = String(raw).trim();
  if (/^[0-9a-fA-F]{64}$/.test(s)) {
    return Buffer.from(s, "hex");
  }
  if (s.length === 64 && Buffer.from(s, "hex").length === 32) {
    return Buffer.from(s, "hex");
  }
  return crypto.createHash("sha256").update(s, "utf8").digest();
}

/**
 * @param {string | null | undefined} plain
 * @returns {string | null}
 */
export function encryptForStorage(plain) {
  if (plain == null || plain === "") {
    return plain ?? null;
  }
  const key = getKey();
  if (!key) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("TOKENS_ENCRYPTION_KEY is required in production to store integration tokens.");
    }
    return String(plain);
  }
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(String(plain), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${iv.toString("base64url")}.${tag.toString("base64url")}.${enc.toString("base64url")}`;
}

/**
 * @param {string | null | undefined} stored
 * @returns {string | null}
 */
export function decryptFromStorage(stored) {
  if (stored == null || stored === "") {
    return null;
  }
  const s = String(stored);
  if (!s.startsWith(PREFIX)) {
    return s;
  }
  const key = getKey();
  if (!key) {
    return s;
  }
  const rest = s.slice(PREFIX.length);
  const parts = rest.split(".");
  if (parts.length !== 3) {
    return s;
  }
  const [ivB64, tagB64, dataB64] = parts;
  const iv = Buffer.from(ivB64, "base64url");
  const tag = Buffer.from(tagB64, "base64url");
  const data = Buffer.from(dataB64, "base64url");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}

/**
 * @param {Record<string, unknown>} data
 * @returns {Record<string, unknown>}
 */
export function prepareTokensForStore(data) {
  const out = { ...data };
  if (Object.prototype.hasOwnProperty.call(out, "accessToken")) {
    out.accessToken = out.accessToken != null ? encryptForStorage(/** @type {string} */ (out.accessToken)) : out.accessToken;
  }
  if (Object.prototype.hasOwnProperty.call(out, "refreshToken")) {
    out.refreshToken = out.refreshToken != null ? encryptForStorage(/** @type {string} */ (out.refreshToken)) : out.refreshToken;
  }
  return out;
}
