import { Op } from "sequelize";
import { IntegrationConnection } from "../models/IntegrationConnection.js";
import { MarketingMetricSnapshot } from "../models/MarketingMetricSnapshot.js";
import {
  orderSnapshotDateAsc,
  whereSnapshotCampaignKeyNotNull,
  whereSnapshotDateBetween,
  whereSnapshotProvider,
} from "../utils/marketingSql.js";
import { getValidAccessToken } from "./integrationTokens.js";
import { runGaDailyReport } from "../integrations/googleAnalytics/client.js";
import { fetchInstagramDailyInsights } from "../integrations/instagram/client.js";
import { fetchTikTokIntegratedReport } from "../integrations/tiktok/client.js";
import { deriveRates, toBigIntSafe, toDecimalSafe } from "./marketingNormalize.js";

function ymd(d) {
  return d.toISOString().slice(0, 10);
}

function addDays(d, n) {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() + n);
  return x;
}

/**
 * @param {string} propertyId raw or properties/xxx
 */
function normalizeGaProperty(propertyId) {
  if (!propertyId) {
    return null;
  }
  const s = String(propertyId).trim();
  if (s.startsWith("properties/")) {
    return s;
  }
  return `properties/${s.replace(/^properties\//, "")}`;
}

/**
 * Upsert a snapshot row. For campaignKey=null, MySQL unique+NULL is ambiguous — use find+update.
 */
async function upsertSnapshot(values) {
  const rates = deriveRates({
    impressions: Number(values.impressions),
    clicks: Number(values.clicks),
    sessions: Number(values.sessions),
    conversions: Number(values.conversions),
    spend: Number(values.spend),
  });
  const payload = {
    ...values,
    ctr: rates.ctr,
    cpc: rates.cpc,
    cvr: rates.cvr,
  };
  const ck = values.campaignKey ?? null;
  if (ck != null && ck !== "") {
    try {
      await MarketingMetricSnapshot.upsert(
        { ...payload, campaignKey: ck },
        { conflictFields: ["provider", "snapshotDate", "campaignKey"] }
      );
    } catch {
      const existing = await MarketingMetricSnapshot.findOne({
        where: { provider: values.provider, snapshotDate: values.snapshotDate, campaignKey: ck },
      });
      if (existing) {
        await existing.update(payload);
      } else {
        await MarketingMetricSnapshot.create({ ...payload, campaignKey: ck });
      }
    }
    return;
  }
  const existing = await MarketingMetricSnapshot.findOne({
    where: {
      provider: values.provider,
      snapshotDate: values.snapshotDate,
      campaignKey: null,
    },
  });
  if (existing) {
    await existing.update(payload);
  } else {
    await MarketingMetricSnapshot.create({ ...payload, campaignKey: null });
  }
}

/**
 * Parse GA Data API runReport JSON into per-day snapshots.
 */
function parseGaReportToRows(reportJson) {
  /** @type {Array<{date: string, sessions: number, users: number, events: number, conversions: number}>} */
  const out = [];
  const rows = reportJson?.rows || [];
  for (const row of rows) {
    const dateRaw = row.dimensionValues?.[0]?.value || "";
    const date = `${dateRaw.slice(0, 4)}-${dateRaw.slice(4, 6)}-${dateRaw.slice(6, 8)}`;
    const metrics = row.metricValues || [];
    const sessions = Number(metrics[0]?.value || 0);
    const users = Number(metrics[1]?.value || 0);
    const events = Number(metrics[2]?.value || 0);
    const conversions = 0;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      continue;
    }
    out.push({
      date,
      sessions,
      users,
      events,
      conversions,
      impressions: events,
      reach: users,
      clicks: events,
      spend: 0,
    });
  }
  return out;
}

/**
 * Parse Instagram insights (period=day) into rows.
 */
function parseInstagramInsightsToRows(insightsJson) {
  /** @type {Map<string, {impressions:number,reach:number,clicks:number}>} */
  const byDate = new Map();
  const data = insightsJson?.data || [];
  for (const block of data) {
    const name = block.name;
    const values = block.values || [];
    for (const v of values) {
      const endTime = v.end_time || v.endTime;
      if (!endTime) {
        continue;
      }
      const date = String(endTime).slice(0, 10);
      if (!byDate.has(date)) {
        byDate.set(date, { impressions: 0, reach: 0, clicks: 0 });
      }
      const row = byDate.get(date);
      const val = Number(v.value || 0);
      if (name === "impressions") {
        row.impressions += val;
      } else if (name === "reach") {
        row.reach += val;
      } else if (name === "profile_views" || name === "website_clicks") {
        row.clicks += val;
      }
    }
  }
  return [...byDate.entries()].map(([date, m]) => ({
    date,
    sessions: m.reach,
    users: m.reach,
    events: m.impressions,
    conversions: 0,
    impressions: m.impressions,
    reach: m.reach,
    clicks: m.clicks,
    spend: 0,
  }));
}

