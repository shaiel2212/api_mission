import { Router } from "express";
import Joi from "joi";
import { Op } from "sequelize";
import { Lead } from "../models/Lead.js";
import { LeadEvent } from "../models/LeadEvent.js";
import { createTraceId, fail, ok, maskPhone } from "../utils/api.js";

const router = Router();

const bodySchema = Joi.object({
  name: Joi.string().trim().min(1).max(255).required(),
  phone: Joi.string().trim().min(5).max(20).required(),
  message: Joi.string().trim().allow("").max(5000).optional(),
  source: Joi.string().trim().max(80).default("website"),
  attribution: Joi.object({
    utmSource: Joi.string().trim().max(255).allow(null, ""),
    utmMedium: Joi.string().trim().max(255).allow(null, ""),
    utmCampaign: Joi.string().trim().max(255).allow(null, ""),
    utmTerm: Joi.string().trim().max(255).allow(null, ""),
    utmContent: Joi.string().trim().max(255).allow(null, ""),
    referrer: Joi.string().trim().max(2000).allow(null, ""),
    landingPath: Joi.string().trim().max(2000).allow(null, ""),
    firstTouchAt: Joi.date().iso().allow(null),
  })
    .default({})
    .optional(),
  consent: Joi.object({
    marketing: Joi.boolean().default(false),
    timestamp: Joi.date().iso().allow(null),
    source: Joi.string().trim().max(80).allow(null, ""),
  })
    .default({ marketing: false })
    .optional(),
});

function normalizePhone(phone) {
  return phone.replace(/[^\d+]/g, "");
}

router.post("/", async (req, res) => {
  const traceId = createTraceId();
  const { error, value } = bodySchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    return fail(
      res,
      400,
      "LEAD_001",
      "Invalid lead payload.",
      error.details.map((d) => d.message),
      traceId
    );
  }

  const name = value.name;
  const phone = normalizePhone(value.phone);
  const message = value.message || null;
  const source = value.source || "website";
  const attribution = value.attribution || {};
  const consent = value.consent || {};

  const windowMinutes = Number(process.env.DUPLICATE_LEAD_WINDOW_MINUTES || 15);
  const since = new Date(Date.now() - windowMinutes * 60 * 1000);

  try {
    const recent = await Lead.findOne({
      where: {
        normalizedPhone: phone,
        created_at: { [Op.gte]: since },
      },
      order: [["created_at", "DESC"]],
    });

    if (recent) {
      await LeadEvent.create({
        leadId: recent.id,
        eventType: "duplicate_detected",
        payloadJson: {
          duplicateOfLeadId: recent.id,
          duplicatePhone: maskPhone(phone),
          windowMinutes,
        },
      });

      return fail(
        res,
        429,
        "LEAD_003",
        "נשלחה כבר פנייה מאותו מספר לאחרונה. נסו שוב בעוד כמה דקות או התקשרו אלינו.",
        { windowMinutes },
        traceId
      );
    }

    const lead = await Lead.create({
      name,
      phone,
      normalizedPhone: phone,
      message,
      source,
      utmSource: attribution.utmSource || null,
      utmMedium: attribution.utmMedium || null,
      utmCampaign: attribution.utmCampaign || null,
      utmTerm: attribution.utmTerm || null,
      utmContent: attribution.utmContent || null,
      referrer: attribution.referrer || null,
      landingPath: attribution.landingPath || null,
      firstTouchAt: attribution.firstTouchAt || null,
      consentMarketing: Boolean(consent.marketing),
      consentTimestamp: consent.timestamp || null,
      consentSource: consent.source || null,
    });

    await LeadEvent.create({
      leadId: lead.id,
      eventType: "created",
      payloadJson: {
        source,
        phoneMasked: maskPhone(phone),
      },
    });

    console.info(`[lead.created] id=${lead.id} traceId=${traceId} phone=${maskPhone(phone)} source=${source}`);

    return ok(res, {
      leadId: lead.id,
      traceId,
    });
  } catch (e) {
    console.error(`[lead.create.error] traceId=${traceId} reason=${e.message}`);
    return fail(res, 500, "LEAD_002", "שגיאת שרת. נסו שוב מאוחר יותר.", undefined, traceId);
  }
});

export default router;
