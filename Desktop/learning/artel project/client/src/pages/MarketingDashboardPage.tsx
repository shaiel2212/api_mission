import { FormEvent, useCallback, useEffect, useState, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  dismissMarketingAlert,
  fetchAutomationRules,
  fetchIntegrationStatus,
  fetchMarketingAlerts,
  fetchMarketingOverview,
  fetchMarketingTimeseries,
  patchAutomationRule,
  patchIntegrationConfig,
  postAutomationRun,
  postIntegrationConnect,
  postIntegrationDisconnect,
  postMarketingInsightsRun,
  postMarketingSync,
  type IntegrationStatusRow,
  type MarketingAlert,
  type MarketingProvider,
  type MarketingTotals,
} from "../api/marketing";
import { readJsonBody } from "../api/readJsonBody";
import { apiUrl } from "../config/apiBase";

function defaultRange() {
  const to = new Date();
  const from = new Date(to);
  from.setUTCDate(from.getUTCDate() - 29);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { from: fmt(from), to: fmt(to) };
}

function pct(n: number | null | undefined) {
  if (n === null || n === undefined || Number.isNaN(n)) {
    return "—";
  }
  return `${(n * 100).toFixed(2)}%`;
}

function num(n: number) {
  return new Intl.NumberFormat("he-IL").format(Math.round(n));
}

type MarketingDashboardPageProps = {
  /** כאשר מוצג כטאב בתוך מרכז הניהול — פחות ריווח וללא קישור חזרה. */
  embedded?: boolean;
};