export async function syncGoogleAnalyticsRange(startDate, endDate) {
  const { connection, accessToken } = await getValidAccessToken("google_analytics");
  if (!connection || !accessToken || !connection.externalId) {
    return { provider: "google_analytics", synced: 0, skipped: true, reason: "not_connected_or_missing_property" };
  }
  const property = normalizeGaProperty(connection.externalId);
  const report = await runGaDailyReport(property, accessToken, startDate, endDate);
  const rows = parseGaReportToRows(report);
  let synced = 0;
  for (const r of rows) {
    await upsertSnapshot({
      provider: "google_analytics",
      snapshotDate: r.date,
      campaignKey: null,
      impressions: toBigIntSafe(r.impressions),
      reach: toBigIntSafe(r.reach),
      clicks: toBigIntSafe(r.clicks),
      sessions: toBigIntSafe(r.sessions),
      conversions: toDecimalSafe(r.conversions),
      spend: toDecimalSafe(r.spend),
      rawPayload: { source: "ga4", date: r.date },
    });
    synced += 1;
  }
  return { provider: "google_analytics", synced };
}

export async function syncInstagramRange(_startDate, _endDate) {
  const { connection, accessToken } = await getValidAccessToken("instagram");
  if (!connection || !accessToken || !connection.externalId) {
    return { provider: "instagram", synced: 0, skipped: true, reason: "not_connected_or_missing_ig_user" };
  }
  const json = await fetchInstagramDailyInsights(connection.externalId, accessToken);
  const rows = parseInstagramInsightsToRows(json);
  let synced = 0;
  for (const r of rows) {
    await upsertSnapshot({
      provider: "instagram",
      snapshotDate: r.date,
      campaignKey: null,
      impressions: toBigIntSafe(r.impressions),
      reach: toBigIntSafe(r.reach),
      clicks: toBigIntSafe(r.clicks),
      sessions: toBigIntSafe(r.sessions),
      conversions: toDecimalSafe(r.conversions),
      spend: toDecimalSafe(r.spend),
      rawPayload: { source: "instagram_graph" },
    });
    synced += 1;
  }
  return { provider: "instagram", synced };
}

export async function syncTikTokRange(startDate, endDate) {
  const { connection, accessToken } = await getValidAccessToken("tiktok");
  if (!connection || !accessToken || !connection.externalId) {
    return { provider: "tiktok", synced: 0, skipped: true, reason: "not_connected_or_missing_advertiser" };
  }
  const report = await fetchTikTokIntegratedReport(connection.externalId, accessToken, startDate, endDate);
  const rows = report.rows || [];
  if (rows.length === 0) {
    return {
      provider: "tiktok",
      synced: 0,
      skipped: true,
      reason: "tiktok_integrated_report_not_implemented_or_empty",
    };
  }
  let synced = 0;
  for (const row of rows) {
    await upsertSnapshot({
      provider: "tiktok",
      snapshotDate: row.date,
      campaignKey: row.campaignKey || null,
      impressions: toBigIntSafe(row.impressions),
      reach: toBigIntSafe(row.reach || 0),
      clicks: toBigIntSafe(row.clicks),
      sessions: toBigIntSafe(row.sessions || row.clicks),
      conversions: toDecimalSafe(row.conversions),
      spend: toDecimalSafe(row.spend),
      rawPayload: row,
    });
    synced += 1;
  }
  return { provider: "tiktok", synced };
}

/**
 * Default: last 30 days inclusive.
 */
export async function runFullMarketingSync(options = {}) {
  const end = options.endDate ? new Date(options.endDate) : new Date();
  const start = options.startDate ? new Date(options.startDate) : addDays(end, -29);
  const startDate = ymd(start);
  const endDate = ymd(end);
  const results = [];
  results.push(await syncGoogleAnalyticsRange(startDate, endDate));
  results.push(await syncInstagramRange(startDate, endDate));
  results.push(await syncTikTokRange(startDate, endDate));
  return { startDate, endDate, results };
}

