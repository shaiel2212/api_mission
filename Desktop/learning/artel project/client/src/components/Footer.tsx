import { Link } from "react-router-dom";
import { site, whatsappHref, instagramHref } from "../config/site";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-white/10 bg-darkGray">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-12 md:grid-cols-3">
          <div>
            <div className="mb-4 text-xl font-bold">
              ארטל<span className="text-gold">.</span>
            </div>
            <p className="text-sm leading-relaxed text-gray-400">
              ניהול וביצוע פרויקטי בנייה ושיפוץ בסטנדרט יוקרתי — אמינות, שקיפות ועמידה בלוחות זמנים.
            </p>
          </div>
          <div>
            <div className="mb-4 text-sm font-semibold text-gold">קישורים</div>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>
                <Link className="hover:text-white" to="/about">
                  אודות
                </Link>
              </li>
              <li>
                <Link className="hover:text-white" to="/projects">
                  פרויקטים
                </Link>
              </li>
              <li>
                <Link className="hover:text-white" to="/clients">
                  לקוחות
                </Link>
              </li>
              <li>
                <Link className="hover:text-white" to="/testimonials">
                  המלצות
                </Link>
              </li>
              <li>
                <Link className="hover:text-white" to="/contact">
                  צור קשר
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <div className="mb-4 text-sm font-semibold text-gold">יצירת קשר</div>
            <p className="text-sm text-gray-300">
              טלפון:{" "}
              <a className="text-white hover:text-gold" href={site.phoneTelHref}>
                {site.phoneDisplay}
              </a>
            </p>
            <p className="mt-2 text-sm text-gray-300">
              <a className="text-white hover:text-gold" href={whatsappHref()}>
                וואטסאפ
              </a>
              {" · "}
              <a
                className="text-white hover:text-gold"
                href={instagramHref()}
                target="_blank"
                rel="noopener noreferrer"
              >
                אינסטגרם
              </a>
            </p>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-8 text-sm text-gray-500 md:flex-row">
          <div className="flex flex-wrap items-center justify-center gap-4 text-gray-500">
            <Link to="/privacy" className="hover:text-white">
              פרטיות
            </Link>
            <span aria-hidden="true" className="text-gray-600">
              |
            </span>
            <Link to="/terms" className="hover:text-white">
              תנאי שימוש
            </Link>
            <span aria-hidden="true" className="text-gray-600">
              |
            </span>
            <Link to="/accessibility" className="hover:text-white">
              נגישות
            </Link>
          </div>
          <span>
            © {year} {site.companyName}. כל הזכויות שמורות.
          </span>
        </div>
      </div>
    </footer>
  );
}
