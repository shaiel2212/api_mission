import { homeQuotes } from "../data/testimonials";

export default function TestimonialsPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-16 md:py-24">
      <p className="mb-4 text-sm tracking-widest text-gold">המלצות</p>
      <h1 className="mb-6 text-4xl font-bold md:text-5xl">מכתבי המלצה וציטוטים</h1>
      <p className="mb-12 text-gray-400">
        כאן יוצגו <strong className="text-white">סריקות</strong> של מכתבי המלצה (PDF/תמונה) מהלקוחות הבינלאומיים והגופים
        הציבוריים. ניתן להעלות קבצים לתיקיית <code className="text-gold">public/testimonials</code> ולקשר מהרשימה.
      </p>

      <section className="mb-16 border-2 border-gold/40 bg-gradient-to-br from-gold/10 to-transparent p-8 md:p-12">
        <h2 className="mb-4 text-2xl font-bold text-gold md:text-3xl">מכתב מבעלזא</h2>
        <p className="leading-relaxed text-gray-200">
          לפי ה־BRD: אלמנט <strong className="text-white">בולט ומיוחד</strong> לחיזוק אמון ורגש. יש להטמיע כאן את סריקת
          המכתב (תמונה או viewer ל־PDF) כשהקובץ יסופק.
        </p>
        <div className="mt-8 flex min-h-[200px] items-center justify-center border border-dashed border-white/20 bg-black/40 text-gray-500">
          מקום לתצוגת המסמך
        </div>
      </section>

      <h2 className="mb-8 text-2xl font-semibold">ציטוטים קצרים</h2>
      <div className="space-y-6">
        {homeQuotes.map((q) => (
          <blockquote
            key={q.text}
            className="border-r-4 border-gold bg-darkGray/40 px-6 py-5 text-lg text-gray-200"
          >
            {q.text}
          </blockquote>
        ))}
      </div>
    </div>
  );
}
