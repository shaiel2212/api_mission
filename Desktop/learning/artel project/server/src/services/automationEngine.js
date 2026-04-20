import { Op } from "sequelize";
import { AutomationRule } from "../models/AutomationRule.js";
import { AutomationExecutionLog } from "../models/AutomationExecutionLog.js";
import { MarketingAlert } from "../models/MarketingAlert.js";
import { MarketingMetricSnapshot } from "../models/MarketingMetricSnapshot.js";
import { whereSnapshotDateBetween } from "../utils/marketingSql.js";
import { getMarketingEnv } from "../config/marketingEnv.js";

async function sumMetricsInRange(fromDate, toDate) {
  const rows = await MarketingMetricSnapshot.findAll({
    where: whereSnapshotDateBetween(fromDate, toDate),
  });
  const totals = { impressions: 0, clicks: 0, sessions: 0, conversions: 0, spend: 0 };
  for (const r of rows) {
    totals.impressions += Number(r.impressions);
    totals.clicks += Number(r.clicks);
    totals.sessions += Number(r.sessions);
    totals.conversions += Number(r.conversions);
    totals.spend += Number(r.spend);
  }
  return totals;
}

/**
 * Simple condition: { metric: "ctr"|"clicks"|"sessions", op: "lt"|"gt", value: number, windowDays: number }
 * For ctr value is decimal e.g. 0.02 for 2%
 */
async function evaluateCondition(cond) {
  const windowDays = cond.windowDays || 7;
  const end = new Date();
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - (windowDays - 1));
  const from = start.toISOString().slice(0, 10);
  const to = end.toISOString().slice(0, 10);
  const m = await sumMetricsInRange(from, to);
  const ctr = m.impressions > 0 ? m.clicks / m.impressions : 0;
  let actual = 0;
  if (cond.metric === "ctr") {
    actual = ctr;
  } else if (cond.metric === "clicks") {
    actual = m.clicks;
  } else if (cond.metric === "sessions") {
    actual = m.sessions;
  } else if (cond.metric === "conversions") {
    actual = m.conversions;
  } else {
    return false;
  }
  const v = Number(cond.value);
  if (cond.op === "lt") {
    return actual < v;
  }
  if (cond.op === "gt") {
    return actual > v;
  }
  return false;
}

async function executeActions(rule, actions) {
  const env = getMarketingEnv();
  for (const action of actions) {
    if (action.type === "create_alert") {
      await MarketingAlert.create({
        alertType: action.alertType || "automation",
        severity: action.severity || "info",
        title: action.title || `אוטומציה: ${rule.name}`,
        message: action.message || "הופעל חוק אוטומציה.",
        recommendation: action.recommendation || null,
        metadata: { ruleId: rule.id, ruleName: rule.name },
      });
    }
    if (action.type === "webhook" && env.AUTOMATION_WEBHOOK_URL) {
      try {
        await fetch(env.AUTOMATION_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ruleId: rule.id,
            ruleName: rule.name,
            payload: action.payload || {},
          }),
        });
      } catch (e) {
        console.warn("[automationEngine] webhook failed", e.message);
      }
    }
  }
}

export async function runAutomationRules() {
  const rules = await AutomationRule.findAll({ where: { enabled: true } });
  const logs = [];
  for (const rule of rules) {
    const started = new Date();
    const log = await AutomationExecutionLog.create({
      ruleId: rule.id,
      status: "skipped",
      message: null,
      startedAt: started,
      finishedAt: null,
    });
    try {
      const conditions = Array.isArray(rule.conditionsJson) ? rule.conditionsJson : [];
      const all = conditions.length ? await Promise.all(conditions.map((c) => evaluateCondition(c))) : [false];
      const match = all.every(Boolean);
      if (!match) {
        await log.update({ status: "skipped", message: "conditions not met", finishedAt: new Date() });
        logs.push(log);
        continue;
      }
      const actions = Array.isArray(rule.actionsJson) ? rule.actionsJson : [];
      await executeActions(rule, actions);
      await log.update({ status: "success", message: "executed", finishedAt: new Date() });
      logs.push(log);
    } catch (e) {
      await log.update({ status: "failure", message: e.message || "error", finishedAt: new Date() });
      logs.push(log);
    }
  }
  return { evaluated: rules.length, logs };
}
