import { adminJsonHeaders, adminReadHeaders, withCredentials } from "./adminAuth";
import { readJsonBody } from "./readJsonBody";
import { apiUrl } from "../config/apiBase";

export type MarketingProvider = "google_analytics" | "instagram" | "tiktok";

export type IntegrationStatusRow = {
  provider: MarketingProvider;
  status: string;
  externalId: string | null;
  externalMetadata: Record<string, unknown> | null;
  tokenExpiresAt: string | null;
  connectedAt: string | null;
};

export type MarketingTotals = {
  impressions: number;
  reach: number;
  clicks: number;
  sessions: number;
  conversions: number;
  spend: number;
  ctr: number | null;
  cpc: number | null;
  cvr: number | null;
};

export type MarketingAlert = {
  id: number;
  alertType: string;
  severity: string;
  title: string;
  message: string;
  recommendation: string | null;
  metadata: unknown;
  dismissedAt: string | null;
  createdAt: string;
};

export type AutomationRule = {
  id: number;
  name: string;
  enabled: boolean;
  conditionsJson: unknown[];
  actionsJson: unknown[];
};

type ApiError = { status: "error"; message?: string; code?: string };

async function parseJson<T>(res: Response): Promise<T> {
  const data = (await readJsonBody(res)) as T | ApiError;
  if (!res.ok || (data as ApiError).status === "error") {
    const err = data as ApiError;
    throw new Error(err.message || "שגיאת API");
  }
  return data as T;
}

export async function postIntegrationConnect(provider: MarketingProvider) {
  const res = await fetch(apiUrl(`/api/integrations/${provider}/connect`), withCredentials({
    method: "POST",
    headers: adminJsonHeaders(),
  }));
  return parseJson<{ status: string; authorizeUrl: string; state: string; traceId: string }>(res);
}

export async function postIntegrationDisconnect(provider: MarketingProvider) {
  const res = await fetch(apiUrl(`/api/integrations/${provider}/disconnect`), withCredentials({
    method: "POST",
    headers: adminJsonHeaders(),
  }));
  return parseJson<{ status: string; disconnected: string }>(res);
}

export async function fetchIntegrationStatus() {
  const res = await fetch(apiUrl("/api/integrations/status"), withCredentials({ headers: adminReadHeaders() }));
  return parseJson<{ status: string; connections: IntegrationStatusRow[] }>(res);
}

export async function patchIntegrationConfig(
  provider: MarketingProvider,
  body: { externalId?: string | null; externalMetadata?: Record<string, unknown> | null }
) {
  const res = await fetch(apiUrl(`/api/integrations/${provider}/config`), withCredentials({
    method: "PATCH",
    headers: adminJsonHeaders(),
    body: JSON.stringify(body),
  }));
  return parseJson<{ status: string; connection: { provider: string; externalId: string | null; externalMetadata: unknown } }>(res);
}

export async function fetchMarketingOverview(from: string, to: string) {
  const q = new URLSearchParams({ from, to });
  const res = await fetch(apiUrl(`/api/marketing/overview?${q}`), withCredentials({ headers: adminReadHeaders() }));
  return parseJson<{ status: string; totals: MarketingTotals; byProvider: MarketingTotals[] }>(res);
}

export async function fetchMarketingTimeseries(from: string, to: string, provider?: MarketingProvider | "") {
  const q = new URLSearchParams({ from, to });
  if (provider) {
    q.set("provider", provider);
  }
  const res = await fetch(apiUrl(`/api/marketing/timeseries?${q}`), withCredentials({ headers: adminReadHeaders() }));
  return parseJson<{ status: string; series: MarketingTotals[] & { date: string }[] }>(res);
}

export async function fetchMarketingBreakdown(from: string, to: string) {
  const q = new URLSearchParams({ from, to });
  const res = await fetch(apiUrl(`/api/marketing/breakdown?${q}`), withCredentials({ headers: adminReadHeaders() }));
  return parseJson<{ status: string; breakdown: unknown[] }>(res);
}

export async function postMarketingSync(body?: { startDate?: string; endDate?: string }) {
  const res = await fetch(apiUrl("/api/marketing/sync"), withCredentials({
    method: "POST",
    headers: adminJsonHeaders(),
    body: JSON.stringify(body || {}),
  }));
  return parseJson<{ status: string; startDate: string; endDate: string; results: unknown[] }>(res);
}

export async function postMarketingInsightsRun() {
  const res = await fetch(apiUrl("/api/marketing/insights/run"), withCredentials({
    method: "POST",
    headers: adminReadHeaders(),
  }));
  return parseJson<{ status: string; created: number }>(res);
}

export async function fetchMarketingAlerts(limit = 50) {
  const res = await fetch(apiUrl(`/api/marketing/alerts?limit=${limit}`), withCredentials({ headers: adminReadHeaders() }));
  return parseJson<{ status: string; alerts: MarketingAlert[] }>(res);
}

export async function dismissMarketingAlert(id: number) {
  const res = await fetch(apiUrl(`/api/marketing/alerts/${id}/dismiss`), withCredentials({
    method: "POST",
    headers: adminReadHeaders(),
  }));
  return parseJson<{ status: string; alert: MarketingAlert }>(res);
}

export async function fetchAutomationRules() {
  const res = await fetch(apiUrl("/api/marketing/automation/rules"), withCredentials({ headers: adminReadHeaders() }));
  return parseJson<{ status: string; rules: AutomationRule[] }>(res);
}

export async function patchAutomationRule(id: number, body: Partial<Pick<AutomationRule, "name" | "enabled" | "conditionsJson" | "actionsJson">>) {
  const res = await fetch(apiUrl(`/api/marketing/automation/rules/${id}`), withCredentials({
    method: "PATCH",
    headers: adminJsonHeaders(),
    body: JSON.stringify(body),
  }));
  return parseJson<{ status: string; rule: AutomationRule }>(res);
}

export async function postAutomationRun() {
  const res = await fetch(apiUrl("/api/marketing/automation/run"), withCredentials({
    method: "POST",
    headers: adminReadHeaders(),
  }));
  return parseJson<{ status: string; evaluated: number }>(res);
}
