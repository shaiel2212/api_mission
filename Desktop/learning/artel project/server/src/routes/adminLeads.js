import { Router } from "express";
import Joi from "joi";
import { Op, col, fn } from "sequelize";
import { Lead } from "../models/Lead.js";
import { LeadEvent } from "../models/LeadEvent.js";
import { createTraceId, fail, ok } from "../utils/api.js";
import { requireAdminAccess } from "../middleware/requireAdmin.js";
import { attachAsyncMw } from "../middleware/asyncHandler.js";

const router = Router();

const statusSchema = Joi.string()
  .valid("new", "contacted", "qualified", "proposal_sent", "won", "lost")
  .required();

const updateSchema = Joi.object({
  status: statusSchema.optional(),
  priority: Joi.string().valid("low", "normal", "high").optional(),
  assignedTo: Joi.number().integer().min(1).allow(null).optional(),
  nextFollowUpAt: Joi.date().iso().allow(null).optional(),
  note: Joi.string().trim().max(5000).allow("").optional(),
  lostReason: Joi.string().trim().max(255).allow("").optional(),
}).min(1);

function conversionFieldsByStatus(status) {
  const now = new Date();
  if (status === "qualified") {
    return { qualifiedAt: now };
  }
  if (status === "proposal_sent") {
    return { proposalSentAt: now };
  }
  if (status === "won") {
    return { wonAt: now };
  }
  if (status === "lost") {
    return { lostAt: now };
  }
  return {};
}

router.use(attachAsyncMw(requireAdminAccess));

router.get("/", async (req, res) => {
  const traceId = createTraceId();
  try {
    const limit = Math.min(Number(req.query.limit || 50), 200);
    const where = {};
    if (req.query.status) {
      where.status = req.query.status;
    }
    if (req.query.assignedTo) {
      where.assignedTo = Number(req.query.assignedTo);
    }

    const leads = await Lead.findAll({
      where,
      limit,
      order: [
        ["created_at", "DESC"],
        ["id", "DESC"],
      ],
    });

    return ok(res, { leads, traceId });
  } catch (e) {
    return fail(res, 500, "ADMIN_002", "Failed to fetch leads.", undefined, traceId);
  }
});

router.patch("/:id", async (req, res) => {
  const traceId = createTraceId();
  const { error, value } = updateSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    return fail(
      res,
      400,
      "LEAD_010",
      "Invalid lead update payload.",
      error.details.map((d) => d.message),
      traceId
    );
  }

  try {
    const lead = await Lead.findByPk(req.params.id);
    if (!lead) {
      return fail(res, 404, "LEAD_011", "Lead not found.", undefined, traceId);
    }

    const updates = {};
    if (value.priority !== undefined) updates.priority = value.priority;
    if (value.assignedTo !== undefined) updates.assignedTo = value.assignedTo;
    if (value.nextFollowUpAt !== undefined) updates.nextFollowUpAt = value.nextFollowUpAt;
    if (value.lostReason !== undefined) updates.lostReason = value.lostReason || null;

    if (value.status) {
      updates.status = value.status;
      updates.statusChangedAt = new Date();
      Object.assign(updates, conversionFieldsByStatus(value.status));
    }

    if (Object.keys(updates).length) {
      await lead.update(updates);
    }

    if (value.status) {
      await LeadEvent.create({
        leadId: lead.id,
        eventType: "status_changed",
        payloadJson: { to: value.status },
      });
    }

    if (value.assignedTo !== undefined) {
      await LeadEvent.create({
        leadId: lead.id,
        eventType: "assigned",
        payloadJson: { assignedTo: value.assignedTo },
      });
    }

    if (value.note) {
      await LeadEvent.create({
        leadId: lead.id,
        eventType: "note_added",
        payloadJson: { note: value.note },
      });
    }

    const refreshed = await Lead.findByPk(lead.id);
    return ok(res, { lead: refreshed, traceId });
  } catch (e) {
    return fail(res, 500, "LEAD_012", "Failed to update lead.", undefined, traceId);
  }
});

router.get("/:id/events", async (req, res) => {
  const traceId = createTraceId();
  try {
    const events = await LeadEvent.findAll({
      where: { leadId: Number(req.params.id) },
      order: [["created_at", "DESC"]],
      limit: Math.min(Number(req.query.limit || 100), 500),
    });
    return ok(res, { events, traceId });
  } catch (e) {
    return fail(res, 500, "LEAD_013", "Failed to fetch lead events.", undefined, traceId);
  }
});

router.get("/metrics/overview", async (_req, res) => {
  const traceId = createTraceId();
  try {
    const [byStatusRows, unassigned, total, withAttribution] = await Promise.all([
      Lead.findAll({
        attributes: ["status", [fn("COUNT", col("id")), "count"]],
        group: ["status"],
      }),
      Lead.count({ where: { assignedTo: null } }),
      Lead.count(),
      Lead.count({ where: { utmSource: { [Op.ne]: null } } }),
    ]);

    const byStatus = Object.fromEntries(byStatusRows.map((row) => [row.get("status"), Number(row.get("count"))]));
    return ok(res, {
      metrics: {
        totalLeads: total,
        unassignedLeads: unassigned,
        attributionCoveragePct: total ? Math.round((withAttribution / total) * 100) : 0,
        byStatus,
      },
      traceId,
    });
  } catch (e) {
    return fail(res, 500, "LEAD_014", "Failed to calculate metrics.", undefined, traceId);
  }
});

export default router;
