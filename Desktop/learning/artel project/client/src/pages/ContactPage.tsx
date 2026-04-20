import { site, whatsappHref } from "../config/site";
import ContactForm from "../components/ContactForm";

export default function ContactPage() {
  return (
    <div className="relative overflow-hidden bg-black text-white">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1920&q=80')",
        }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-black/75" aria-hidden="true" />
      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-16 pt-28 lg:flex lg:gap-16 lg:pb-24 lg:pt-36">
        <div className="lg:w-1/2">
          <div className="mb-6 flex items-center gap-4">
            <div className="h-px w-12 bg-gold" />
            <span className="text-sm font-medium tracking-widest text-gold">Contact</span>
          </div>
          <h1 className="mb-8 text-4xl font-black uppercase leading-tight tracking-tight text-white md:text-6xl">
            בואו נדבר
            <br />
            על הפרויקט
            <br />
            שלכם
          </h1>
          <p className="mb-10 max-w-lg text-xl font-light leading-relaxed text-gray-200">
            הצוות של {site.companyName} זמין לייעוץ ראשוני ולתיאום פגישה — ללא התחייבות.
          </p>
          <div className="mb-12 hidden flex-col gap-4 sm:flex-row md:flex">
            <a
              href={whatsappHref()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-1 items-center justify-center gap-2 border border-[#25D366]/40 bg-[#25D366]/10 px-6 py-4 font-medium text-[#25D366] hover:bg-[#25D366] hover:text-black"
            >
              וואטסאפ
            </a>
            <a
              href={site.phoneTelHref}
              className="flex flex-1 items-center justify-center gap-2 border border-gold/50 bg-gold/10 px-6 py-4 font-medium text-gold hover:bg-gold hover:text-black"
            >
              חיוג: {site.phoneDisplay}
            </a>
          </div>
          <div className="space-y-6 border-t border-white/20 pt-10 text-gray-200">
            <p>
              <span className="font-bold text-white">טלפון: </span>
              <a className="hover:text-gold" href={site.phoneTelHref}>
                {site.phoneDisplay}
              </a>
            </p>
            <p>
              <span className="font-bold text-white">דוא״ל: </span>
              <a className="hover:text-gold" href={`mailto:${site.email}`}>
                {site.email}
              </a>
            </p>
            <p>
              <span className="font-bold text-white">כתובת: </span>
              {site.address}
            </p>
          </div>
        </div>

        <div className="mt-12 lg:mt-0 lg:w-1/2">
          <div className="border border-white/20 bg-black/85 p-8 text-white backdrop-blur-sm md:p-12">
            <div className="mb-6 h-1 w-full bg-gold" />
            <h2 className="mb-8 text-2xl font-bold md:text-3xl">השאירו פרטים</h2>
            <ContactForm variant="dark" />
          </div>
        </div>
      </section>
    </div>
  );
}
