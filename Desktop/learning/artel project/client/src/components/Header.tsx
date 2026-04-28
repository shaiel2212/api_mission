import { useEffect, useState } from "react";
import { NavLink, Link } from "react-router-dom";

const nav = [
  { to: "/", label: "דף הבית", end: true },
  { to: "/about", label: "אודות" },
  { to: "/projects", label: "פרויקטים" },
  { to: "/clients", label: "לקוחות" },
  { to: "/testimonials", label: "המלצות" },
];

function linkClass({ isActive }: { isActive: boolean }) {
  return [
    "text-sm font-medium transition-colors border-b-2 pb-1",
    isActive ? "text-gold border-gold" : "text-gray-300 border-transparent hover:text-gold",
  ].join(" ");
}

export default function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

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

  return (
    <header
      className={[
        "fixed top-0 z-40 w-full transition-colors duration-300",
        scrolled ? "bg-black/95 backdrop-blur-md" : "glass-panel",
      ].join(" ")}
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2 text-2xl font-bold tracking-wider text-white">
          <span className="text-gold" aria-hidden="true">
            ▣
          </span>
          ארטל<span className="text-gold">.</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="ניווט ראשי">
          {nav.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={linkClass}>
              {item.label}
            </NavLink>
          ))}
          <NavLink
            to="/contact"
            className="flex items-center gap-2 rounded bg-gold px-6 py-2.5 text-sm font-bold text-black hover:bg-white"
          >
            צור קשר
            <span aria-hidden="true">←</span>
          </NavLink>
        </nav>

        <button
          type="button"
          className="min-h-[44px] min-w-[44px] rounded p-2 text-white md:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "סגור תפריט ניווט" : "פתח תפריט ניווט"}
          onClick={() => setOpen((v) => !v)}
        >
          <span aria-hidden="true">{open ? "✕" : "☰"}</span>
        </button>
      </div>

      {open ? (
        <div
          id="mobile-menu"
          className="border-t border-white/10 bg-black/98 px-6 py-6 md:hidden"
        >
          <div className="flex flex-col gap-4">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setOpen(false)}
                className={linkClass}
              >
                {item.label}
              </NavLink>
            ))}
            <NavLink
              to="/contact"
              onClick={() => setOpen(false)}
              className="mt-2 rounded bg-gold py-3 text-center text-sm font-bold text-black"
            >
              צור קשר
            </NavLink>
          </div>
        </div>
      ) : null}
    </header>
  );
}