/**
 * Aggregate totals for date range across providers.
 */
export async function aggregateOverview(fromDate, toDate) {
  const rows = await MarketingMetricSnapshot.findAll({
    where: whereSnapshotDateBetween(fromDate, toDate),
  });
  const byProvider = {};
  for (const r of rows) {
    const p = r.provider;
    if (!byProvider[p]) {
      byProvider[p] = {
        provider: p,
        impressions: 0,
        reach: 0,
        clicks: 0,
        sessions: 0,
        conversions: 0,
        spend: 0,
      };
    }
    byProvider[p].impressions += Number(r.impressions);
    byProvider[p].reach += Number(r.reach);
    byProvider[p].clicks += Number(r.clicks);
    byProvider[p].sessions += Number(r.sessions);
    byProvider[p].conversions += Number(r.conversions);
    byProvider[p].spend += Number(r.spend);
  }
  const list = Object.values(byProvider).map((m) => ({
    ...m,
    ...deriveRates({
      impressions: m.impressions,
      clicks: m.clicks,
      sessions: m.sessions,
      conversions: m.conversions,
      spend: m.spend,
    }),
  }));
  const totals = list.reduce(
    (acc, m) => ({
      impressions: acc.impressions + m.impressions,
      reach: acc.reach + m.reach,
      clicks: acc.clicks + m.clicks,
      sessions: acc.sessions + m.sessions,
      conversions: acc.conversions + m.conversions,
      spend: acc.spend + m.spend,
    }),
    { impressions: 0, reach: 0, clicks: 0, sessions: 0, conversions: 0, spend: 0 }
  );
  return {
    totals: {
      ...totals,
      ...deriveRates({
        impressions: totals.impressions,
        clicks: totals.clicks,
        sessions: totals.sessions,
        conversions: totals.conversions,
        spend: totals.spend,
      }),
    },
    byProvider: list,
  };
}

export async function timeseriesByDay(fromDate, toDate, provider = null) {
  const parts = [whereSnapshotDateBetween(fromDate, toDate)];
  if (provider) {
    parts.push(whereSnapshotProvider(provider));
  }
  const rows = await MarketingMetricSnapshot.findAll({
    where: parts.length === 1 ? parts[0] : { [Op.and]: parts },
    order: orderSnapshotDateAsc,
  });
  /** @type {Map<string, any>} */
  const byDay = new Map();
  for (const r of rows) {
    const d = r.snapshotDate;
    if (!byDay.has(d)) {
      byDay.set(d, {
        date: d,
        impressions: 0,
        reach: 0,
        clicks: 0,
        sessions: 0,
        conversions: 0,
        spend: 0,
      });
    }
    const x = byDay.get(d);
    x.impressions += Number(r.impressions);
    x.reach += Number(r.reach);
    x.clicks += Number(r.clicks);
    x.sessions += Number(r.sessions);
    x.conversions += Number(r.conversions);
    x.spend += Number(r.spend);
  }
  return [...byDay.values()].map((m) => ({
    ...m,
    ...deriveRates({
      impressions: m.impressions,
      clicks: m.clicks,
      sessions: m.sessions,
      conversions: m.conversions,
      spend: m.spend,
    }),
  }));
}

export async function breakdownByCampaign(fromDate, toDate) {
  const rows = await MarketingMetricSnapshot.findAll({
    where: {
      [Op.and]: [whereSnapshotDateBetween(fromDate, toDate), whereSnapshotCampaignKeyNotNull()],
    },
  });
  /** @type {Map<string, any>} */
  const map = new Map();
  for (const r of rows) {
    const key = `${r.provider}::${r.campaignKey}`;
    if (!map.has(key)) {
      map.set(key, {
        provider: r.provider,
        campaignKey: r.campaignKey,
        impressions: 0,
        reach: 0,
        clicks: 0,
        sessions: 0,
        conversions: 0,
        spend: 0,
      });
    }
    const x = map.get(key);
    x.impressions += Number(r.impressions);
    x.reach += Number(r.reach);
    x.clicks += Number(r.clicks);
    x.sessions += Number(r.sessions);
    x.conversions += Number(r.conversions);
    x.spend += Number(r.spend);
  }
  return [...map.values()].map((m) => ({
    ...m,
    ...deriveRates({
      impressions: m.impressions,
      clicks: m.clicks,
      sessions: m.sessions,
      conversions: m.conversions,
      spend: m.spend,
    }),
  }));
}

export { normalizeGaProperty };
