import { Op } from "sequelize";

/**
 * Sequelize aliases the main model table (e.g. AS `MarketingMetricSnapshot`).
 * Raw literals like `marketing_metric_snapshots`.`snapshot_date` break MySQL:
 * "Unknown column ... in 'where clause'" once the table is aliased.
 * Use attribute-based `where` for filters.
 *
 * For `order`, use physical DB column names (`created_at`, …): `[["createdAt","DESC"]]`
 * can emit `MarketingAlert`.`createdAt` which MySQL rejects under underscored columns.
 */
export function whereSnapshotDateBetween(fromDate, toDate) {
  return { snapshotDate: { [Op.between]: [fromDate, toDate] } };
}

export function whereSnapshotProvider(provider) {
  return { provider };
}

export function whereSnapshotCampaignKeyNotNull() {
  return { campaignKey: { [Op.ne]: null } };
}

export const orderSnapshotDateAsc = [["snapshot_date", "ASC"]];

export function whereMarketingAlertOpen() {
  return { dismissedAt: null };
}

export const orderMarketingAlertCreatedDesc = [["created_at", "DESC"]];

export const orderAutomationLogStartedDesc = [["started_at", "DESC"]];
