import test from "node:test";
import assert from "node:assert/strict";
import { deriveRates, toBigIntSafe, toDecimalSafe } from "../src/services/marketingNormalize.js";

test("toBigIntSafe clamps invalid", () => {
  assert.equal(toBigIntSafe(-1), 0);
  assert.equal(toBigIntSafe("x"), 0);
  assert.equal(toBigIntSafe(12.7), 13);
});

test("deriveRates computes ctr cpc cvr", () => {
  const r = deriveRates({
    impressions: 1000,
    clicks: 50,
    sessions: 200,
    conversions: 10,
    spend: 100,
  });
  assert.equal(r.ctr, 0.05);
  assert.equal(r.cpc, 2);
  assert.equal(r.cvr, 0.05);
});

test("toDecimalSafe", () => {
  assert.equal(toDecimalSafe("3.5"), 3.5);
  assert.equal(toDecimalSafe(NaN), 0);
});
