import path from "node:path";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import cron from "node-cron";
import "dotenv/config";
import { requireCsrfForMutations } from "./middleware/csrf.js";
import { assertRequiredProductionEnv } from "./utils/prodEnvCheck.js";
import { sequelize } from "./db.js";
import { Lead } from "./models/Lead.js";
import { Project } from "./models/Project.js";
import { LeadEvent } from "./models/LeadEvent.js";
import { User } from "./models/User.js";
import { IntegrationConnection } from "./models/IntegrationConnection.js";
import { MarketingMetricSnapshot } from "./models/MarketingMetricSnapshot.js";
import { MarketingAlert } from "./models/MarketingAlert.js";
import { AutomationRule } from "./models/AutomationRule.js";
import { AutomationExecutionLog } from "./models/AutomationExecutionLog.js";
import leadsRouter from "./routes/leads.js";
import projectsRouter from "./routes/projects.js";
import adminLeadsRouter from "./routes/adminLeads.js";
import integrationsRouter from "./routes/integrations.js";
import marketingRouter from "./routes/marketing.js";
import authRouter from "./routes/auth.js";
import { getMarketingEnv } from "./config/marketingEnv.js";
import { runFullMarketingSync } from "./services/marketingIngestion.js";
import { runInsightPass } from "./services/marketingInsights.js";
import { runAutomationRules } from "./services/automationEngine.js";

process.on("unhandledRejection", (reason) => {
  console.error("[unhandledRejection]", reason);
});
process.on("uncaughtException", (err) => {
  console.error("[uncaughtException]", err);
});

const app = express();
app.set("trust proxy", 1);
const PORT = Number(process.env.PORT || 3001);

const origins = (process.env.CORS_ORIGINS || "http://localhost:5173")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }
      if (origins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "x-admin-api-key", "X-CSRF-Token", "Cookie"],
  })
);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cookieParser());
app.use(express.json({ limit: "32kb" }));
app.use(requireCsrfForMutations);

app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const p = req.path || "";
    if (
      p.startsWith("/api/marketing") ||
      p.startsWith("/api/integrations") ||
      p.startsWith("/api/admin") ||
      p.startsWith("/api/auth")
    ) {
      const ms = Date.now() - start;
      console.log(`[http] ${req.method} ${req.path} ${res.statusCode} ${ms}ms`);
    }
  });
  next();
});

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
});

const integrationsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
});

const marketingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/auth", authLimiter, authRouter);
app.use("/api/leads", limiter, leadsRouter);
app.use("/api/projects", projectsRouter);
app.use("/api/admin/leads", adminLeadsRouter);
app.use("/api/integrations", integrationsLimiter, integrationsRouter);
app.use("/api/marketing", marketingLimiter, marketingRouter);

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    /** נוסף לזיהוי גרסת API שכוללת Marketing Hub — לקוח משתמש בזה לאבחון 404 */
    marketingHub: true,
    name: "artel-server",
  });
});

/** אותו מקור ל־SPA + API (סטייג'/פרוד): נתיבי React (למשל /projects) חייבים להחזיר index.html אחרי ריענון */
const clientDistRaw = (process.env.CLIENT_DIST || "").trim();
if (clientDistRaw) {
  const clientDistAbs = path.isAbsolute(clientDistRaw)
    ? clientDistRaw
    : path.resolve(process.cwd(), clientDistRaw);
  app.use(express.static(clientDistAbs, { index: false }));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) {
      return res.status(404).json({ status: "error", code: "HTTP_404", message: "Not found." });
    }
    res.sendFile(path.join(clientDistAbs, "index.html"), (err) => {
      if (err) next(err);
    });
  });
}

app.use((err, _req, res, _next) => {
  console.error("[express] unhandled error:", err?.message || err);
  return res.status(500).json({ status: "error", code: "SRV_001", message: "Internal server error." });
});

async function seedMarketingDefaults() {
  const existing = await AutomationRule.findOne({ where: { name: "Marketing: CTR under 1%" } });
  if (existing) {
    return;
  }
  await AutomationRule.create({
    name: "Marketing: CTR under 1%",
    enabled: false,
    conditionsJson: [
      {
        metric: "ctr",
        op: "lt",
        value: 0.01,
        windowDays: 7,
      },
    ],
    actionsJson: [
      {
        type: "create_alert",
        alertType: "automation_ctr",
        severity: "warning",
        title: "CTR מתחת לסף",
        message: "שיעור הקליקים מהחשיפות נמוך מ-1% בחלון של 7 ימים.",
        recommendation: "בדוק קריאייטיב, קהלים, והתאמת דף נחיתה.",
      },
    ],
  });
}

async function runScheduledMarketingJob() {
  try {
    await runFullMarketingSync();
    await runInsightPass({ windowDays: 7 });
    await runAutomationRules();
  } catch (e) {
    console.error("[marketing cron] job failed:", e?.message || e);
  }
}

async function start() {
  try {
    assertRequiredProductionEnv();
    await sequelize.authenticate();
    await Lead.sync();
    await LeadEvent.sync();
    await User.sync();
    await Project.sync();
    await IntegrationConnection.sync();
    await MarketingMetricSnapshot.sync();
    await MarketingAlert.sync();
    await AutomationRule.sync();
    await AutomationExecutionLog.sync();
    await seedMarketingDefaults();

    const menv = getMarketingEnv();
    if (menv.MARKETING_SYNC_CRON_ENABLED) {
      cron.schedule("0 * * * *", () => {
        void runScheduledMarketingJob();
      });
      console.log("[marketing cron] hourly sync + insights + automation enabled");
    }
    if (menv.MARKETING_AUTOMATION_CRON_ENABLED && !menv.MARKETING_SYNC_CRON_ENABLED) {
      cron.schedule("15 * * * *", () => {
        void runAutomationRules();
      });
      console.log("[marketing cron] hourly automation-only enabled");
    }

    app.listen(PORT, () => {
      console.log(`Artel API listening on http://localhost:${PORT}`);
      console.log("[artel] routes: /api/health (marketingHub), /api/marketing/*, /api/integrations/*");
    });
  } catch (e) {
    console.error("Failed to start server:", e.message);
    process.exit(1);
  }
}

start();
