# Technical Specification: אתר ארטל בניה ופיתוח

אפיון טכני מאוחד (ארכיטקטורה, נתונים, API, אבטחה, ביצועים). המקור באנגלית.

---

## 1. Technical Overview

**Goal:** Develop a responsive, fast-loading website for Artel Construction and Development to enhance brand prestige and facilitate lead generation.

**Scope:** Homepage, About, Projects, Clients, Testimonials, Contact Us pages with lead management integration.

**Non-goals:** Development of mobile applications, lead management outside the website.

**Dependencies:** Google Analytics, WhatsApp integration, Instagram linking.

**Assumptions:** All content will be available at launch. Default conventions are used due to missing Git Agent data.

### Open Questions

- האם יש לוגואים נוספים שתרצו להציג בעמוד הלקוחות?
- האם ישנן המלצות נוספות שתרצו לכלול בעמוד ההמלצות?
- האם יש דרישות מיוחדות לגבי עיצוב האתר מעבר למה שצוין?

---

## 2. Architecture

**Components**

- Frontend: React.js  
- Backend: Node.js / Express  
- Database: MySQL  
- Analytics: Google Analytics  

**Data flow (source spec):** User interacts on frontend → backend processes → stored in MySQL → analytics to Google Analytics.

**Sequence (textual):** User visits site → interacts → submits contact form → data stored in DB → analytics data sent to Google Analytics.

**Integration points (source spec):** Google Analytics, WhatsApp API, Instagram API.

> **הערת סנכרון:** ראו הסברים ב־[05-open-questions-and-decisions.md](./05-open-questions-and-decisions.md) לגבי מה חייב להיות בשרת לעומת UI בלבד.

### 2.1 Existing Project Structure & Integration

- Architecture overview: MISSING — assume standard MVC.
- Stack: React.js, Node.js, Express, MySQL.
- Folders: MISSING — assume standard structure.
- Existing services: none assumed.
- New setup; N/A integration with legacy.

---

## 3. Data Model (MySQL)

### Table: `leads`

| Column | Type | Notes |
|--------|------|--------|
| id | INT, PK, AUTO_INCREMENT | |
| name | VARCHAR(255), NOT NULL | |
| phone | VARCHAR(20), NOT NULL | |
| message | TEXT, NULL | |
| created_at | TIMESTAMP, DEFAULT CURRENT_TIMESTAMP | |

- **PK:** id  
- **Indexes:** phone  
- **Integrity:** validate on input (API + DB constraints)

### Migrations

- Create `leads` table.
- Backfill: N/A  
- Rollback: drop table  

---

## 4. API Contract (Node.js / REST)

| Field | Value |
|--------|--------|
| Method + Path | `POST /api/leads` |
| Auth | None |
| Roles | Public |

**Request**

```json
{
  "name": "string",
  "phone": "string",
  "message": "string"
}
```

**Success response**

```json
{
  "status": "success",
  "leadId": 101
}
```

**Status codes:** 200 OK, 400 Bad Request, 500 Internal Server Error  

**Error codes:** LEAD_001 (validation), LEAD_002 (database)  

**Idempotency:** N/A in source spec.

---

## 5. Authorization & Tenant Isolation

- Public access for lead submission.
- Permission matrix: N/A.
- Middleware: validate input.
- Tenant scoping: N/A.

---

## 6. Business Rules → Technical Mapping

| Rule | Enforcement |
|------|-------------|
| All leads stored | API / persistence layer |
| Required fields | Validation — failure returns 400 |

---

## 7. Edge Cases & Concurrency

- **Duplicate handling:** Check duplicate phone numbers within a short time window (define parameters in doc 05).
- **Race conditions:** N/A per source.
- **Retries/timeouts:** Retries for DB connection failures.

---

## 8. Observability & Audit Log

- **Log events:** LeadSubmission including `name`, `phone`, `message` (PII — redaction policy recommended in doc 05).
- **Metrics:** Lead count, API response times.
- **Alerts:** High error rate on lead endpoint.
- **Audit:** All submissions with timestamps.

---

## 9. Security & Privacy

- **PII fields:** name, phone, message.
- **Encryption:** HTTPS in transit; encrypt sensitive fields at rest (decide strategy in doc 05).
- **Secrets:** Environment variables.
- **Abuse:** Rate limiting on lead endpoint.

---

## 10. Performance Considerations

- Pagination: N/A for lead submission.
- **Queries:** Index on phone.
- Caching: N/A.
- **Load:** Moderate traffic, business-hour peaks.

---

## 11. Testing Plan

- Unit: API logic, validation.
- Integration: end-to-end lead submission.
- E2E: user submits lead, receives confirmation.
- Mocks: lead test data.

---

## 12. Implementation Plan

### Backend (ordered)

1. Set up Node.js/Express server.  
2. Implement `POST /api/leads`.  
3. Integrate MySQL + migrations.  
4. Validation and error handling.  
5. Rate limiting, logging (PII-aware).  
6. GA: only if server-side tracking is required; else client-only.

### Frontend (ordered)

1. React components per page.  
2. Form submission to API.  
3. WhatsApp and phone buttons (`tel:` / `wa.me`).  
4. Responsive (mobile-first).  

### Risks

- Integration issues.  
- Design/implementation misalignment.

### Rollout

- Phased: core pages first.  
- Feature flags for new functionality.  
- Monitor performance and feedback post-launch.

---

## Cross-Reference: Routes (Client)

| Page | Path |
|------|------|
| Home | `/` |
| About | `/about` |
| Projects | `/projects` |
| Clients | `/clients` |
| Testimonials | `/testimonials` |
| Contact | `/contact` |
