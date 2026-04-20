# ארטל בניה ופיתוח — אתר תדמית

מונורפו: **React (Vite)** בצד הקליינט, **Node.js + Express + Sequelize + MySQL** בצד השרת, לפי האפיונים בתיקיית `docs/`.

## דרישות מקדימות

- Node.js 18+
- Docker Desktop (ל־MySQL מקומי), או מופע MySQL משלך

## הרצה מהירה

### 1. MySQL

```powershell
docker compose up -d
```

### 2. שרת

```powershell
cd server
copy .env.example .env
npm install
npm run dev
```

ה־API יאזין ל־`http://localhost:3001`. טבלת `leads` נוצרת אוטומטית (`sync`) בסביבת פיתוח.

### 3. קליינט

טרמינל נפרד:

```powershell
cd client
copy .env.example .env
npm install
npm run dev
```

האתר: `http://localhost:5173` — הפרוקסי של Vite מעביר `/api/*` לשרת.

## משתני סביבה (קליינט)

ערוך `client/.env` — לפחות `VITE_WHATSAPP_E164` (ספרות בינלאומיות, בלי `+`).

## אם השרת לא עולה (`Access denied for user 'artel'`)

- ודא ש־MySQL רץ והפרטים ב־`server/.env` תואמים (ברירת המחדל תואמת ל־`docker-compose.yml`).
- אם יש MySQL מקומי אחר — עדכן `DB_USER` / `DB_PASSWORD` / `DB_NAME` בהתאם.

## Google Analytics (אופציונלי)

הוסף ב־`client/index.html` את תגי GA4 של הלקוח (Measurement ID), או השתמש בתוסף ניהול הסכמה המועדף עליך.

## תיעוד מוצר

ראה `docs/README.md` ואת שאר קבצי ה־Markdown שם.

## סקיצות UX Pilot

קבצי HTML מחולצים: `uxpilot-export-unpacked/` + מיפוי ב־`docs/design/README.md`.
