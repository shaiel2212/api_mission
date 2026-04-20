import { Link } from "react-router-dom";
import { site } from "../config/site";

export default function AccessibilityPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-24 text-white">
      <h1 className="mb-6 text-3xl font-black">הצהרת נגישות</h1>
      <p className="mb-4 text-gray-300">
        {site.companyName} מחויבת להנגשת האתר לאנשים עם מוגבלויות, בהתאם לחוק שוויון זכויות לאנשים עם
        מוגבלות, התשנ&quot;ח-1998, ולתקן הישראלי ת&quot;י 5568 המבוסס על הנחיות WCAG 2.0/2.1. אנו משקיעים
        מאמץ שתוכן האתר יהיה נגיש, ברור ונוח לשימוש בדפדפנים ובטכנולוגיות מסייעות נפוצות.
      </p>
      <p className="mb-4 text-gray-300">
        <strong className="text-white">רמת העמידה הנוכחית:</strong> האתר נבנה בהתאם לעקרונות נגישות (מבנה
        סמנטי, ניווט במקלדת, תוויות לטפסים, ניגודיות, טקסט חלופי לתמונות מידעיות). אנו שואפים לעמידה ברמה{" "}
        <abbr title="Double-A">AA</abbr> של WCAG 2.1 בדפים ובזרימות המרכזיות, וממשיכים לשפר בהתאם לבדיקות
        תקופתיות.
      </p>
      <h2 className="mb-3 mt-10 text-xl font-bold text-white">דרכי פנייה בנושא נגישות</h2>
      <p className="mb-4 text-gray-300">
        אם נתקלתם בליקוי נגישות (למשל: קישור שלא עובד, תמונה ללא טקסט חלופי, בעיה בניווט במקלדת), נשמח
        שתעדכנו אותנו — נטפל בבדיקה ותיקון בהתאם לאופי התקלה.
      </p>
      <ul className="mb-6 list-disc space-y-2 pr-5 text-gray-300">
        <li>
          דוא&quot;ל:{" "}
          <a className="text-gold underline hover:text-white" href={`mailto:${site.email}?subject=פנייה בנושא נגישות`}>
            {site.email}
          </a>{" "}
          (נא לציין &quot;נגישות&quot; בנושא ההודעה)
        </li>
        <li>
          טלפון:{" "}
          <a className="text-gold underline hover:text-white" href={site.phoneTelHref}>
            {site.phoneDisplay}
          </a>
        </li>
        <li>
          טופס באתר:{" "}
          <Link to="/contact" className="text-gold underline hover:text-white">
            צור קשר
          </Link>
        </li>
      </ul>
      <h2 className="mb-3 mt-10 text-xl font-bold text-white">זמני טיפול (יעד פנימי)</h2>
      <p className="mb-4 text-gray-300">
        פנייה בנושא נגישות תיענה בדוא&quot;ל תוך <strong className="text-white">עד 10 ימי עסקים</strong> ממועד
        קבלת הפנייה המלאה. טיפול מעשי בליקוי תלוי במורכבות; נעדכן אם נדרש זמן נוסף.
      </p>
      <p className="mb-4 text-sm text-gray-500">
        ייעוץ משפטי או התאמות ספציפיות נוספות — לפי הצורך ולשיקול דעת מקצועי. מסמך זה אינו מהווה ייעוץ משפטי.
      </p>
      <p className="mt-8 text-sm text-gray-500">
        <Link to="/" className="text-gold hover:underline">
          חזרה לדף הבית
        </Link>
      </p>
    </div>
  );
}
