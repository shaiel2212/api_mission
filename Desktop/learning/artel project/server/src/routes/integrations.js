import { Router } from "express";
import Joi from "joi";
import { createTraceId, fail, ok } from "../utils/api.js";
import { requireCmsManager } from "../middleware/requireAdmin.js";
import { attachAsyncMw } from "../middleware/asyncHandler.js";
import { signOAuthState, verifyOAuthState } from "../integrations/oauthState.js";
import { IntegrationConnection } from "../models/IntegrationConnection.js";
import { getMarketingEnv } from "../config/marketingEnv.js";
import {
  buildGoogleAuthorizationUrl,
  exchangeGoogleCode,
} from "../integrations/googleAnalytics/client.js";
import {
  buildInstagramAuthorizationUrl,
  exchangeFacebookCode,
  exchangeFacebookLongLivedUserToken,
  fetchInstagramBusinessAccountId,
} from "../integrations/instagram/client.js";
import { buildTikTokAuthorizationUrl, exchangeTikTokCode } from "../integrations/tiktok/client.js";
import { prepareTokensForStore } from "../utils/tokenCrypto.js";

const router = Router();

async function saveOrUpdateConnection(provider, data) {
  const toSave = /** @type {Record<string, unknown>} */ (prepareTokensForStore(data));
  const row = await IntegrationConnection.findOne({ where: { provider } });
  if (row) {
    await row.update(toSave);
    return row;
  }
  return IntegrationConnection.create({ provider, ...toSave });
}

const providerSchema = Joi.string().valid("google_analytics", "instagram", "tiktok").required();

const configPatchSchema = Joi.object({
  externalId: Joi.string().trim().max(255).allow(null, "").optional(),
  externalMetadata: Joi.object().unknown(true).allow(null).optional(),
}).min(1);

function redirectFrontend(res, query) {
  const base = getMarketingEnv().INTEGRATION_OAUTH_FRONTEND_REDIRECT;
  const url = new URL(base);
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== null) {
      url.searchParams.set(k, String(v));
    }
  }
  return res.redirect(302, url.toString());
}

// Register static paths before `/:provider/...` to avoid any router ambiguity.
router.get("/status", attachAsyncMw(requireCmsManager), async (_req, res) => {
  const traceId = createTraceId();
  try {
    const rows = await IntegrationConnection.findAll();
    const sanitized = rows.map((r) => ({
      provider: r.provider,
      status: r.status,
      externalId: r.externalId,
      externalMetadata: r.externalMetadata,
      tokenExpiresAt: r.tokenExpiresAt,
      connectedAt: r.createdAt,
    }));
    return ok(res, { connections: sanitized, traceId });
  } catch (e) {
    return fail(res, 500, "INT_007", e.message || "Failed to read status.", undefined, traceId);
  }
});

router.post("/:provider/connect", attachAsyncMw(requireCmsManager), async (req, res) => {
  const traceId = createTraceId();
  try {
    const { error, value } = providerSchema.validate(req.params.provider);
    if (error) {
      return fail(res, 400, "INT_001", "Invalid provider.", undefined, traceId);
    }
    const provider = value;
    const state = signOAuthState({ provider, n: createTraceId() });
    let authorizeUrl;
    if (provider === "google_analytics") {
      authorizeUrl = buildGoogleAuthorizationUrl(state);
    } else if (provider === "instagram") {
      authorizeUrl = buildInstagramAuthorizationUrl(state);
    } else {
      authorizeUrl = buildTikTokAuthorizationUrl(state);
    }
    return ok(res, { authorizeUrl, state, traceId });
  } catch (e) {
    return fail(res, 500, "INT_002", e.message || "Failed to build authorize URL.", undefined, traceId);
  }
});

