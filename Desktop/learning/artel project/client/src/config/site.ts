/** תוכן ומיתוג — מותאם ל־BRD. מספרי וואטסאפ/אינסטגרם דרך משתני סביבה. */

export const site = {
  companyName: "ארטל בניה ופיתוח",
  groupLine: "מקבוצת ארטל",
  phoneDisplay: "1700-70-800",
  /** קישור חיוג — 1700-70-800 לפי BRD (לוודא מול הלקוח אם נדרש תבנית אחרת) */
  phoneTelHref: "tel:170070800",
  email: "office@artel-build.co.il",
  address: "יש להחליף בכתובת המשרד האמיתית",
  heroTitleLines: ["ארטל בניה ופיתוח", "מקבוצת ארטל"],
  heroSubtitle:
    "ניהול וביצוע פרויקטים ברמת גימור בלתי מתפשרת עם אמינות, שקיפות ועמידה בלוחות זמנים",
  summary:
    "מעל 20 שנות ניסיון בניהול וביצוע פרויקטי בנייה ושיפוץ מורכבים, ללקוחות פרטיים, מסחריים וגופים ציבוריים.",
} as const;

export function whatsappHref(): string {
  const raw = import.meta.env.VITE_WHATSAPP_E164 || "972501234567";
  const digits = raw.replace(/\D/g, "");
  return `https://wa.me/${digits}`;
}

export function instagramHref(): string {
  return import.meta.env.VITE_INSTAGRAM_URL || "https://www.instagram.com/";
}
