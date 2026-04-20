import { Router } from "express";
import Joi from "joi";
import { Op } from "sequelize";
import { createTraceId, fail, ok } from "../utils/api.js";
import { requireCmsManager } from "../middleware/requireAdmin.js";
import { attachAsyncMw } from "../middleware/asyncHandler.js";
import {
  aggregateOverview,
  breakdownByCampaign,
  runFullMarketingSync,
  timeseriesByDay,
} from "../services/marketingIngestion.js";
import { runInsightPass } from "../services/marketingInsights.js";
import { runAutomationRules } from "../services/automationEngine.js";
import { MarketingAlert } from "../models/MarketingAlert.js";
import { AutomationRule } from "../models/AutomationRule.js";
import { AutomationExecutionLog } from "../models/AutomationExecutionLog.js";
import {
  orderAutomationLogStartedDesc,
  orderMarketingAlertCreatedDesc,
  whereMarketingAlertOpen,
} from "../utils/marketingSql.js";

const router = Router();
router.use(attachAsyncMw(requireCmsManager));

const dateRangeSchema = Joi.object({
  from: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
  to: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
});

const conditionItemSchema = Joi.object({
  metric: Joi.string().valid("ctr", "clicks", "sessions", "conversions").required(),
  op: Joi.string().valid("lt", "gt").required(),
  value: Joi.number().required(),
  windowDays: Joi.number().integer().min(1).max(90).optional(),
});

const actionItemSchema = Joi.alternatives().try(
  Joi.object({
    type: Joi.string().valid("create_alert").required(),
    alertType: Joi.string().trim().max(80).allow(null, "").optional(),
    severity: Joi.string().valid("info", "warning", "critical").optional(),
    title: Joi.string().trim().max(500).allow(null, "").optional(),
    message: Joi.string().trim().max(5000).allow(null, "").optional(),
    recommendation: Joi.string().trim().max(5000).allow(null, "").optional(),
  }),
  Joi.object({
    type: Joi.string().valid("webhook").required(),
    payload: Joi.object().unknown(true).optional(),
  })
);

const ruleCreateSchema = Joi.object({
  name: Joi.string().trim().min(1).max(255).required(),
  enabled: Joi.boolean().optional(),
  conditionsJson: Joi.array().items(conditionItemSchema).min(1).required(),
  actionsJson: Joi.array().items(actionItemSchema).min(1).required(),
});

router.get("/overview", async (req, res) => {
  const traceId = createTraceId();
  const { error, value } = dateRangeSchema.validate({ from: req.query.from, to: req.query.to });
  if (error) {
    return fail(res, 400, "MKT_001", error.message, undefined, traceId);
  }
  try {
    const overview = await aggregateOverview(value.from, value.to);
    return ok(res, { ...overview, traceId });
  } catch (e) {
    return fail(res, 500, "MKT_002", e.message || "overview failed", undefined, traceId);
  }
});

router.get("/timeseries", async (req, res) => {
  const traceId = createTraceId();
  const { error, value } = dateRangeSchema.validate({ from: req.query.from, to: req.query.to });
  if (error) {
    return fail(res, 400, "MKT_001", error.message, undefined, traceId);
  }
  const provider = req.query.provider || null;
  try {
    const series = await timeseriesByDay(value.from, value.to, provider);
    return ok(res, { series, traceId });
  } catch (e) {
    return fail(res, 500, "MKT_003", e.message || "timeseries failed", undefined, traceId);
  }
});

router.get("/breakdown", async (req, res) => {
  const traceId = createTraceId();
  const { error, value } = dateRangeSchema.validate({ from: req.query.from, to: req.query.to });
  if (error) {
    return fail(res, 400, "MKT_001", error.message, undefined, traceId);
  }
  try {
    const breakdown = await breakdownByCampaign(value.from, value.to);
    return ok(res, { breakdown, traceId });
  } catch (e) {
    return fail(res, 500, "MKT_004", e.message || "breakdown failed", undefined, traceId);
  }
});

router.post("/sync", async (req, res) => {
  const traceId = createTraceId();
  const bodySchema = Joi.object({
    startDate: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional(),
    endDate: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional(),
  });
  const { error, value } = bodySchema.validate(req.body || {});
  if (error) {
    return fail(res, 400, "MKT_005", error.message, undefined, traceId);
  }
  try {
    const result = await runFullMarketingSync({
      startDate: value.startDate,
      endDate: value.endDate,
    });
    return ok(res, { ...result, traceId });
  } catch (e) {
    return fail(res, 500, "MKT_006", e.message || "sync failed", undefined, traceId);
  }
});