export default function MarketingDashboardPage({ embedded = false }: MarketingDashboardPageProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [{ from, to }, setRange] = useState(defaultRange);
  const [overview, setOverview] = useState<{
    totals: MarketingTotals;
    byProvider: Array<MarketingTotals & { provider: string }>;
  } | null>(null);
  const [series, setSeries] = useState<Array<MarketingTotals & { date: string }>>([]);
  const [connections, setConnections] = useState<IntegrationStatusRow[]>([]);
  const [alerts, setAlerts] = useState<MarketingAlert[]>([]);
  const [rules, setRules] = useState<Array<{ id: number; name: string; enabled: boolean }>>([]);
  const [gaPropertyId, setGaPropertyId] = useState("");
  const [tiktokAdvertiserId, setTiktokAdvertiserId] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [oauthBanner, setOauthBanner] = useState<string | null>(null);
  const [apiBackendHint, setApiBackendHint] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(apiUrl("/api/health"));
        let data: { ok?: boolean; marketingHub?: boolean };
        try {
          data = (await readJsonBody(res)) as { ok?: boolean; marketingHub?: boolean };
        } catch (e) {
          if (!cancelled) {
            setApiBackendHint(
              e instanceof Error
                ? e.message
                : "תשובת /api/health אינה JSON — בדוק proxy או VITE_API_BASE_URL."
            );
          }
          return;
        }
        if (cancelled) {
          return;
        }
        if (!res.ok || !data.ok) {
          setApiBackendHint(
            `לא ניתן להגיע ל־API (${res.status}). הפעל את השרת מתיקיית server (npm run dev) על הפורט שמוגדר ב־VITE_API_PROXY_TARGET (ברירת מחדל 3001), או הגדר VITE_API_BASE_URL ב־client/.env.`
          );
          return;
        }
        if (data.marketingHub !== true) {
          setApiBackendHint(
            "השרת על פורט 3001 רץ אבל זו גרסה ישנה (ב־/api/health אין marketingHub). עצור את תהליך Node של השרת והפעל מחדש `npm run dev` מתוך התיקייה `artel project/server` עם הקוד העדכני. אחרת בקשות ל־/api/marketing יחזירו 404."
          );
        }
      } catch {
        if (!cancelled) {
          setApiBackendHint(
            "השרת לא זמין (שגיאת רשת). ודא ש־`npm run dev` רץ בתיקיית server על פורט 3001, או עדכן VITE_API_PROXY_TARGET / VITE_API_BASE_URL."
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const i = searchParams.get("integration");
    if (!i) {
      return;
    }
    if (i === "success") {
      setOauthBanner("החיבור הושלם בהצלחה.");
    } else {
      setOauthBanner(`שגיאה בחיבור: ${searchParams.get("message") || searchParams.get("code") || "לא ידוע"}`);
    }
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete("integration");
        next.delete("message");
        next.delete("code");
        next.delete("traceId");
        return next;
      },
      { replace: true }
    );
  }, [searchParams, setSearchParams]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const [ov, ts, st, al, rl] = await Promise.all([
        fetchMarketingOverview(from, to),
        fetchMarketingTimeseries(from, to),
        fetchIntegrationStatus(),
        fetchMarketingAlerts(80),
        fetchAutomationRules(),
      ]);
      setOverview({
        totals: ov.totals,
        byProvider: (ov.byProvider || []) as Array<MarketingTotals & { provider: string }>,
      });
      setSeries((ts.series as Array<MarketingTotals & { date: string }>) || []);
      setConnections(st.connections || []);
      setAlerts(al.alerts || []);
      setRules((rl.rules || []).map((r) => ({ id: r.id, name: r.name, enabled: r.enabled })));
      const ga = st.connections.find((c) => c.provider === "google_analytics");
      if (ga?.externalId) {
        setGaPropertyId(ga.externalId.replace(/^properties\//, ""));
      }
      const tt = st.connections.find((c) => c.provider === "tiktok");
      if (tt?.externalId) {
        setTiktokAdvertiserId(tt.externalId);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "שגיאה");
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  async function connect(provider: MarketingProvider) {
    setError(null);
    try {
      const { authorizeUrl } = await postIntegrationConnect(provider);
      window.location.assign(authorizeUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "שגיאה");
    }
  }

  async function disconnect(provider: MarketingProvider) {
    setError(null);
    try {
      await postIntegrationDisconnect(provider);
      setMessage("נותק בהצלחה");
      await loadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : "שגיאה");
    }
  }

  async function saveGaProperty(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const id = gaPropertyId.trim();
      await patchIntegrationConfig("google_analytics", {
        externalId: id ? (id.startsWith("properties/") ? id : `properties/${id}`) : null,
      });
      setMessage("מזהה GA4 נשמר");
      await loadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : "שגיאה");
    }
  }

  async function saveTiktokAdvertiser(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await patchIntegrationConfig("tiktok", { externalId: tiktokAdvertiserId.trim() || null });
      setMessage("מזהה מפרסם TikTok נשמר");
      await loadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : "שגיאה");
    }
  }

  async function runSync() {
    setError(null);
    try {
      await postMarketingSync();
      setMessage("סנכרון הושלם");
      await loadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : "שגיאה");
    }
  }

  async function runInsights() {
    setError(null);
    try {
      const r = await postMarketingInsightsRun();
      setMessage(`נוצרו ${r.created} התראות תובנות`);
      await loadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : "שגיאה");
    }
  }

  async function runAutomation() {
    setError(null);
    try {
      const r = await postAutomationRun();
      setMessage(`אוטומציה: הוערכו ${r.evaluated} חוקים`);
      await loadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : "שגיאה");
    }
  }

  async function toggleRule(id: number, enabled: boolean) {
    setError(null);
    try {
      await patchAutomationRule(id, { enabled: !enabled });
      await loadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : "שגיאה");
    }
  }

  return (
    <section className={["mx-auto max-w-7xl px-6 pb-16 text-white", embedded ? "pt-4" : "pt-28"].join(" ")}>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          {!embedded ? (
            <p className="text-sm text-gray-400">
              <Link to="/admin" className="text-gold hover:underline">
                חזרה למרכז הניהול
              </Link>
            </p>
          ) : null}
          <h1 className={embedded ? "text-3xl font-black" : "mt-2 text-3xl font-black"}>Marketing Hub</h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-300">
            דשבורד מאוחד ל-Google Analytics, אינסטגרם (Graph API) ו-TikTok. חיבור OAuth רשמי, סנכרון מדדים, תובנות
            והתראות, ואוטומציות בסיסיות.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void loadAll()}
            disabled={loading}
            className="rounded border border-white/20 px-4 py-2 text-sm font-bold hover:bg-white/5 disabled:opacity-50"
          >
            רענן
          </button>
          <button
            type="button"
            onClick={() => void runSync()}
            disabled={loading}
            className="rounded bg-gold px-4 py-2 text-sm font-bold text-black disabled:opacity-50"
          >
            סנכרן נתונים
          </button>
          <button
            type="button"
            onClick={() => void runInsights()}
            disabled={loading}
            className="rounded border border-gold/60 px-4 py-2 text-sm font-bold text-gold hover:bg-gold/10 disabled:opacity-50"
          >
            הרץ תובנות
          </button>
          <button
            type="button"
            onClick={() => void runAutomation()}
            disabled={loading}
            className="rounded border border-emerald-500/50 px-4 py-2 text-sm font-bold text-emerald-300 hover:bg-emerald-500/10 disabled:opacity-50"
          >
            הרץ אוטומציות
          </button>
        </div>
      </div>

      {apiBackendHint ? (
        <p className="mb-4 rounded border border-amber-500/50 bg-amber-500/10 p-3 text-sm text-amber-100">{apiBackendHint}</p>
      ) : null}
      {oauthBanner ? (
        <p className="mb-4 rounded border border-white/15 bg-white/5 p-3 text-sm">{oauthBanner}</p>
      ) : null}
      {error ? <p className="mb-4 rounded border border-red-500/40 bg-red-500/10 p-3 text-sm">{error}</p> : null}
      {message ? <p className="mb-4 rounded border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm">{message}</p> : null}

      <div className="mb-8 flex flex-wrap items-end gap-4 rounded border border-white/15 bg-black/40 p-4">
        <div>
          <label className="mb-1 block text-xs text-gray-400">מ־תאריך</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))}
            className="rounded border border-white/20 bg-black px-3 py-2 text-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-400">עד תאריך</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))}
            className="rounded border border-white/20 bg-black px-3 py-2 text-white"
          />
        </div>
      </div>

      {overview ? (
        <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi title="חשיפות" value={num(overview.totals.impressions)} />
          <Kpi title="סשנים" value={num(overview.totals.sessions)} />
          <Kpi title="קליקים" value={num(overview.totals.clicks)} />
          <Kpi title="CTR" value={pct(overview.totals.ctr)} />
        </div>
      ) : null}

      <div className="mb-12 grid gap-8 lg:grid-cols-2">
        <div className="rounded border border-white/15 bg-black/40 p-4">
          <h2 className="mb-4 text-lg font-bold">מגמה יומית</h2>
          <div className="h-72 w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="date" tick={{ fill: "#9ca3af", fontSize: 11 }} />
                <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} />
                <Tooltip contentStyle={{ background: "#111", border: "1px solid #333" }} />
                <Legend />
                <Line type="monotone" dataKey="sessions" name="סשנים" stroke="#f5b301" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="clicks" name="קליקים" stroke="#38bdf8" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded border border-white/15 bg-black/40 p-4">
          <h2 className="mb-4 text-lg font-bold">לפי פלטפורמה</h2>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="text-right text-gray-400">
                <tr>
                  <th className="pb-2">פלטפורמה</th>
                  <th className="pb-2">חשיפות</th>
                  <th className="pb-2">סשנים</th>
                  <th className="pb-2">CTR</th>
                </tr>
              </thead>
              <tbody>
                {(overview?.byProvider || []).map((row) => (
                  <tr key={row.provider} className="border-t border-white/10">
                    <td className="py-2 font-medium">{providerLabel(row.provider)}</td>
                    <td className="py-2">{num(row.impressions)}</td>
                    <td className="py-2">{num(row.sessions)}</td>
                    <td className="py-2">{pct(row.ctr)}</td>
                  </tr>
                ))}
                {!overview?.byProvider?.length ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-gray-500">
                      אין נתונים בטווח — חבר אינטגרציות והרץ סנכרון.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="mb-12 grid gap-8 lg:grid-cols-3">
        <IntegrationCard
          title="Google Analytics (GA4)"
          provider="google_analytics"
          row={connections.find((c) => c.provider === "google_analytics")}
          onConnect={() => void connect("google_analytics")}
          onDisconnect={() => void disconnect("google_analytics")}
        >
          <form onSubmit={(e) => void saveGaProperty(e)} className="mt-3 space-y-2">
            <label className="text-xs text-gray-400">Property ID (מספר או properties/123)</label>
            <input
              value={gaPropertyId}
              onChange={(e) => setGaPropertyId(e.target.value)}
              className="w-full rounded border border-white/20 bg-black px-3 py-2 text-sm text-white"
              placeholder="123456789"
            />
            <button type="submit" className="w-full rounded bg-white/10 py-2 text-sm font-bold hover:bg-white/15">
              שמור Property
            </button>
          </form>
        </IntegrationCard>

        <IntegrationCard
          title="Instagram (Graph API)"
          provider="instagram"
          row={connections.find((c) => c.provider === "instagram")}
          onConnect={() => void connect("instagram")}
          onDisconnect={() => void disconnect("instagram")}
        >
          <p className="mt-3 text-xs text-gray-400">
            לאחר OAuth המערכת תזהה אוטומטית חשבון Business מקושר לעמוד פייסבוק.
          </p>
        </IntegrationCard>

        <IntegrationCard
          title="TikTok (Business)"
          provider="tiktok"
          row={connections.find((c) => c.provider === "tiktok")}
          onConnect={() => void connect("tiktok")}
          onDisconnect={() => void disconnect("tiktok")}
        >
          <form onSubmit={(e) => void saveTiktokAdvertiser(e)} className="mt-3 space-y-2">
            <label className="text-xs text-gray-400">Advertiser ID</label>
            <input
              value={tiktokAdvertiserId}
              onChange={(e) => setTiktokAdvertiserId(e.target.value)}
              className="w-full rounded border border-white/20 bg-black px-3 py-2 text-sm text-white"
            />
            <button type="submit" className="w-full rounded bg-white/10 py-2 text-sm font-bold hover:bg-white/15">
              שמור Advertiser
            </button>
          </form>
        </IntegrationCard>
      </div>

      <div className="mb-12 grid gap-8 lg:grid-cols-2">
        <div className="rounded border border-white/15 bg-black/40 p-4">
          <h2 className="mb-4 text-lg font-bold">התראות והמלצות</h2>
          <ul className="space-y-3 text-sm">
            {alerts.map((a) => (
              <li key={a.id} className="rounded border border-white/10 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-gold">{a.title}</p>
                    <p className="mt-1 text-gray-300">{a.message}</p>
                    {a.recommendation ? <p className="mt-2 text-emerald-200/90">המלצה: {a.recommendation}</p> : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => void dismissMarketingAlert(a.id).then(() => loadAll())}
                    className="shrink-0 rounded border border-white/20 px-2 py-1 text-xs hover:bg-white/10"
                  >
                    סגור
                  </button>
                </div>
              </li>
            ))}
            {!alerts.length ? <li className="text-gray-500">אין התראות פתוחות.</li> : null}
          </ul>
        </div>

        <div className="rounded border border-white/15 bg-black/40 p-4">
          <h2 className="mb-4 text-lg font-bold">חוקי אוטומציה</h2>
          <ul className="space-y-2 text-sm">
            {rules.map((r) => (
              <li key={r.id} className="flex items-center justify-between rounded border border-white/10 px-3 py-2">
                <span>{r.name}</span>
                <button
                  type="button"
                  onClick={() => void toggleRule(r.id, r.enabled)}
                  className="rounded bg-white/10 px-3 py-1 text-xs font-bold hover:bg-white/15"
                >
                  {r.enabled ? "כבה" : "הפעל"}
                </button>
              </li>
            ))}
            {!rules.length ? <li className="text-gray-500">אין חוקים.</li> : null}
          </ul>
          <p className="mt-4 text-xs text-gray-500">
            חוק ברירת מחדל נוצר בשרת (כבוי): CTR מתחת ל-1% לחלון 7 ימים. ניתן להפעיל מהרשימה.
          </p>
        </div>
      </div>
    </section>
  );
}

