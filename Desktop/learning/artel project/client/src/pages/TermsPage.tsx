import { Link } from "react-router-dom";

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-24 text-white">
      <h1 className="mb-6 text-3xl font-black">תנאי שימוש</h1>
      <p className="mb-4 text-gray-300">
        תוכן האתר, התמונות והטקסטים מיועדים לתדמית ולידע כללי. הזמנות, הצעות מחיר או היקפי ביצוע נקבעים
        בכתב בהסכמות נפרדות.
      </p>
      <p className="mb-4 text-gray-300">
        השינויים באתר, זמינות הטלפונים/וואטסאפ, והרשאה לתקשורת שיווקית — לפי הצהרה מפורשת ומעודכנת
        (טופס / הסכמה).
      </p>
      <p className="mt-8 text-sm text-gray-500">
        <Link to="/" className="text-gold hover:underline">
          חזרה לדף הבית
        </Link>
      </p>
    </div>
  );
}
