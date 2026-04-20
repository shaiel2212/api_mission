import { IntegrationConnection } from "../models/IntegrationConnection.js";
import { refreshGoogleAccessToken } from "../integrations/googleAnalytics/client.js";
import { refreshTikTokAccessToken } from "../integrations/tiktok/client.js";
import { decryptFromStorage, encryptForStorage } from "../utils/tokenCrypto.js";

function decryptRefresh(row) {
  if (!row?.refreshToken) return null;
  return decryptFromStorage(row.refreshToken);
}

/**
 * @param {"google_analytics"|"instagram"|"tiktok"} provider
 */
export async function getValidAccessToken(provider) {
  const row = await IntegrationConnection.findOne({ where: { provider, status: "active" } });
  if (!row || !row.accessToken) {
    return { connection: row, accessToken: null };
  }

  const accessToken = decryptFromStorage(row.accessToken) || null;
  if (!accessToken) {
    return { connection: row, accessToken: null };
  }

  const expiresAt = row.tokenExpiresAt ? new Date(row.tokenExpiresAt).getTime() : 0;
  const bufferMs = 120 * 1000;
  if (expiresAt && Date.now() < expiresAt - bufferMs) {
    return { connection: row, accessToken };
  }

  if (provider === "google_analytics" && row.refreshToken) {
    const refreshPlain = decryptRefresh(row);
    if (refreshPlain) {
      const refreshed = await refreshGoogleAccessToken(refreshPlain);
      const newExpires = new Date(Date.now() + refreshed.expiresIn * 1000);
      await row.update({
        accessToken: encryptForStorage(refreshed.accessToken),
        tokenExpiresAt: newExpires,
      });
      return { connection: row, accessToken: refreshed.accessToken };
    }
  }

  if (provider === "tiktok" && row.refreshToken) {
    const refreshPlain = decryptRefresh(row);
    if (refreshPlain) {
      const refreshed = await refreshTikTokAccessToken(refreshPlain);
      const newExpires = new Date(Date.now() + refreshed.expiresIn * 1000);
      await row.update({
        accessToken: encryptForStorage(refreshed.accessToken),
        refreshToken: encryptForStorage(refreshed.refreshToken || refreshPlain),
        tokenExpiresAt: newExpires,
      });
      return { connection: row, accessToken: refreshed.accessToken };
    }
  }

  // Instagram long-lived token: no refresh in this MVP; return existing until expiry
  return { connection: row, accessToken };
}
