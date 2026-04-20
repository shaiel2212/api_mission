import "dotenv/config";
import crypto from "crypto";
import { sequelize } from "../src/db.js";
import { User } from "../src/models/User.js";
import { Project } from "../src/models/Project.js";
import { Lead } from "../src/models/Lead.js";
import { LeadEvent } from "../src/models/LeadEvent.js";

function normalizePhone(phone) {
  return String(phone || "").replace(/[^\d+]/g, "");
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const digest = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
  return `pbkdf2$100000$${salt}$${digest}`;
}

async function upsertUser({ email, fullName, phone, role, password }) {
  const passwordHash = hashPassword(password);
  const [user, created] = await User.findOrCreate({
    where: { email },
    defaults: {
      email,
      fullName,
      phone,
      role,
      passwordHash,
      isActive: true,
      lastLoginAt: new Date(),
    },
  });

  if (!created) {
    await user.update({
      fullName,
      phone,
      role,
      passwordHash,
      isActive: true,
      lastLoginAt: new Date(),
    });
  }

  return user;
}

async function upsertProject(payload) {
  const [project, created] = await Project.findOrCreate({
    where: { title: payload.title },
    defaults: payload,
  });
  if (!created) {
    await project.update(payload);
  }
  return project;
}

async function upsertLead(payload) {
  const [lead, created] = await Lead.findOrCreate({
    where: { normalizedPhone: payload.normalizedPhone, source: payload.source },
    defaults: payload,
  });
  if (!created) {
    await lead.update(payload);
  }
  return lead;
}

