/**
 * קורא גוף תשובה כ-JSON. אם הגיע HTML (למשל דף 404 מ־Vite/Express), זורק שגיאה מובנת במקום `Unexpected token '<'`.
 */
export async function readJsonBody(res: Response): Promise<unknown> {
  const text = await res.text();
  const trimmed = text.trimStart();
  if (!trimmed) {
    throw new Error(`תשובה ריקה מהשרת (${res.status} ${res.statusText}).`);
  }
  if (trimmed.startsWith("<")) {
    const hint =
      res.status === 404
        ? "נראה כמו דף 404 ב-HTML — לרוב השרת על פורט 3001 ללא הראוטים החדשים (/api/marketing). עצור Node והפעל מחדש `npm run dev` מתיקיית server של הפרויקט."
        : "התקבלה תשובת HTML במקום JSON — בדוק ש־VITE_API_BASE_URL (אם מוגדר) מצביע לשרת ה-API ולא לכתובת הפרונט.";
    throw new Error(`${hint} (סטטוס ${res.status})`);
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new Error(`תשובה שאינה JSON תקין (${res.status}). תחילת התשובה: ${trimmed.slice(0, 80)}…`);
  }
}
