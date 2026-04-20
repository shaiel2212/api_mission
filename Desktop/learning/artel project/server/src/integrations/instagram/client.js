import { getMarketingEnv } from "../../config/marketingEnv.js";

const FB_GRAPH = "https://graph.facebook.com/v19.0";

/**
 * @param {string} state
 */
export function buildInstagramAuthorizationUrl(state) {
  const env = getMarketingEnv();
  const clientId = env.FACEBOOK_APP_ID;
  const redirectUri = env.FACEBOOK_OAUTH_REDIRECT_URI;
  if (!clientId || !redirectUri) {
    throw new Error("Instagram/Facebook OAuth is not configured (FACEBOOK_APP_ID / FACEBOOK_OAUTH_REDIRECT_URI).");
  }
  const scope = [
    "instagram_basic",
    "instagram_manage_insights",
    "pages_show_list",
    "pages_read_engagement",
    "business_management",
  ].join(",");
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope,
    state,
  });
  return `https://www.facebook.com/v19.0/dialog/oauth?${params.toString()}`;
}

/**
 * @param {string} code
 */
export async function exchangeFacebookCode(code) {
  const env = getMarketingEnv();
  const params = new URLSearchParams({
    client_id: env.FACEBOOK_APP_ID,
    client_secret: env.FACEBOOK_APP_SECRET,
    redirect_uri: env.FACEBOOK_OAUTH_REDIRECT_URI,
    code,
  });
  const res = await fetch(`${FB_GRAPH}/oauth/access_token?${params.toString()}`);
  const json = await res.json();
  if (!res.ok || json.error) {
    throw new Error(json.error?.message || json.error || "Facebook token exchange failed");
  }
  return {
    accessToken: json.access_token,
    expiresIn: Number(json.expires_in || 5184000),
    refreshToken: null,
  };
}

/**
 * Exchange short-lived user token for long-lived (~60 days).
 * @param {string} shortLivedUserToken
 */
export async function exchangeFacebookLongLivedUserToken(shortLivedUserToken) {
  const env = getMarketingEnv();
  const params = new URLSearchParams({
    grant_type: "fb_exchange_token",
    client_id: env.FACEBOOK_APP_ID,
    client_secret: env.FACEBOOK_APP_SECRET,
    fb_exchange_token: shortLivedUserToken,
  });
  const res = await fetch(`${FB_GRAPH}/oauth/access_token?${params.toString()}`);
  const json = await res.json();
  if (!res.ok || json.error) {
    throw new Error(json.error?.message || json.error || "Facebook long-lived exchange failed");
  }
  return {
    accessToken: json.access_token,
    expiresIn: Number(json.expires_in || 0),
  };
}

/**
 * @param {string} userAccessToken long-lived user token
 */
export async function fetchInstagramBusinessAccountId(userAccessToken) {
  const params = new URLSearchParams({
    fields: "instagram_business_account{id,username}",
    access_token: userAccessToken,
  });
  const res = await fetch(`${FB_GRAPH}/me/accounts?${params.toString()}`);
  const json = await res.json();
  if (!res.ok || json.error) {
    throw new Error(json.error?.message || json.error || "Failed to list Facebook pages");
  }
  const pages = json.data || [];
  for (const page of pages) {
    const ig = page.instagram_business_account;
    if (ig?.id) {
      return { igUserId: ig.id, username: ig.username || null, pageId: page.id };
    }
  }
  throw new Error("No Instagram Business account linked to this Facebook user.");
}

/**
 * Daily insights for IG user (last n days aggregated per day requires period=day and since/until or metric breakdown).
 * @param {string} igUserId
 * @param {string} accessToken
 */
export async function fetchInstagramDailyInsights(igUserId, accessToken) {
  const metrics = "impressions,reach,profile_views,website_clicks";
  const params = new URLSearchParams({
    metric: metrics,
    period: "day",
    access_token: accessToken,
  });
  const res = await fetch(`${FB_GRAPH}/${igUserId}/insights?${params.toString()}`);
  const json = await res.json();
  if (!res.ok || json.error) {
    throw new Error(json.error?.message || json.error || "Instagram insights failed");
  }
  return json;
}

export { FB_GRAPH };