async function seed() {
  try {
    if (process.env.NODE_ENV === "production") {
      console.error("db:seed is disabled when NODE_ENV=production.");
      process.exit(1);
    }

    await sequelize.authenticate();
    await sequelize.sync({ alter: true });

    const devPassword =
      process.env.SEED_DEV_PASSWORD && String(process.env.SEED_DEV_PASSWORD).length >= 8
        ? String(process.env.SEED_DEV_PASSWORD)
        : crypto.randomBytes(12).toString("base64url");

    const adminUser = await upsertUser({
      email: "admin@artel.local",
      fullName: "Artel Admin",
      phone: "050-222-1290",
      role: "admin",
      password: devPassword,
    });

    const managerUser = await upsertUser({
      email: "manager@artel.local",
      fullName: "Dana Manager",
      phone: "050-700-0101",
      role: "manager",
      password: devPassword,
    });

    const agentUser = await upsertUser({
      email: "agent@artel.local",
      fullName: "Ron Agent",
      phone: "050-700-0202",
      role: "agent",
      password: devPassword,
    });

    await upsertProject({
      title: "Penthouse Renovation Tel Aviv",
      category: "renovation",
      subtitle: "Full luxury interior upgrade",
      year: "2025",
      location: "Tel Aviv",
      image: "https://images.unsplash.com/photo-1493666438817-866a91353ca9",
      modalImage: "https://images.unsplash.com/photo-1493666438817-866a91353ca9",
      beforeImage: "https://images.unsplash.com/photo-1484154218962-a197022b5858",
      afterImage: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c",
      description: "Luxury renovation with high-end materials and strict timeline delivery.",
      featuredOnHome: true,
      areaLabel: "250 מ״ר",
      architect: "סטודיו לדוגמה",
    });
    await upsertProject({
      title: "Corporate Office Fit-Out",
      category: "office",
      subtitle: "Design and execution for tech company HQ",
      year: "2024",
      location: "Ramat Gan",
      image: "https://images.unsplash.com/photo-1497366754035-f200968a6e72",
      modalImage: "https://images.unsplash.com/photo-1497366754035-f200968a6e72",
      beforeImage: "https://images.unsplash.com/photo-1497215842964-222b430dc094",
      afterImage: "https://images.unsplash.com/photo-1524758631624-e2822e304c36",
      description: "Office renovation including electrical, lighting and acoustic optimization.",
      featuredOnHome: true,
    });
    await upsertProject({
      title: "Private Villa Build",
      category: "construction",
      subtitle: "Ground-up residential construction",
      year: "2023",
      location: "Herzliya",
      image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c",
      modalImage: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c",
      beforeImage: "https://images.unsplash.com/photo-1513694203232-719a280e022f",
      afterImage: "https://images.unsplash.com/photo-1600585154526-990dced4db0d",
      description: "Complete private build including structural and finish phases.",
      featuredOnHome: false,
    });

    const now = new Date();
    const lead1 = await upsertLead({
      name: "Yossi Cohen",
      phone: "050-111-2233",
      normalizedPhone: normalizePhone("050-111-2233"),
      message: "Need renovation quote for 5-room apartment.",
      status: "contacted",
      statusChangedAt: now,
      priority: "high",
      source: "website",
      assignedTo: adminUser.id,
      lastContactAt: now,
      nextFollowUpAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      utmSource: "google",
      utmMedium: "cpc",
      utmCampaign: "spring_campaign",
      firstTouchAt: now,
      consentMarketing: true,
      consentTimestamp: now,
      consentSource: "contact_form",
    });
    const lead2 = await upsertLead({
      name: "Maya Levi",
      phone: "052-333-4455",
      normalizedPhone: normalizePhone("052-333-4455"),
      message: "Interested in office renovation project.",
      status: "qualified",
      statusChangedAt: now,
      priority: "normal",
      source: "website",
      assignedTo: managerUser.id,
      qualifiedAt: now,
      nextFollowUpAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      utmSource: "facebook",
      utmMedium: "paid_social",
      utmCampaign: "office_leads",
      firstTouchAt: now,
      consentMarketing: true,
      consentTimestamp: now,
      consentSource: "contact_form",
    });
    const lead3 = await upsertLead({
      name: "Avi Mizrahi",
      phone: "053-666-7788",
      normalizedPhone: normalizePhone("053-666-7788"),
      message: "Looking for custom home construction manager.",
      status: "new",
      statusChangedAt: now,
      priority: "normal",
      source: "website",
      assignedTo: agentUser.id,
      nextFollowUpAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      utmSource: "organic",
      utmMedium: "seo",
      utmCampaign: "brand",
      firstTouchAt: now,
      consentMarketing: false,
      consentTimestamp: now,
      consentSource: "contact_form",
    });

    await LeadEvent.destroy({ where: {}, truncate: true });
    await LeadEvent.bulkCreate([
      { leadId: lead1.id, eventType: "created", payloadJson: { source: "website" }, createdBy: adminUser.id },
      {
        leadId: lead1.id,
        eventType: "status_changed",
        payloadJson: { from: "new", to: "contacted" },
        createdBy: adminUser.id,
      },
      {
        leadId: lead2.id,
        eventType: "created",
        payloadJson: { source: "website", campaign: "office_leads" },
        createdBy: managerUser.id,
      },
      {
        leadId: lead2.id,
        eventType: "assigned",
        payloadJson: { assignedTo: managerUser.id },
        createdBy: adminUser.id,
      },
      {
        leadId: lead3.id,
        eventType: "created",
        payloadJson: { source: "website", campaign: "brand" },
        createdBy: agentUser.id,
      },
      {
        leadId: lead3.id,
        eventType: "note_added",
        payloadJson: { note: "Customer requested callback next week." },
        createdBy: agentUser.id,
      },
    ]);

    const [usersCount, projectsCount, leadsCount, eventsCount] = await Promise.all([
      User.count(),
      Project.count(),
      Lead.count(),
      LeadEvent.count(),
    ]);

    console.log("Seed completed successfully.");
    console.log(`Users: ${usersCount}, Projects: ${projectsCount}, Leads: ${leadsCount}, LeadEvents: ${eventsCount}`);
    console.log("Dev logins (all use the same password):");
    console.log("  admin@artel.local / manager@artel.local / agent@artel.local");
    console.log(`  password: ${devPassword}`);
    console.log("Set SEED_DEV_PASSWORD in server/.env to pin a stable password, or it is random on each run.");
    process.exit(0);
  } catch (error) {
    console.error("Seed failed:", error.message);
    process.exit(1);
  }
}

seed();
