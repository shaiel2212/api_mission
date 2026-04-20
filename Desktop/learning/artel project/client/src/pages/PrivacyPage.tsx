import { Link } from "react-router-dom";

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-24 text-white">
      <h1 className="mb-6 text-3xl font-black">מדיניות פרטיות</h1>
      <p className="mb-4 text-gray-300">
        פנייה דרך טפסי האתר כוללת שם, טלפון ואופציונלית הודעה. המידע משמש ליצירת קשר בקשר לפרויקט בלבד, לפי החוק
        החל בישראל, ולפי בחירתכם — עדכוני שיווק (אם סימנתם).
      </p>
      <p className="mb-4 text-gray-300">
        אנו עשויים לשמור UTM/מקור ושעת פנייה לשיפור מדידת איכות (לידים) — בלי מכירה לגורמים שלישיים.
      </p>
      <p className="mb-4 text-gray-300">
        Google Analytics מופעל רק אם אישרתם בבנר או בדפדפן; ניתן לבטל בכל עת על ידי מחיקת נתוני אתר (Local
        storage) או בקשה אלינו.
      </p>
      <p className="mt-8 text-sm text-gray-500">
        <Link to="/" className="text-gold hover:underline">
          חזרה לדף הבית
        </Link>
      </p>
    </div>
  );
}
