import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const STORAGE_KEY = "artel:consent:analytics";
const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined;

/**
 * בנר הסכמה לניתוח (GA4) — נטען רק אם הוגדר VITE_GA_MEASUREMENT_ID.
 */
export default function ConsentBanner() {
  const [status, setStatus] = useState<"unknown" | "granted" | "denied">("unknown");
  const [gaReady, setGaReady] = useState(false);

  useEffect(() => {
    if (!MEASUREMENT_ID || !String(MEASUREMENT_ID).startsWith("G-")) {
      return;
    }
    const s = localStorage.getItem(STORAGE_KEY);
    if (s === "granted" || s === "denied") {
      setStatus(s);
    } else {
      setStatus("unknown");
    }
  }, []);

  useEffect(() => {
    if (!MEASUREMENT_ID || status !== "granted" || gaReady) {
      return;
    }
    const w = window as unknown as { dataLayer: unknown[]; gtag?: (...a: unknown[]) => void };
    w.dataLayer = w.dataLayer || [];
    w.gtag = function gtag() {
      w.dataLayer.push(arguments);
    };
    const s1 = document.createElement("script");
    s1.async = true;
    s1.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
    s1.onload = () => {
      w.gtag?.("js", new Date());
      w.gtag?.("config", MEASUREMENT_ID, { anonymize_ip: true });
      setGaReady(true);
    };
    document.head.appendChild(s1);
  }, [status, gaReady]);

  if (!MEASUREMENT_ID || !String(MEASUREMENT_ID).startsWith("G-")) {
    return null;
  }
  if (status !== "unknown") {
    return null;
  }

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/15 bg-black/95 p-4 text-right text-sm text-gray-200 shadow-lg backdrop-blur"
      role="region"
      aria-label="הסכמה לשימוש בנתוני שימוש"
    >
      <p className="mx-auto max-w-4xl leading-relaxed">
        אנו משתמשים ב-Google Analytics (ללא מעקב אחרי פרטי זיהוי) כדי להבין איך המבקרים משתמשים באתר, רק אם אתם
        מסכימים.{" "}
        <Link to="/privacy" className="text-gold underline hover:text-white">
          מדיניות הפרטיות
        </Link>
      </p>
      <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          className="rounded border border-white/30 px-4 py-2 font-bold text-white hover:bg-white/10"
          onClick={() => {
            localStorage.setItem(STORAGE_KEY, "denied");
            setStatus("denied");
          }}
        >
          דחייה
        </button>
        <button
          type="button"
          className="rounded bg-gold px-4 py-2 font-bold text-black hover:bg-white"
          onClick={() => {
            localStorage.setItem(STORAGE_KEY, "granted");
            setStatus("granted");
          }}
        >
          אישור
        </button>
      </div>
    </div>
  );
}
