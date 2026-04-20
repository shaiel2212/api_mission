# Server Specification: אתר ארטל בניה ופיתוח

אפיון שכבת השרת (Backend). המקור באנגלית.

---

## 1. Server Overview

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

## 2. Backend Architecture

| Topic | Choice |
|--------|--------|
| Runtime | Node.js |
| Framework | Express.js |
| ORM | Sequelize |
| Service structure | Monolithic |
| API style | REST |
| Frontend integration | React.js |
| External integrations (as stated in source spec) | Google Analytics, WhatsApp API, Instagram API |

> **הערת איחוד מסמכים:** לאתר תדמיתי, וואטסאפ ואינסטגרם לרוב ממומשים כקישורים ב־UI. GA4 לרוב בצד הלקוח. ראו [05-open-questions-and-decisions.md](./05-open-questions-and-decisions.md).

### 2.1 Existing Project Structure & Integration

- **Overview:** MISSING — assume standard MVC.
- **Languages/frameworks:** React.js, Node.js, Express, MySQL.
- **Folders:** MISSING — assume standard Node structure.
- **Existing services:** None assumed.
- **Placement:** New project setup.
- **Conventions:** RESTful API conventions.

---

## 3. API Endpoints (REST)

### Lead Submission

| Field | Value |
|--------|--------|
| Method + Path | `POST /api/leads` |
| Description | Submit lead from contact form |
| Authentication | None |
| Authorization | Public |

**Request body**

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

**Errors**

| HTTP | Code | Meaning |
|------|------|---------|
| 400 | LEAD_001 | Validation error |
| 500 | LEAD_002 | Database error |

**Validation:** `name` and `phone` not empty.

**Idempotency:** N/A (per original spec; duplicate-window rule may add behavior — see doc 05).

**Rate limiting:** Required on this endpoint.

**Example**

Request:

```json
{
  "name": "John Doe",
  "phone": "1234567890",
  "message": "Interested in your services."
}
```

Response:

```json
{
  "status": "success",
  "leadId": 101
}
```

---

## 4. Database Schema

### Table: `leads`

| Column | Type | Notes |
|--------|------|--------|
| id | INT, PK, AUTO_INCREMENT | |
| name | VARCHAR(255), NOT NULL | |
| phone | VARCHAR(20), NOT NULL | |
| message | TEXT, NULL | |
| created_at | TIMESTAMP, DEFAULT CURRENT_TIMESTAMP | |

- **Primary key:** id  
- **Foreign keys:** None  
- **Indexes:** Index on `phone` for lookup  
- **Unique constraints:** None  

### Migrations

- Create `leads` table.
- Backfill: N/A  
- Rollback: drop `leads`  

---

## 5. Business Logic & Services

- **Service layer:** Single service for lead management.
- **Rules:** All leads stored in DB.
- **Validation:** Required `name`, `phone`.
- **Transformation:** None.
- **Errors:** Appropriate codes/messages.
- **Transactions:** Not required for single-table insert.

---

## 6. Authentication & Authorization

- No auth for public lead submission.
- Token management: N/A.
- Roles: Public for `POST /api/leads`.
- Middleware: Validate input.

---

## 7. Data Validation

- **Rules:** Non-empty `name`, `phone`.
- **Schema validation:** Joi (or similar).
- **Business rule:** Mitigate duplicate submissions in a short timeframe (define window in decisions doc).
- **Errors:** Clear validation messages.
- **Library:** Joi

---

## 8. Error Handling

- **Types:** Validation, database.
- **Codes:** LEAD_001, LEAD_002.
- **Format:** JSON with `status` and `error` fields (align exact shape with frontend).
- **Logging:** Errors with context.
- **Recovery:** Retry on transient DB errors.
- **UX:** User-friendly messages for validation failures.

---

## 9. Security

- Input sanitization (injection/XSS considerations).
- SQL injection: parameterized queries / ORM.
- XSS: sanitize outputs where applicable.
- CSRF: noted as N/A for public endpoints in source spec — validate against deployment (same-origin vs CORS).
- Rate limiting: on lead endpoint.
- Secrets: environment variables.
- **Transit:** HTTPS.
- **PII:** Original spec mentions encrypting sensitive fields at rest — decide explicitly (see doc 05).

---

## 10. Performance & Scalability

- Query optimization; index on `phone`.
- Caching: N/A for lead submission.
- Pagination: N/A.
- Background jobs: N/A.
- Queues: N/A.
- Load balancing: noted for high availability.
- **Load assumption:** Moderate traffic, peaks in business hours.

---

## 11. Background Jobs & Queues

- N/A across the board in source spec.

---

## 12. Observability & Monitoring

- Log lead submissions and errors.
- Metrics: lead count, API latency.
- Alerts: high error rate on lead endpoint.
- Audit: submissions with timestamps.

---

## 13. Testing Plan

- Unit: endpoint logic, validation.
- Integration: end-to-end lead submission.
- API: contract tests.
- Database: integrity.
- E2E: submit lead → confirmation.
- Mocks: external services including GA where applicable.

---

## 14. Implementation Plan (Backend)

**Ordered tasks**

1. Set up Node.js/Express server.
2. Implement `POST /api/leads`.
3. Integrate MySQL (Sequelize + migrations).
4. Input validation and error handling.
5. Rate limiting and logging policy (PII-safe).

> **הערה:** משימת "Google Analytics tracking" בשרת — לעיתים מיותרת אם GA4 רץ בלבד בדפדפן; ראו doc 05.

**Service order**

1. Lead submission service  
2. Analytics (only if server-side tracking is required)

**Dependencies:** GA setup (usually client), MySQL configuration.

**Risks:** Integration issues; design drift.

**Rollout:** Phased; feature flags for new functionality; post-launch monitoring.
