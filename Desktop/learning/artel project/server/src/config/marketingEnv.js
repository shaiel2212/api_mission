import Joi from "joi";

const boolFromEnv = Joi.custom((v, helpers) => {
  if (v === undefined || v === null || v === "") {
    return false;
  }
  if (typeof v === "boolean") {
    return v;
  }
  const s = String(v).toLowerCase();
  if (["true", "1", "yes"].includes(s)) {
    return true;
  }
  if (["false", "0", "no"].includes(s)) {
    return false;
  }
  return helpers.error("any.invalid");
}).default(false);

const schema = Joi.object({
  GOOGLE_OAUTH_CLIENT_ID: Joi.string().allow("").optional(),
  GOOGLE_OAUTH_CLIENT_SECRET: Joi.string().allow("").optional(),
  GOOGLE_OAUTH_REDIRECT_URI: Joi.string().uri().allow("").optional(),

  FACEBOOK_APP_ID: Joi.string().allow("").optional(),
  FACEBOOK_APP_SECRET: Joi.string().allow("").optional(),
  FACEBOOK_OAUTH_REDIRECT_URI: Joi.string().uri().allow("").optional(),

  TIKTOK_CLIENT_KEY: Joi.string().allow("").optional(),
  TIKTOK_CLIENT_SECRET: Joi.string().allow("").optional(),
  TIKTOK_OAUTH_REDIRECT_URI: Joi.string().uri().allow("").optional(),

  INTEGRATION_STATE_SECRET: Joi.string().min(8).allow("").optional(),
  INTEGRATION_OAUTH_FRONTEND_REDIRECT: Joi.string()
    .uri()
    .optional()
    .default("http://localhost:5173/admin?tab=marketing"),

  MARKETING_SYNC_CRON_ENABLED: boolFromEnv,
  MARKETING_AUTOMATION_CRON_ENABLED: boolFromEnv,

  AUTOMATION_WEBHOOK_URL: Joi.string().uri().allow("").optional(),
}).unknown(true);

let cached;

/**
 * @returns {Record<string, unknown>}
 */
export function getMarketingEnv() {
  if (cached) {
    return cached;
  }
  const { value, error } = schema.validate(process.env, { stripUnknown: false });
  if (error) {
    console.warn("[marketingEnv] validation warning:", error.message);
  }
  cached = value;
  return value;
}
