import { useEffect, useState } from "react";
import { NavLink, Link, useLocation } from "react-router-dom";
import { HiOutlinePhone } from "react-icons/hi2";
import { useSite } from "../context/SiteSettingsContext";

const mainNav = [
  { to: "/", label: "דף הבית" },
  { to: "/about", label: "אודות" },
  { to: "/projects", label: "פרויקטים" },
  { to: "/clients", label: "לקוחות" },
  { to: "/testimonials", label: "המלצות" },
];

/** שורת תחומי התמחות להצגה בלבד מתחת לטאגליין */
const headerBullets = ["שיפוצי יוקרה", "בנייה פרטית", " משרדים וחללים מסחריים"] as const;

/** תת־ניווט בתפריט המובייל */
const subNav = [
  { href: "/projects?cat=renovation#project-grid", label: "שיפוצי יוקרה" },
  { href: "/projects?cat=construction#project-grid", label: "בנייה פרטית" },
  { href: "/projects?cat=office#project-grid", label: "משרדים וחללים" },
] as const;

function linkClass({ isActive }: { isActive: boolean }) {
  return [
    "text-nav font-medium transition-colors border-b pb-1",
    isActive ? "text-gold border-gold" : "text-textSecondary border-transparent hover:text-textPrimary",
  ].join(" ");
}

const subNavClass =
  "text-nav text-textSecondary transition-colors hover:text-textPrimary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-transparent";

export default function Header() {
  const { site } = useSite();
  const { pathname } = useLocation();
  const isHome = pathname === "/";
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const overlayHeader = isHome && !scrolled;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const headerSurface = overlayHeader
    ? "border-transparent bg-black/40 backdrop-blur-[1px]"
    : "border-b border-gold/20 bg-base/75 backdrop-blur-sm";

  return (
    <header
      className={["fixed left-0 right-0 top-0 z-40 w-full min-w-0 transition-colors duration-300", headerSurface].join(
        " ",
      )}
    >
      <div className="section-shell pb-1 pt-2 md:pb-2 md:pt-3">
        <div className="relative flex min-h-[3.25rem] items-center justify-between md:min-h-[3.5rem]">
          <a
            href={site.phoneTelHref}
            className="relative z-10 inline-flex min-h-[44px] items-center gap-2 leading-none text-nav font-medium text-textPrimary transition-colors hover:text-gold md:min-h-0"
          >
            <HiOutlinePhone className="h-4 w-4 shrink-0 text-gold" aria-hidden />
            <span>{site.phoneDisplay}</span>
          </a>

          <Link
            to="/"
            className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 text-center"
          >
            <span className="block font-semibold text-brand-wordmark text-gold">AR-TEL</span>
            <span className="mt-0.5 block text-brand-tagline text-textSecondary">מרגישים את ההבדל</span>
          </Link>

          <div className="relative z-10 flex items-center gap-2 md:gap-4">
            <nav className="hidden items-center justify-end gap-5 md:flex lg:gap-7" aria-label="ניווט ראשי">
              {mainNav.map((item) => (
                <NavLink key={item.to} to={item.to} end={item.to === "/"} className={linkClass}>
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <button
              type="button"
              className="min-h-[44px] min-w-[44px] rounded border border-gold/30 p-2 text-textPrimary md:hidden"
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? "סגור תפריט ניווט" : "פתח תפריט ניווט"}
              onClick={() => setOpen((v) => !v)}
            >
              <span aria-hidden="true">{open ? "✕" : "☰"}</span>
            </button>
          </div>
        </div>

        <div
          className="mt-1 flex items-center justify-center gap-3 border-t border-transparent py-2 text-nav text-textSecondary md:gap-6 md:py-1"
          aria-label="תחומי התמחות"
        >
          {headerBullets.map((label, index) => (
            <span key={label} className="inline-flex items-center gap-3 md:gap-6">
              <span>{label}</span>
              {index < headerBullets.length - 1 ? <span className="text-gold/80" aria-hidden>|</span> : null}
            </span>
          ))}
        </div>
      </div>

      {open ? (
        <div id="mobile-menu" className="border-t border-gold/20 bg-base px-6 py-6 md:hidden">
          <div className="flex flex-col gap-4">
            <p className="text-nav font-semibold text-gold">ניווט ראשי</p>
            {mainNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                onClick={() => setOpen(false)}
                className={linkClass}
              >
                {item.label}
              </NavLink>
            ))}
            <p className="mt-2 text-nav font-semibold text-gold">תחומי התמחות</p>
            {subNav.map((item) => (
              <a key={`m-${item.label}`} href={item.href} className={subNavClass} onClick={() => setOpen(false)}>
                {item.label}
              </a>
            ))}
            <NavLink
              to="/contact"
              onClick={() => setOpen(false)}
              className="mt-2 border border-gold py-3 text-center text-nav font-semibold text-gold"
            >
              צור קשר
            </NavLink>
          </div>
        </div>
      ) : null}
    </header>
  );
}
