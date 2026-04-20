import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import ContactForm from "../components/ContactForm";
import { site, whatsappHref } from "../config/site";
import { listProjects, type ProjectRecord } from "../api/projects";
import {
  getYouTubeEmbedSrcGallery,
  getYouTubeVideoId,
  pickFirstStillImage,
  pickProjectCoverImage,
} from "../lib/projectMedia";

type Category = "all" | "renovation" | "office" | "construction";

const filters: { key: Category; label: string }[] = [
  { key: "all", label: "הכל" },
  { key: "renovation", label: "שיפוץ יוקרה" },
  { key: "office", label: "משרדים" },
  { key: "construction", label: "בניה פרטית" },
];

export default function ProjectsPage() {
  const [cat, setCat] = useState<Category>("all");
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [openProject, setOpenProject] = useState<ProjectRecord | null>(null);
  const [hoveredProjectId, setHoveredProjectId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const dialogTitleId = useId();

  const loadProjects = async () => {
    setLoading(true);
    try {
      const items = await listProjects();
      setProjects(items);
    } catch {
      /* ignore — public gallery */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProjects();
  }, []);

  useEffect(() => {
    if (!openProject) {
      return;
    }
    const raf = requestAnimationFrame(() => {
      closeRef.current?.focus();
    });
    const onDocKey = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") {
        ev.preventDefault();
        setOpenProject(null);
      }
    };
    document.addEventListener("keydown", onDocKey);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onDocKey);
    };
  }, [openProject]);

  const handlePanelKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Tab" || !panelRef.current) {
      return;
    }
    const focusable = [
      ...panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
      ),
    ];
    if (focusable.length === 0) {
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else if (document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const list = useMemo(
    () => (cat === "all" ? projects : projects.filter((p) => p.category === cat)),
    [cat, projects]
  );

  return (
    <>
      <section id="projects-header" className="relative border-b border-white/5 px-6 pb-16 pt-32 lg:pb-24 lg:pt-48">
        <div className="mx-auto max-w-7xl text-center">
          <div className="mb-6 flex items-center justify-center gap-4">
            <div className="h-px w-12 bg-gold" />
            <span className="font-serif text-sm font-medium uppercase tracking-widest text-gold italic">Our Portfolio</span>
            <div className="h-px w-12 bg-gold" />
          </div>
          <h1 className="mb-12 font-serif text-4xl font-light text-white md:text-5xl lg:text-7xl">
            הפרויקטים <span className="text-gold italic">שלנו</span>
          </h1>
          <div className="mx-auto flex max-w-3xl flex-wrap justify-center gap-4 md:gap-8">
            {filters.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setCat(f.key)}
                className={[
                  "border-b-2 px-6 py-2 text-sm font-medium transition-all md:text-base",
                  cat === f.key ? "border-gold text-white" : "border-transparent text-gray-400 hover:border-gold/50 hover:text-gold",
                ].join(" ")}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section id="project-grid" className="px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 gap-x-12 gap-y-24 md:grid-cols-2 lg:grid-cols-2">
            {loading ? <p className="text-gray-300">טוען פרויקטים...</p> : null}
            {list.map((p) => (
              <article
                key={p.id}
                role="button"
                tabIndex={0}
                className="project-card group cursor-pointer"
                aria-label={`פתח פרטי פרויקט: ${p.title}`}
                onClick={() => setOpenProject(p)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setOpenProject(p);
                  }
                }}
                onMouseEnter={() => setHoveredProjectId(p.id)}
                onMouseLeave={() => setHoveredProjectId(null)}
              >
                <div className="relative mb-8 h-[500px] w-full overflow-hidden">
                  <div className="absolute inset-0 z-10 bg-gold/0 transition-colors duration-500 group-hover:bg-gold/10" />
                  <img
                    className={[
                      "h-full w-full object-cover transition-all duration-700",
                      hoveredProjectId === p.id
                        ? "scale-105 grayscale-0 saturate-125"
                        : "scale-100 grayscale saturate-75",
                    ].join(" ")}
                    src={pickProjectCoverImage(p)}
                    alt={p.title}
                  />
                </div>
                <div className="flex items-end justify-between border-t border-white/10 pt-6 transition-colors group-hover:border-gold/50">
                  <div>
                    <h3 className="mb-2 font-serif text-2xl font-light text-white">{p.title}</h3>
                    <p className="text-sm font-light text-gray-400">{p.subtitle}</p>
                  </div>
                  <div className="text-right">
                    <p className="mb-1 font-serif text-sm italic text-gold">{p.year}</p>
                    <p className="text-xs uppercase tracking-widest text-gray-500">{p.location}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="footer" className="relative mt-auto overflow-hidden border-t border-white/10 bg-darkGray">
        <div className="absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-gold to-transparent opacity-50" />
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            <div>
              <div className="mb-4 flex items-center gap-4">
                <span className="font-serif text-sm font-medium uppercase tracking-widest text-gold italic">Get in touch</span>
                <div className="h-px w-12 bg-gold" />
              </div>
              <h2 className="mb-6 text-4xl font-bold text-white md:text-5xl">
                בואו נדבר על <span className="text-gold">הפרויקט הבא</span> שלכם
              </h2>
              <p className="mb-10 text-lg leading-relaxed text-gray-400">השאירו פרטים ונחזור אליכם בהקדם לשיחת ייעוץ ראשונית ללא התחייבות.</p>
              <div className="mb-12 flex flex-col gap-6 sm:flex-row">
                <a
                  href={whatsappHref()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-1 items-center justify-center gap-3 rounded border border-[#25D366]/30 bg-[#25D366]/10 px-6 py-4 font-medium text-[#25D366] transition-all hover:bg-[#25D366] hover:text-black"
                >
                  שלחו הודעת וואטסאפ
                </a>
                <a
                  href={site.phoneTelHref}
                  className="flex flex-1 items-center justify-center gap-3 rounded border border-gold/30 bg-gold/10 px-6 py-4 font-medium text-gold transition-all hover:bg-gold hover:text-black"
                >
                  חייגו עכשיו
                </a>
              </div>
            </div>
            <div className="relative border border-white/10 bg-black p-8 md:p-10">
              <div className="absolute right-0 top-0 h-1 w-full bg-gold" />
              <h3 className="mb-8 text-2xl font-bold text-white">השאירו פרטים</h3>
              <ContactForm />
            </div>
          </div>
        </div>
      </section>

      <div className="fixed bottom-0 left-0 z-50 w-full border-t border-white/10 bg-[#1A1A1A]/90 p-4 backdrop-blur md:hidden">
        <a
          href="#footer"
          className="flex w-full items-center justify-center gap-2 rounded bg-gold py-3.5 font-bold text-black shadow-[0_0_15px_rgba(212,175,55,0.3)]"
        >
          קבעו שיחת ייעוץ <span aria-hidden="true">←</span>
        </a>
      </div>

      {openProject ? (
        <div
          className="visible fixed inset-0 z-50 bg-black/80 opacity-100 backdrop-blur-sm transition-all duration-300"
          role="presentation"
        >
          <div className="absolute inset-0 h-full w-full" onClick={() => setOpenProject(null)} aria-hidden="true" />
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={dialogTitleId}
            className="absolute right-0 top-0 flex h-full w-full translate-x-0 flex-col overflow-y-auto border-l border-white/10 bg-darkGray shadow-2xl transition-transform duration-300 md:w-[800px] lg:w-[1000px]"
            onKeyDown={handlePanelKeyDown}
          >
            <div className="sticky top-0 z-20 flex items-center justify-between border-b border-white/10 bg-darkGray/90 px-8 py-6 backdrop-blur-md">
              <div className="flex items-center gap-4">
                <div className="h-1 w-8 bg-gold" />
                <span className="font-serif text-sm font-medium uppercase tracking-widest text-gold italic">
                  {openProject.subtitle}
                </span>
              </div>
              <button
                type="button"
                ref={closeRef}
                onClick={() => setOpenProject(null)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black text-white transition-colors hover:border-gold hover:text-gold"
                aria-label="סגור"
              >
                <span aria-hidden="true">✕</span>
              </button>
            </div>
            <div className="min-h-0 flex-grow p-8 md:p-12">
                <h2
                  id={dialogTitleId}
                  className="mb-8 font-serif text-4xl font-light text-white md:text-5xl"
                >
                  {openProject.title}
                </h2>
                <div className="mb-12 grid grid-cols-2 gap-6 border-y border-white/10 py-6 md:grid-cols-4">
                  <div>
                    <p className="mb-1 text-xs uppercase tracking-widest text-gray-500">מיקום</p>
                    <p className="font-medium text-white">{openProject.location}</p>
                  </div>
                  <div>
                    <p className="mb-1 text-xs uppercase tracking-widest text-gray-500">היקף</p>
                    <p className="font-medium text-white">
                      {openProject.areaLabel?.trim() || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="mb-1 text-xs uppercase tracking-widest text-gray-500">שנה</p>
                    <p className="font-medium text-white">{openProject.year}</p>
                  </div>
                  <div>
                    <p className="mb-1 text-xs uppercase tracking-widest text-gray-500">אדריכל</p>
                    <p className="font-medium text-white">
                      {openProject.architect?.trim() || "—"}
                    </p>
                  </div>
                </div>
                <div className="group relative mb-12 h-[400px] w-full md:h-[600px]">
                  <img
                    className="h-full w-full object-cover"
                    src={pickFirstStillImage([
                      openProject.modalImage,
                      openProject.image,
                      openProject.beforeImage,
                      openProject.afterImage,
                    ])}
                    alt={openProject.title}
                  />
                  <div className="absolute bottom-4 right-4 border border-white/10 bg-black/80 px-4 py-2 text-xs text-white backdrop-blur">
                    1 / 5
                  </div>
                </div>
                <div className="mb-16 grid grid-cols-1 gap-12 md:grid-cols-3">
                  <div>
                    <h3 className="mb-6 font-serif text-2xl font-light text-white">על הפרויקט</h3>
                    <p className="mb-6 leading-relaxed text-gray-400">{openProject.description || "לא הוזן תיאור לפרויקט זה."}</p>
                  </div>
                  <div>
                    <h3 className="mb-6 font-serif text-2xl font-light text-white">אתגרים ופתרונות</h3>
                    <ul className="space-y-4">
                      <li className="flex gap-3">
                        <span className="mt-1 text-gold">✓</span>
                        <div>
                          <strong className="mb-1 block text-sm text-white">לוגיסטיקה מורכבת</strong>
                          <span className="text-sm text-gray-400">תיאום הנפות ושינוע חומרים לקומות גבוהות.</span>
                        </div>
                      </li>
                      <li className="flex gap-3">
                        <span className="mt-1 text-gold">✓</span>
                        <div>
                          <strong className="mb-1 block text-sm text-white">מערכות מתקדמות</strong>
                          <span className="text-sm text-gray-400">שילוב פתרונות מיזוג ובקרה מתקדמים.</span>
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="mb-16">
                  <h3 className="mb-8 text-center font-serif text-2xl font-light text-white">לפני ואחרי</h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="relative">
                      <img
                        className="h-[300px] w-full object-cover grayscale"
                        src={pickFirstStillImage([
                          openProject.beforeImage,
                          openProject.image,
                          openProject.modalImage,
                        ])}
                        alt={`${openProject.title} לפני`}
                      />
                      <div className="absolute left-4 top-4 border border-white/10 bg-black px-3 py-1 text-xs uppercase tracking-widest text-white">
                        Before
                      </div>
                    </div>
                    <div className="relative">
                      {(() => {
                        const afterVid = getYouTubeVideoId(openProject.afterImage);
                        return afterVid ? (
                        <iframe
                          title={`${openProject.title} — אחרי (וידאו)`}
                          className="h-[300px] w-full bg-black"
                          src={getYouTubeEmbedSrcGallery(afterVid)}
                          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                        />
                      ) : (
                        <img
                          className="h-[300px] w-full object-cover"
                          src={pickFirstStillImage([
                            openProject.afterImage,
                            openProject.modalImage,
                            openProject.image,
                            openProject.beforeImage,
                          ])}
                          alt={`${openProject.title} אחרי`}
                        />
                      );
                      })()}
                      <div className="absolute left-4 top-4 border border-gold bg-gold px-3 py-1 text-xs font-bold uppercase tracking-widest text-black">
                        After
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-auto border-t border-white/10 bg-black p-8 text-center">
                <p className="mb-4 text-white">מעוניינים בפרויקט דומה?</p>
                <a
                  href="#footer"
                  onClick={() => setOpenProject(null)}
                  className="inline-flex items-center gap-2 rounded bg-gold px-8 py-3 font-bold text-black transition-colors hover:bg-white"
                >
                  צרו קשר עכשיו <span aria-hidden="true">←</span>
                </a>
              </div>
            </div>
        </div>
      ) : null}
    </>
  );
}
