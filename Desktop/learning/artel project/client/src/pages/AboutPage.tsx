import { site } from "../config/site";
import {
  FaComments,
  FaHelmetSafety,
  FaScrewdriverWrench,
  FaKey,
  FaFileContract,
  FaShieldHalved,
  FaAward,
} from "react-icons/fa6";

const values = [
  { icon: "◈", title: "איכות חסרת פשרות", text: "שימוש בחומרים האיכותיים ביותר ורמת גימור קפדנית בכל פרט." },
  { icon: "◉", title: "שקיפות מלאה", text: "תקשורת פתוחה ועדכונים שוטפים לאורך כל שלבי הפרויקט." },
  { icon: "◷", title: "עמידה בזמנים", text: "ניהול קפדני של לוחות הזמנים ומסירה בזמן שנקבע." },
];

type ProcessIconName = "chat" | "tools" | "helmet" | "key";

const processSteps: { no: string; icon: ProcessIconName; title: string; text: string }[] = [
  { no: "01", icon: "chat", title: "פגישת ייעוץ", text: "הבנת הצרכים, החזון ומסגרת התקציב." },
  { no: "02", icon: "tools", title: "תכנון מוקפד", text: "הכנת תוכניות מפורטות ובחירת חומרים." },
  { no: "03", icon: "helmet", title: "ביצוע ופיקוח", text: "ניהול עבודה בשטח עם בקרת איכות מחמירה." },
  { no: "04", icon: "key", title: "מסירת מפתח", text: "בדיקה סופית ומסירת הפרויקט לשביעות רצון מלאה." },
];

type CertificateIconName = "file-contract" | "shield-halved" | "award" | "hard-hat";

const certificates: { icon: CertificateIconName; title: string }[] = [
  { icon: "file-contract", title: "קבלן רשום" },
  { icon: "shield-halved", title: "ביטוח עבודות קבלניות" },
  { icon: "award", title: "תו תקן איכות ISO" },
  { icon: "hard-hat", title: "ממונה בטיחות מוסמך" },
];

function ProcessIcon({ name, className }: { name: ProcessIconName; className?: string }) {
  if (name === "chat") {
    return <FaComments className={className} aria-hidden="true" />;
  }
  if (name === "tools") {
    return <FaScrewdriverWrench className={className} aria-hidden="true" />;
  }
  if (name === "helmet") {
    return <FaHelmetSafety className={className} aria-hidden="true" />;
  }
  return <FaKey className={className} aria-hidden="true" />;
}

function CertificateIcon({ name, className }: { name: CertificateIconName; className?: string }) {
  if (name === "file-contract") return <FaFileContract className={className} aria-hidden="true" />;
  if (name === "shield-halved") return <FaShieldHalved className={className} aria-hidden="true" />;
  if (name === "award") return <FaAward className={className} aria-hidden="true" />;
  return <FaHelmetSafety className={className} aria-hidden="true" />;
}

export default function AboutPage() {
  return (
    <>
      <section id="about-story" className="px-6 pb-24 pt-16 lg:pb-32 lg:pt-28">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
            <div className="relative pl-0 lg:pl-12">
              <div className="absolute bottom-0 right-0 top-0 hidden w-px bg-gold/30 lg:block" />
              <div className="mb-8 flex items-center gap-4">
                <div className="h-px w-12 bg-gold" />
                <span className="font-serif text-sm font-medium uppercase tracking-widest text-gold italic">Our Story</span>
              </div>
              <h1 className="mb-8 font-serif text-4xl font-light leading-tight text-white md:text-5xl lg:text-6xl">
                20+ שנות מצוינות <br />
                <span className="text-gold italic">בבניית יוקרה</span>
              </h1>
              <div className="space-y-6 text-lg font-light leading-relaxed text-gray-400">
                <p>
                  מאז הקמתה, {site.companyName} הציבה סטנדרט חדש בעולם בניית היוקרה בישראל. אנו מתמחים בהפיכת חזונות
                  אדריכליים מורכבים למציאות עוצרת נשימה.
                </p>
                <p>
                  הניסיון העשיר שלנו מאפשר לנו לנווט בהצלחה פרויקטים מאתגרים, החל מווילות פאר ועד למשרדי הייטק
                  יוקרתיים, תוך הענקת שקט נפשי מלא ללקוחותינו לאורך כל התהליך.
                </p>
              </div>
            </div>
            <div className="group relative h-[500px] w-full lg:h-[700px]">
              <div className="absolute inset-0 translate-x-4 translate-y-4 bg-gold/10 transition-transform group-hover:translate-x-6 group-hover:translate-y-6" />
              <img
                className="relative z-10 h-full w-full object-cover grayscale transition-all duration-700 hover:grayscale-0"
                src="https://storage.googleapis.com/uxpilot-auth.appspot.com/3692900c28-26237b395e86c69724dd.png"
                alt="Luxury architecture interior"
              />
            </div>
          </div>
        </div>
      </section>

      <section id="values-process" className="relative border-y border-white/5 bg-darkGray py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-20 text-center">
            <h2 className="mb-4 font-serif text-3xl font-light text-white md:text-4xl">ערכי הליבה שלנו</h2>
            <div className="mx-auto h-px w-24 bg-gold" />
          </div>

          <div className="mb-32 grid grid-cols-1 gap-12 md:grid-cols-3">
            {values.map((value) => (
              <article key={value.title} className="group text-center">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-gold/30 text-2xl text-gold transition-colors group-hover:border-gold">
                  {value.icon}
                </div>
                <h3 className="mb-3 text-xl font-medium text-white">{value.title}</h3>
                <p className="font-light text-gray-400">{value.text}</p>
              </article>
            ))}
          </div>

          <div className="mb-16 text-center">
            <h2 className="mb-4 font-serif text-3xl font-light text-white md:text-4xl">תהליך העבודה</h2>
            <div className="mx-auto h-px w-24 bg-gold" />
          </div>

          <div className="relative mx-auto max-w-5xl">
            <div className="absolute left-0 right-0 top-1/2 z-0 hidden h-px -translate-y-1/2 bg-gold/20 md:block" />
            <div className="relative z-10 grid grid-cols-1 gap-8 md:grid-cols-4">
              {processSteps.map((step) => (
                <article
                  key={step.no}
                  className="group relative border border-white/10 bg-black p-8 text-center transition-colors hover:border-gold/50"
                >
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-black px-2 font-serif italic text-gold">
                    {step.no}
                  </div>
                  <ProcessIcon name={step.icon} className="mx-auto mb-4 h-8 w-8 text-gray-500 transition-colors duration-300 group-hover:text-gold" />
                  <h4 className="mb-2 text-lg font-medium text-white">{step.title}</h4>
                  <p className="text-sm text-gray-400">{step.text}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="about-trust" className="relative bg-black py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div>
            <div className="mb-10 flex items-center gap-4">
              <span className="font-serif text-sm font-medium uppercase tracking-widest text-gold italic">
                Trust & Reliability
              </span>
              <div className="h-px flex-grow bg-white/10" />
            </div>
            <div className="grid grid-cols-2 gap-8 opacity-60 md:grid-cols-4">
              {certificates.map((item) => (
                <article
                  key={item.title}
                  className="flex flex-col items-center justify-center border border-white/5 p-6 text-center transition-all hover:border-gold/30 hover:opacity-100"
                >
                  <CertificateIcon name={item.icon} className="mb-3 h-7 w-7 text-white" />
                  <span className="text-sm text-gray-400">{item.title}</span>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