function providerLabel(p: string) {
  if (p === "google_analytics") {
    return "Google Analytics";
  }
  if (p === "instagram") {
    return "Instagram";
  }
  if (p === "tiktok") {
    return "TikTok";
  }
  return p;
}

function Kpi({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded border border-white/15 bg-black/50 p-4">
      <p className="text-xs text-gray-400">{title}</p>
      <p className="mt-2 text-2xl font-black text-gold">{value}</p>
    </div>
  );
}

function IntegrationCard({
  title,
  provider,
  row,
  onConnect,
  onDisconnect,
  children,
}: {
  title: string;
  provider: MarketingProvider;
  row?: IntegrationStatusRow;
  onConnect: () => void;
  onDisconnect: () => void;
  children?: ReactNode;
}) {
  const ok = Boolean(row && row.status === "active");

  return (
    <div className="rounded border border-white/15 bg-black/40 p-4">
      <h3 className="text-base font-bold">{title}</h3>
      <p className="mt-1 text-xs text-gray-500">{provider}</p>
      <p className="mt-3 text-sm text-gray-300">
        סטטוס:{" "}
        <span className={ok ? "text-emerald-400" : "text-amber-300"}>{row ? row.status : "לא מחובר"}</span>
      </p>
      {row?.externalId ? (
        <p className="mt-1 truncate text-xs text-gray-400" dir="ltr">
          מזהה חיצוני: {row.externalId}
        </p>
      ) : null}
      <div className="mt-4 flex gap-2">
        <button type="button" onClick={onConnect} className="flex-1 rounded bg-gold py-2 text-sm font-bold text-black">
          התחבר (OAuth)
        </button>
        <button
          type="button"
          onClick={onDisconnect}
          disabled={!row}
          className="rounded border border-white/20 px-3 py-2 text-sm hover:bg-white/5 disabled:opacity-40"
        >
          נתק
        </button>
      </div>
      {children}
    </div>
  );
}
