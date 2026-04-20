import { Router } from "express";
import Joi from "joi";
import { Project } from "../models/Project.js";
import { createTraceId, fail, ok } from "../utils/api.js";
import { requireCmsManager } from "../middleware/requireAdmin.js";
import { attachAsyncMw } from "../middleware/asyncHandler.js";

const router = Router();

const bodySchema = Joi.object({
  title: Joi.string().trim().min(2).max(255).required(),
  category: Joi.string().valid("renovation", "office", "construction").required(),
  subtitle: Joi.string().trim().min(2).max(255).required(),
  year: Joi.string().trim().pattern(/^\d{4}$/).required(),
  location: Joi.string().trim().min(2).max(255).required(),
  image: Joi.string().uri().required(),
  modalImage: Joi.string().uri().required(),
  beforeImage: Joi.string().uri().required(),
  afterImage: Joi.string().uri().required(),
  description: Joi.string().trim().allow("").max(5000).default(""),
  featuredOnHome: Joi.boolean().default(false),
  areaLabel: Joi.string().trim().max(80).allow(null, "").optional(),
  architect: Joi.string().trim().max(120).allow(null, "").optional(),
});

router.get("/", async (_req, res) => {
  const traceId = createTraceId();
  try {
    const projects = await Project.findAll({
      order: [
        ["year", "DESC"],
        ["created_at", "DESC"],
      ],
    });
    return ok(res, { projects, traceId });
  } catch (e) {
    console.error(`[project.list.error] traceId=${traceId} reason=${e.message}`);
    return fail(res, 500, "PROJECT_001", "שגיאת שרת בטעינת פרויקטים.", undefined, traceId);
  }
});

router.post("/", attachAsyncMw(requireCmsManager), async (req, res) => {
  const traceId = createTraceId();
  const { error, value } = bodySchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    return fail(
      res,
      400,
      "PROJECT_002",
      "Invalid project payload.",
      error.details.map((d) => d.message),
      traceId
    );
  }

  try {
    const project = await Project.create(value);
    return ok(res, { project, traceId }, 201);
  } catch (e) {
    console.error(`[project.create.error] traceId=${traceId} reason=${e.message}`);
    return fail(res, 500, "PROJECT_003", "שגיאת שרת ביצירת פרויקט.", undefined, traceId);
  }
});

router.put("/:id", attachAsyncMw(requireCmsManager), async (req, res) => {
  const traceId = createTraceId();
  const { error, value } = bodySchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    return fail(
      res,
      400,
      "PROJECT_004",
      "Invalid project update payload.",
      error.details.map((d) => d.message),
      traceId
    );
  }

  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) {
      return fail(res, 404, "PROJECT_005", "הפרויקט לא נמצא.", undefined, traceId);
    }

    await project.update(value);
    return ok(res, { project, traceId });
  } catch (e) {
    console.error(`[project.update.error] traceId=${traceId} reason=${e.message}`);
    return fail(res, 500, "PROJECT_006", "שגיאת שרת בעדכון פרויקט.", undefined, traceId);
  }
});

router.delete("/:id", attachAsyncMw(requireCmsManager), async (req, res) => {
  const traceId = createTraceId();
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) {
      return fail(res, 404, "PROJECT_007", "הפרויקט לא נמצא.", undefined, traceId);
    }

    await project.destroy();
    return ok(res, { traceId });
  } catch (e) {
    console.error(`[project.delete.error] traceId=${traceId} reason=${e.message}`);
    return fail(res, 500, "PROJECT_008", "שגיאת שרת במחיקת פרויקט.", undefined, traceId);
  }
});

export default router;
