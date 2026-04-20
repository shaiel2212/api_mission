import crypto from "crypto";

/**
 * Verifies a plain password against the hash format produced in scripts/seed-data.js:
 * pbkdf2$100000$<salt_hex>$<digest_hex>
 */
export function verifyPassword(plain, stored) {
  if (!plain || !stored || typeof stored !== "string") {
    return false;
  }
  const parts = stored.split("$");
  if (parts.length !== 4 || parts[0] !== "pbkdf2" || parts[1] !== "100000") {
    return false;
  }
  const [, , saltHex, digestHex] = parts;
  if (!saltHex || !digestHex) {
    return false;
  }
  let expected;
  try {
    expected = Buffer.from(digestHex, "hex");
  } catch {
    return false;
  }
  if (expected.length === 0) {
    return false;
  }
  const derived = crypto.pbkdf2Sync(String(plain), saltHex, 100000, 64, "sha512");
  if (derived.length !== expected.length) {
    return false;
  }
  return crypto.timingSafeEqual(derived, expected);
}