router.post("/insights/run", async (_req, res) => {
  const traceId = createTraceId();
  try {
    const insight = await runInsightPass({ windowDays: 7 });
    return ok(res, { ...insight, traceId });
  } catch (e) {
    return fail(res, 500, "MKT_007", e.message || "insights failed", undefined, traceId);
  }
});

router.get("/alerts", async (req, res) => {
  const traceId = createTraceId();
  try {
    const limit = Math.min(Number(req.query.limit || 50), 200);
    const alerts = await MarketingAlert.findAll({
      where: whereMarketingAlertOpen(),
      order: orderMarketingAlertCreatedDesc,
      limit,
    });
    const alertsJson = alerts.map((a) => a.get({ plain: true }));
    return ok(res, { alerts: alertsJson, traceId });
  } catch (e) {
    return fail(res, 500, "MKT_008", e.message || "alerts failed", undefined, traceId);
  }
});

router.post("/alerts/:id/dismiss", async (req, res) => {
  const traceId = createTraceId();
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    return fail(res, 400, "MKT_009", "Invalid alert id", undefined, traceId);
  }
  try {
    const row = await MarketingAlert.findByPk(id);
    if (!row) {
      return fail(res, 404, "MKT_010", "Alert not found", undefined, traceId);
    }
    await row.update({ dismissedAt: new Date() });
    return ok(res, { alert: row.get({ plain: true }), traceId });
  } catch (e) {
    return fail(res, 500, "MKT_011", e.message || "dismiss failed", undefined, traceId);
  }
});

router.get("/automation/rules", async (_req, res) => {
  const traceId = createTraceId();
  try {
    const rules = await AutomationRule.findAll({ order: [["id", "ASC"]] });
    return ok(res, { rules: rules.map((r) => r.get({ plain: true })), traceId });
  } catch (e) {
    return fail(res, 500, "MKT_012", e.message || "rules list failed", undefined, traceId);
  }
});

router.post("/automation/rules", async (req, res) => {
  const traceId = createTraceId();
  const { error, value } = ruleCreateSchema.validate(req.body || {});
  if (error) {
    return fail(res, 400, "MKT_013", error.message, undefined, traceId);
  }
  try {
    const rule = await AutomationRule.create({
      name: value.name,
      enabled: value.enabled !== false,
      conditionsJson: value.conditionsJson,
      actionsJson: value.actionsJson,
    });
    return ok(res, { rule: rule.get({ plain: true }), traceId }, 201);
  } catch (e) {
    return fail(res, 500, "MKT_014", e.message || "rule create failed", undefined, traceId);
  }
});

router.patch("/automation/rules/:id", async (req, res) => {
  const traceId = createTraceId();
  const id = Number(req.params.id);
  const patchSchema = Joi.object({
    name: Joi.string().trim().min(1).max(255).optional(),
    enabled: Joi.boolean().optional(),
    conditionsJson: Joi.array().items(conditionItemSchema).min(1).optional(),
    actionsJson: Joi.array().items(actionItemSchema).min(1).optional(),
  }).min(1);
  const { error, value } = patchSchema.validate(req.body || {});
  if (error) {
    return fail(res, 400, "MKT_015", error.message, undefined, traceId);
  }
  try {
    const rule = await AutomationRule.findByPk(id);
    if (!rule) {
      return fail(res, 404, "MKT_016", "Rule not found", undefined, traceId);
    }
    await rule.update(value);
    return ok(res, { rule: rule.get({ plain: true }), traceId });
  } catch (e) {
    return fail(res, 500, "MKT_017", e.message || "rule update failed", undefined, traceId);
  }
});

router.post("/automation/run", async (_req, res) => {
  const traceId = createTraceId();
  try {
    const result = await runAutomationRules();
    return ok(res, { ...result, traceId });
  } catch (e) {
    return fail(res, 500, "MKT_018", e.message || "automation run failed", undefined, traceId);
  }
});

router.get("/automation/logs", async (req, res) => {
  const traceId = createTraceId();
  try {
    const limit = Math.min(Number(req.query.limit || 50), 200);
    const logs = await AutomationExecutionLog.findAll({
      order: orderAutomationLogStartedDesc,
      limit,
    });
    const logsJson = logs.map((l) => l.get({ plain: true }));
    return ok(res, { logs: logsJson, traceId });
  } catch (e) {
    return fail(res, 500, "MKT_019", e.message || "logs failed", undefined, traceId);
  }
});

export default router;
