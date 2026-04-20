/**
 * Fails fast in production for secrets that must be set.
 */
export function assertRequiredProductionEnv() {
  if (process.env.NODE_ENV !== "production") {
    return;
  }
  const issues = [];
  if (!process.env.SESSION_SECRET || String(process.env.SESSION_SECRET).length < 16) {
    issues.push("SESSION_SECRET must be at least 16 characters in production.");
  }
  if (!process.env.INTEGRATION_STATE_SECRET || String(process.env.INTEGRATION_STATE_SECRET).length < 16) {
    issues.push("INTEGRATION_STATE_SECRET must be at least 16 characters in production (OAuth state).");
  }
  if (!process.env.TOKENS_ENCRYPTION_KEY || String(process.env.TOKENS_ENCRYPTION_KEY).trim() === "") {
    issues.push("TOKENS_ENCRYPTION_KEY is required in production (integration token encryption).");
  }
  if (issues.length) {
    console.error("[artel] Production environment misconfiguration:\n", issues.join("\n"));
    process.exit(1);
  }
}
