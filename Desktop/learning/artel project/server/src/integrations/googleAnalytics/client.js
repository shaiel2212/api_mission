import { getMarketingEnv } from "../../config/marketingEnv.js";

const GOOGLE_AUTH = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN = "https://oauth2.googleapis.com/token";
const GA_DATA_API = "https://analyticsdata.googleapis.com/v1beta";

/**
 * @param {string} state
 */
export function buildGoogleAuthorizationUrl(state) {
  const env = getMarketingEnv();
  const clientId = env.GOOGLE_OAUTH_CLIENT_ID;
  const redirectUri = env.GOOGLE_OAUTH_REDIRECT_URI;
  if (!clientId || !redirectUri) {
    throw new Error("Google OAuth is not configured (GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_REDIRECT_URI).");
  }
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "https://www.googleapis.com/auth/analytics.readonly",
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return `${GOOGLE_AUTH}?${params.toString()}`;
}

/**
 * @param {string} code
 */
export async function exchangeGoogleCode(code) {
  const env = getMarketingEnv();
  const body = new URLSearchParams({
    code,
    client_id: env.GOOGLE_OAUTH_CLIENT_ID,
    client_secret: env.GOOGLE_OAUTH_CLIENT_SECRET,
    redirect_uri: env.GOOGLE_OAUTH_REDIRECT_URI,
    grant_type: "authorization_code",
  });
  const res = await fetch(GOOGLE_TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error_description || json.error || "Google token exchange failed");
  }
  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token || null,
    expiresIn: Number(json.expires_in || 0),
  };
}

/**
 * @param {string} refreshToken
 */
export async function refreshGoogleAccessToken(refreshToken) {
  const env = getMarketingEnv();
  const body = new URLSearchParams({
    client_id: env.GOOGLE_OAUTH_CLIENT_ID,
    client_secret: env.GOOGLE_OAUTH_CLIENT_SECRET,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });
  const res = await fetch(GOOGLE_TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error_description || json.error || "Google refresh failed");
  }
  return {
    accessToken: json.access_token,
    expiresIn: Number(json.expires_in || 0),
  };
}

/**
 * @param {string} propertyResource e.g. properties/123456
 * @param {string} accessToken
 * @param {string} startDate YYYY-MM-DD
 * @param {string} endDate YYYY-MM-DD
 */
export async function runGaDailyReport(propertyResource, accessToken, startDate, endDate) {
  const url = `${GA_DATA_API}/${propertyResource}:runReport`;
  const body = {
    dateRanges: [{ startDate, endDate }],
    dimensions: [{ name: "date" }],
    metrics: [
      { name: "sessions" },
      { name: "totalUsers" },
      { name: "eventCount" },
    ],
  };
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error?.message || JSON.stringify(json.error) || "GA runReport failed");
  }
  return json;
}

export { GOOGLE_AUTH, GOOGLE_TOKEN, GA_DATA_API };
