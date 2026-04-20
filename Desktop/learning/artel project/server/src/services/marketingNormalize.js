/**
 * @param {number|string} n
 */
export function toBigIntSafe(n) {
  const x = Number(n);
  if (!Number.isFinite(x) || x < 0) {
    return 0;
  }
  return Math.round(x);
}

/**
 * @param {number|string} n
 */
export function toDecimalSafe(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) {
    return 0;
  }
  return x;
}

/**
 * Compute CTR, CPC, CVR from aggregates.
 * @param {{
 *   impressions: number;
 *   clicks: number;
 *   sessions: number;
 *   conversions: number;
 *   spend: number;
 * }} m
 */
export function deriveRates(m) {
  const impressions = Math.max(0, m.impressions);
  const clicks = Math.max(0, m.clicks);
  const sessions = Math.max(0, m.sessions);
  const conversions = Math.max(0, m.conversions);
  const spend = Math.max(0, m.spend);
  const ctr = impressions > 0 ? clicks / impressions : null;
  const cpc = clicks > 0 ? spend / clicks : null;
  const cvr = sessions > 0 ? conversions / sessions : null;
  return { ctr, cpc, cvr };
}