router.get("/:provider/callback", async (req, res) => {
  const traceId = createTraceId();
  try {
    const { error, value: provider } = providerSchema.validate(req.params.provider);
    if (error) {
      return redirectFrontend(res, { integration: "error", code: "INT_001", traceId });
    }
    const code = req.query.code;
    const state = req.query.state;
    if (!code || !state) {
      return redirectFrontend(res, { integration: "error", code: "INT_003", traceId });
    }
    const payload = verifyOAuthState(String(state));
    if (!payload || payload.provider !== provider) {
      return redirectFrontend(res, { integration: "error", code: "INT_004", traceId });
    }

    if (provider === "google_analytics") {
      const tokens = await exchangeGoogleCode(String(code));
      const expiresAt = new Date(Date.now() + tokens.expiresIn * 1000);
      await saveOrUpdateConnection(provider, {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        tokenExpiresAt: expiresAt,
        status: "active",
        externalMetadata: { connectedAt: new Date().toISOString() },
      });
      return redirectFrontend(res, { integration: "success", provider });
    }

    if (provider === "instagram") {
      const shortTok = await exchangeFacebookCode(String(code));
      const longTok = await exchangeFacebookLongLivedUserToken(shortTok.accessToken);
      const expiresAt = new Date(Date.now() + longTok.expiresIn * 1000);
      const ig = await fetchInstagramBusinessAccountId(longTok.accessToken);
      await saveOrUpdateConnection(provider, {
        accessToken: longTok.accessToken,
        refreshToken: null,
        tokenExpiresAt: expiresAt,
        externalId: ig.igUserId,
        externalMetadata: { username: ig.username, pageId: ig.pageId },
        status: "active",
      });
      return redirectFrontend(res, { integration: "success", provider });
    }

    const tokens = await exchangeTikTokCode(String(code));
    const expiresAt = new Date(Date.now() + tokens.expiresIn * 1000);
    await saveOrUpdateConnection(provider, {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tokenExpiresAt: expiresAt,
      status: "active",
      externalMetadata: { connectedAt: new Date().toISOString() },
    });
    return redirectFrontend(res, { integration: "success", provider });
  } catch (e) {
    return redirectFrontend(res, {
      integration: "error",
      code: "INT_005",
      message: e.message || "oauth_failed",
      traceId,
    });
  }
});

router.post("/:provider/disconnect", attachAsyncMw(requireCmsManager), async (req, res) => {
  const traceId = createTraceId();
  try {
    const { error, value: provider } = providerSchema.validate(req.params.provider);
    if (error) {
      return fail(res, 400, "INT_001", "Invalid provider.", undefined, traceId);
    }
    await IntegrationConnection.destroy({ where: { provider } });
    return ok(res, { disconnected: provider, traceId });
  } catch (e) {
    return fail(res, 500, "INT_006", e.message || "Disconnect failed.", undefined, traceId);
  }
});

router.patch("/:provider/config", attachAsyncMw(requireCmsManager), async (req, res) => {
  const traceId = createTraceId();
  try {
    const { error, value: provider } = providerSchema.validate(req.params.provider);
    if (error) {
      return fail(res, 400, "INT_001", "Invalid provider.", undefined, traceId);
    }
    const { error: bodyErr, value: body } = configPatchSchema.validate(req.body || {});
    if (bodyErr) {
      return fail(res, 400, "INT_008", bodyErr.message, undefined, traceId);
    }
    const row = await IntegrationConnection.findOne({ where: { provider } });
    if (!row) {
      return fail(res, 404, "INT_009", "No connection for provider.", undefined, traceId);
    }
    const patch = {};
    if (body.externalId !== undefined) {
      patch.externalId = body.externalId ? String(body.externalId).trim() : null;
    }
    if (body.externalMetadata !== undefined) {
      patch.externalMetadata = body.externalMetadata;
    }
    await row.update(patch);
    return ok(res, { connection: { provider: row.provider, externalId: row.externalId, externalMetadata: row.externalMetadata }, traceId });
  } catch (e) {
    return fail(res, 500, "INT_010", e.message || "Config update failed.", undefined, traceId);
  }
});

export default router;
