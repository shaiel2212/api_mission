import { Op } from "sequelize";
import { MarketingMetricSnapshot } from "../models/MarketingMetricSnapshot.js";
import { whereSnapshotDateBetween } from "../utils/marketingSql.js";
import { MarketingAlert } from "../models/MarketingAlert.js";
import { deriveRates } from "./marketingNormalize.js";

function ymd(d) {
  return d.toISOString().slice(0, 10);
}

function addDays(d, n) {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() + n);
  return x;
}

async function sumRange(from, to) {
  const rows = await MarketingMetricSnapshot.findAll({
    where: whereSnapshotDateBetween(from, to),
  });
  const totals = {
    impressions: 0,
    reach: 0,
    clicks: 0,
    sessions: 0,
    conversions: 0,
    spend: 0,
  };
  for (const r of rows) {
    totals.impressions += Number(r.impressions);
    totals.reach += Number(r.reach);
    totals.clicks += Number(r.clicks);
    totals.sessions += Number(r.sessions);
    totals.conversions += Number(r.conversions);
    totals.spend += Number(r.spend);
  }
  return { ...totals, ...deriveRates(totals) };
}

const DEDUPE_HOURS = 24;

async function hasRecentOpenAlert(alertType) {
  const since = new Date(Date.now() - DEDUPE_HOURS * 60 * 60 * 1000);
  const row = await MarketingAlert.findOne({
    where: {
      alertType,
      dismissedAt: null,
      createdAt: { [Op.gte]: since },
    },
  });
  return Boolean(row);
}

/**
 * Compare last window vs previous window; create alerts for significant drops.
 * @param {{ windowDays?: number }} opts
 */
export async function runInsightPass(opts = {}) {
  const windowDays = opts.windowDays ?? 7;
  const end = new Date();
  const currentStart = addDays(end, -(windowDays - 1));
  const prevEnd = addDays(currentStart, -1);
  const prevStart = addDays(prevEnd, -(windowDays - 1));

  const curFrom = ymd(currentStart);
  const curTo = ymd(end);
  const prevFrom = ymd(prevStart);
  const prevTo = ymd(prevEnd);

  const current = await sumRange(curFrom, curTo);
  const previous = await sumRange(prevFrom, prevTo);

  const created = [];

  const ctrDrop =
    previous.ctr && current.ctr !== null && current.ctr < previous.ctr * 0.75 && previous.ctr > 0.005;
  if (ctrDrop && !(await hasRecentOpenAlert("ctr_drop"))) {
    const a = await MarketingAlert.create({
      alertType: "ctr_drop",
      severity: "warning",
      title: "ירידה חדה ב-CTR",
      message: `CTR ירד מ-${(previous.ctr * 100).toFixed(2)}% ל-${(current.ctr * 100).toFixed(2)}% בחלון האחרון.`,
      recommendation:
        "בדוק קריאייטיב, קהלים ומיקומים; הרץ A/B לבאנרים/כותרות; ודא שהדף הנחיתה תואם למסר המודעה.",
      metadata: { current, previous, curFrom, curTo, prevFrom, prevTo },
    });
    created.push(a);
  }

  const convDrop =
    previous.cvr &&
    current.cvr !== null &&
    current.cvr < previous.cvr * 0.7 &&
    previous.sessions > 20 &&
    current.sessions > 10;
  if (convDrop && !(await hasRecentOpenAlert("cvr_drop"))) {
    const a = await MarketingAlert.create({
      alertType: "cvr_drop",
      severity: "critical",
      title: "ירידה בהמרות (CVR)",
      message: `שיעור ההמרה ירד ביחס לחלון הקודם (מבוסס sessions).`,
      recommendation:
        "בדוק טפסים, מהירות טעינה, תקלות מעקב, והצעת ערך; בדוק התאמת קמפיין לדף הנחיתה.",
      metadata: { current, previous, curFrom, curTo, prevFrom, prevTo },
    });
    created.push(a);
  }

  const spendSpike = previous.spend > 0 && current.spend > previous.spend * 1.4 && current.spend > 50;
  if (spendSpike && !(await hasRecentOpenAlert("spend_spike"))) {
    const a = await MarketingAlert.create({
      alertType: "spend_spike",
      severity: "warning",
      title: "עלייה חריגה בעלות",
      message: `הוצאה גדלה משמעותית ביחס לחלון הקודם.`,
      recommendation: "בדוק תקציבים, קהלים כפולים, והגדרות פלטפורמה; השהה קמפיינים חלשים.",
      metadata: { current, previous, curFrom, curTo, prevFrom, prevTo },
    });
    created.push(a);
  }

  return { created: created.length, alerts: created };
}
