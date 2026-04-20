import { getMarketingEnv } from "../../config/marketingEnv.js";

const TIKTOK_AUTH = "https://www.tiktok.com/v2/auth/authorize/";
const TIKTOK_TOKEN = "https://open.tiktokapis.com/v2/oauth/token/";

/**
 * @param {string} state
 */
export function buildTikTokAuthorizationUrl(state) {
  const env = getMarketingEnv();
  const clientKey = env.TIKTOK_CLIENT_KEY;
  const redirectUri = env.TIKTOK_OAUTH_REDIRECT_URI;
  if (!clientKey || !redirectUri) {
    throw new Error("TikTok OAuth is not configured (TIKTOK_CLIENT_KEY / TIKTOK_OAUTH_REDIRECT_URI).");
  }
  const scope = "user.info.basic,reporting.advertiser";
  const params = new URLSearchParams({
    client_key: clientKey,
    response_type: "code",
    scope,
    redirect_uri: redirectUri,
    state,
  });
  return `${TIKTOK_AUTH}?${params.toString()}`;
}

/**
 * @param {string} code
 */
export async function exchangeTikTokCode(code) {
  const env = getMarketingEnv();
  const body = {
    client_key: env.TIKTOK_CLIENT_KEY,
    client_secret: env.TIKTOK_CLIENT_SECRET,
    code,
    grant_type: "authorization_code",
    redirect_uri: env.TIKTOK_OAUTH_REDIRECT_URI,
  };
  const res = await fetch(TIKTOK_TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok || json.error || json.message === "error") {
    const msg = json.error_description || json.error || json.message || "TikTok token exchange failed";
    throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
  }
  const data = json.data || json;
  const access = data.access_token || data.accessToken;
  const refresh = data.refresh_token || data.refreshToken;
  const expiresIn = Number(data.expires_in || data.expiresIn || 86400);
  return { accessToken: access, refreshToken: refresh || null, expiresIn };
}

/**
 * @param {string} refreshToken
 */
export async function refreshTikTokAccessToken(refreshToken) {
  const env = getMarketingEnv();
  const body = {
    client_key: env.TIKTOK_CLIENT_KEY,
    client_secret: env.TIKTOK_CLIENT_SECRET,
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  };
  const res = await fetch(TIKTOK_TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok || json.error) {
    throw new Error(json.error_description || json.error || "TikTok refresh failed");
  }
  const data = json.data || json;
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || refreshToken,
    expiresIn: Number(data.expires_in || 86400),
  };
}

/**
 * Placeholder: TikTok Ads reporting varies by API version. Returns empty metrics structure on failure so sync can continue.
 * @param {string} _advertiserId
 * @param {string} _accessToken
 * @param {string} _startDate
 * @param {string} _endDate
 */
export async function fetchTikTokIntegratedReport(_advertiserId, _accessToken, _startDate, _endDate) {
  // TikTok Marketing API integrated reports require additional endpoints and permissions.
  // Implementers should extend this to call https://business-api.tiktok.com/open_api/v1.3/report/integrated/get/
  return { rows: [] };
}

export { TIKTOK_AUTH, TIKTOK_TOKEN };
