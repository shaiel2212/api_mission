import test from "node:test";
import assert from "node:assert/strict";
import { signOAuthState, verifyOAuthState } from "../src/integrations/oauthState.js";

test("oauth state roundtrip", () => {
  process.env.INTEGRATION_STATE_SECRET = "test-secret-at-least-16-chars";
  const token = signOAuthState({ provider: "google_analytics", x: 1 });
  const payload = verifyOAuthState(token);
  assert.equal(payload?.provider, "google_analytics");
  assert.equal(payload?.x, 1);
});
