import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { site, whatsappHref } from "../config/site";
import ContactForm from "../components/ContactForm";
import { listProjects, type ProjectRecord } from "../api/projects";
import {
  defaultProjectStillImage as defaultHeroImage,
  getYouTubeEmbedSrc,
  getYouTubeVideoId,
  isDirectVideoAsset,
  pickProjectCoverImage,
} from "../lib/projectMedia";

function heroVideoStorageKey(mediaUrl: string): string {
  return `artel:heroVideoConsumed:v1:${encodeURIComponent(mediaUrl)}`;
}

function readHeroVideoConsumed(mediaUrl: string): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return window.localStorage.getItem(heroVideoStorageKey(mediaUrl)) === "1";
  } catch {
    return false;
  }
}

function writeHeroVideoConsumed(mediaUrl: string): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(heroVideoStorageKey(mediaUrl), "1");
  } catch {
    // ignore
  }
}

type YouTubePlayer = {
  destroy: () => void;
};

type YouTubeNamespace = {
  Player: new (
    elementId: string,
    options: {
      videoId: string;
      playerVars?: Record<string, string | number>;
      events?: {
        onStateChange?: (event: { data: number }) => void;
        onError?: () => void;
      };
    }
  ) => YouTubePlayer;
};

declare global {
  interface Window {
    YT?: YouTubeNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

function loadYouTubeIframeApi(): Promise<YouTubeNamespace> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("YouTube API is only available in the browser."));
      return;
    }

    if (window.YT?.Player) {
      resolve(window.YT);
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>('script[src="https://www.youtube.com/iframe_api"]');
    if (existing) {
      const start = Date.now();
      const timer = window.setInterval(() => {
        if (window.YT?.Player) {
          window.clearInterval(timer);
          resolve(window.YT);
          return;
        }

        if (Date.now() - start > 15000) {
          window.clearInterval(timer);
          reject(new Error("Timed out waiting for YouTube iframe API."));
        }
      }, 50);

      return;
    }

    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    tag.async = true;
    tag.onerror = () => reject(new Error("Failed to load YouTube iframe API."));

    const previousReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previousReady?.();
      if (window.YT?.Player) {
        resolve(window.YT);
      } else {
        reject(new Error("YouTube iframe API loaded without YT.Player."));
      }
    };

    document.head.appendChild(tag);
  });
}

const fallbackServiceCards = [
  {
    title: "בנייה פרטית ויוקרה",
    description:
      "הקמת וילות ובתי יוקרה מאפס, תוך הקפדה על חומרי גלם משובחים ורמת גימור ללא פשרות.",
    image:
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2053&q=80",
    icon: "🏠",
    raised: false,
  },
  {
    title: "משרדים וחללי עבודה",
    description:
      "עיצוב וביצוע של חללי עבודה מודרניים, משרדי הייטק ומתחמי מסחר המעודדים פרודוקטיביות.",
    image:
      "https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2069&q=80",
    icon: "🏢",
    raised: true,
  },
  {
    title: "שיפוצי יוקרה מורכבים",
    description:
      "חידוש ושדרוג מבנים קיימים ברמת פרימיום, טיפול בתשתיות והפיכת חלל ישן ליצירת מופת.",
    image:
      "https://images.unsplash.com/photo-1503387762-592deb58ef4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2071&q=80",
    icon: "🔨",
    raised: false,
  },
] as const;

export default function HomePage() {
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [heroVideoConsumed, setHeroVideoConsumed] = useState(false);
  /** דחיית טעינת YouTube עד idle — שיפור LCP/INP */
  const [ytReadyToLoad, setYtReadyToLoad] = useState(false);
  const youtubePlayerRef = useRef<YouTubePlayer | null>(null);
  const youtubeHasStartedRef = useRef(false);
  const youtubePlayerDomId = useId().replace(/:/g, "");
  const youtubePlayerElementIdRef = useRef<string | null>(null);
  const youtubeDetachRafRef = useRef<number | null>(null);

  const destroyYoutubePlayer = () => {
    if (youtubeDetachRafRef.current !== null) {
      window.cancelAnimationFrame(youtubeDetachRafRef.current);
      youtubeDetachRafRef.current = null;
    }

    youtubePlayerRef.current?.destroy();
    youtubePlayerRef.current = null;

    const elementId = youtubePlayerElementIdRef.current;
    youtubePlayerElementIdRef.current = null;

    if (!elementId) {
      return;
    }

    // YouTube's destroy() removes the iframe asynchronously; clearing the host element avoids a transient "black box"
    // covering the hero image right when we switch back to the default background.
    const host = document.getElementById(elementId);
    if (host) {
      host.innerHTML = "";
    }

    youtubeDetachRafRef.current = window.requestAnimationFrame(() => {
      youtubeDetachRafRef.current = null;
      const hostAgain = document.getElementById(elementId);
      if (hostAgain) {
        hostAgain.innerHTML = "";
      }
    });
  };

  useEffect(() => {
    let mounted = true;
    void listProjects()
      .then((items) => {
        if (mounted) {
          setProjects(items);
        }
      })
      .catch((e) => {
        console.error("Failed to load projects for home page:", e.message);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const homeProjects = useMemo(() => {
    const featured = projects.filter((p) => p.featuredOnHome);
    const pool = featured.length > 0 ? featured : projects;

    const withVideoHero = pool.find((p) => {
      const media = p.afterImage;
      return Boolean(getYouTubeEmbedSrc(media) || isDirectVideoAsset(media));
    });

    return (withVideoHero ? [withVideoHero, ...pool.filter((p) => p.id !== withVideoHero.id)] : pool).slice(0, 3);
  }, [projects]);

  /** פרויקט נוסף לתצוגה מתחת לכרטיסי תחומי ההתמחות (לא אחד משלושת הכרטיסים, כשאפשר). */
  const servicesSpotlight = useMemo(() => {
    if (projects.length === 0) {
      return null;
    }

    const homeIds = new Set(homeProjects.map((p) => p.id));
    const candidate =
      projects.find((p) => !homeIds.has(p.id)) ?? projects[3] ?? projects[projects.length - 1];

    const imageCandidates = [candidate.modalImage, candidate.afterImage, candidate.image];
    const imageUrl =
      imageCandidates.find((url) => url && !isDirectVideoAsset(url) && !getYouTubeVideoId(url)) ?? null;

    if (!imageUrl) {
      return null;
    }

    return { project: candidate, imageUrl };
  }, [projects, homeProjects]);

  const heroMedia = homeProjects[0]?.afterImage || defaultHeroImage;

  useEffect(() => {
    setHeroVideoConsumed(readHeroVideoConsumed(heroMedia));
    youtubeHasStartedRef.current = false;
  }, [heroMedia]);

  const heroBackgroundMedia = heroVideoConsumed ? defaultHeroImage : heroMedia;
  const heroYouTubeVideoId = useMemo(() => getYouTubeVideoId(heroMedia), [heroMedia]);
  const heroMediaIsYouTube = Boolean(heroYouTubeVideoId);
  const heroMediaIsDirectVideo = isDirectVideoAsset(heroBackgroundMedia);

  useEffect(() => {
    setYtReadyToLoad(false);
  }, [heroYouTubeVideoId]);

  useEffect(() => {
    if (!heroMediaIsYouTube || heroVideoConsumed || !heroYouTubeVideoId) {
      return;
    }
    let cancelled = false;
    const useIdle =
      typeof window.requestIdleCallback === "function" &&
      typeof window.cancelIdleCallback === "function";
    const idleId: number | ReturnType<typeof setTimeout> = useIdle
      ? window.requestIdleCallback(
          () => {
            if (!cancelled) {
              setYtReadyToLoad(true);
            }
          },
          { timeout: 2800 }
        )
      : window.setTimeout(() => {
          if (!cancelled) {
            setYtReadyToLoad(true);
          }
        }, 1800);
    return () => {
      cancelled = true;
      if (useIdle) {
        window.cancelIdleCallback(idleId as number);
      } else {
        window.clearTimeout(idleId);
      }
    };
  }, [heroMediaIsYouTube, heroVideoConsumed, heroYouTubeVideoId]);

  useEffect(() => {
    let cancelled = false;

    destroyYoutubePlayer();

    if (heroVideoConsumed || !heroMediaIsYouTube || !heroYouTubeVideoId || !ytReadyToLoad) {
      return () => {
        cancelled = true;
        destroyYoutubePlayer();
      };
    }

    const playerElementId = `hero-youtube-player-${heroYouTubeVideoId}-${youtubePlayerDomId}`;
    youtubePlayerElementIdRef.current = playerElementId;

    void loadYouTubeIframeApi()
      .then((YT) => {
        if (cancelled) {
          return;
        }

        destroyYoutubePlayer();

        youtubePlayerRef.current = new YT.Player(playerElementId, {
          videoId: heroYouTubeVideoId,
          playerVars: {
            autoplay: 1,
            mute: 1,
            playsinline: 1,
            controls: 0,
            rel: 0,
            modestbranding: 1,
            iv_load_policy: 3,
            origin: window.location.origin,
          },
          events: {
            onStateChange: (event) => {
              // YT.PlayerState: PLAYING = 1, ENDED = 0
              if (event.data === 1) {
                youtubeHasStartedRef.current = true;
              }

              if (event.data === 0 && youtubeHasStartedRef.current) {
                writeHeroVideoConsumed(heroMedia);
                destroyYoutubePlayer();
                setHeroVideoConsumed(true);
              }
            },
            onError: () => {
              // If embedding fails, fall back to default hero image.
              writeHeroVideoConsumed(heroMedia);
              destroyYoutubePlayer();
              setHeroVideoConsumed(true);
            },
          },
        });
      })
      .catch(() => {
        // If the iframe API can't load, keep the default hero image without marking the video as "consumed".
        setHeroVideoConsumed(true);
      });

    return () => {
      cancelled = true;
      destroyYoutubePlayer();
    };
  }, [heroMedia, heroMediaIsYouTube, heroVideoConsumed, heroYouTubeVideoId, youtubePlayerDomId, ytReadyToLoad]);

  const markHeroVideoConsumed = () => {
    writeHeroVideoConsumed(heroMedia);
    setHeroVideoConsumed(true);
  };

  const serviceCards = homeProjects.length
    ? homeProjects.map((project, index) => ({
        title: project.title,
        description: project.description || project.subtitle,
        image: pickProjectCoverImage(project),
        icon: ["🏠", "🏢", "🔨"][index] || "🏗",
        raised: index === 1,
      }))
    : fallbackServiceCards;

  return (
    <>
      <section id="hero" className="group relative flex min-h-screen items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          {heroMediaIsYouTube && heroYouTubeVideoId && !heroVideoConsumed ? (
            <div className="pointer-events-none absolute inset-0">
              <img
                src={defaultHeroImage}
                alt=""
                className="absolute inset-0 h-full w-full object-cover opacity-78"
                decoding="async"
                fetchPriority="high"
              />
              <div className="absolute inset-0 opacity-78">
                <div
                  id={`hero-youtube-player-${heroYouTubeVideoId}-${youtubePlayerDomId}`}
                  className="absolute left-1/2 top-1/2 h-[120%] w-[120%] max-w-none -translate-x-1/2 -translate-y-1/2 overflow-hidden bg-black"
                />
              </div>
            </div>
          ) : heroMediaIsDirectVideo ? (
            <video
              src={heroBackgroundMedia}
              autoPlay
              muted
              loop={false}
              playsInline
              poster={defaultHeroImage}
              onEnded={markHeroVideoConsumed}
              className="h-full w-full object-cover opacity-78"
            />
          ) : (
            <img
              src={heroBackgroundMedia}
              alt=""
              className="h-full w-full object-cover opacity-78"
              decoding="async"
              fetchPriority="high"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/20 to-transparent" />
        </div>

        <div className="relative z-10 mx-auto mt-20 max-w-4xl px-6 text-center">
          <span className="mb-6 inline-block rounded-full border border-gold/30 bg-black/50 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-gold backdrop-blur-sm">
            מעל 20 שנות מצוינות
          </span>
          <h1 className="mb-6 text-5xl font-bold leading-tight text-white md:text-7xl">
            בונים את המחר,
            <br />
            <span className="bg-gradient-to-r from-gold to-yellow-200 bg-clip-text text-transparent">
              בסטנדרט של היום.
            </span>
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-gray-300 md:text-xl">
            התמחות בשיפוצי יוקרה, חללי עבודה מתקדמים ובנייה פרטית ללא פשרות. מלווים אותך משלב החזון ועד למפתח.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href={whatsappHref()}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full rounded bg-gold px-8 py-4 text-center font-bold text-black shadow-[0_0_20px_rgba(212,175,55,0.3)] transition-all hover:-translate-y-1 hover:bg-white sm:w-auto"
            >
              התחל פרויקט
            </a>
            <Link
              to="/projects"
              className="flex w-full items-center justify-center gap-3 rounded border border-white/20 bg-transparent px-8 py-4 font-medium text-white transition-all hover:bg-white/5 sm:w-auto"
            >
              <span className="text-gold">▶</span>
              צפה בתיק עבודות
            </Link>
          </div>
        </div>

        <button
          type="button"
          onClick={() => document.getElementById("stats")?.scrollIntoView({ behavior: "smooth" })}
          className="motion-safe:animate-bounce absolute bottom-10 left-1/2 flex -translate-x-1/2 flex-col items-center"
          aria-label="גלול לסעיף סטטיסטיקות"
        >
          <span className="mb-2 text-xs tracking-widest text-gray-400">גלול מטה</span>
          <span className="text-gold" aria-hidden="true">
            ⌄
          </span>
        </button>
      </section>

      <section id="stats" className="relative z-20 border-y border-white/5 bg-darkGray py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-2 gap-8 text-center md:grid-cols-4 md:gap-12">
            <div className="glass-panel rounded-2xl p-6 transition-colors hover:border-gold/30">
              <div className="mb-2 text-4xl font-bold text-gold md:text-5xl">20+</div>
              <div className="text-sm uppercase tracking-wider text-gray-400">שנות ניסיון</div>
            </div>
            <div className="glass-panel rounded-2xl p-6 transition-colors hover:border-gold/30">
              <div className="mb-2 text-4xl font-bold text-white md:text-5xl">150+</div>
              <div className="text-sm uppercase tracking-wider text-gray-400">פרויקטים שהושלמו</div>
            </div>
            <div className="glass-panel rounded-2xl p-6 transition-colors hover:border-gold/30">
              <div className="mb-2 text-4xl font-bold text-white md:text-5xl">100%</div>
              <div className="text-sm uppercase tracking-wider text-gray-400">שביעות רצון</div>
            </div>
            <div className="glass-panel rounded-2xl p-6 transition-colors hover:border-gold/30">
              <div className="mb-2 text-4xl font-bold text-white md:text-5xl">24/7</div>
              <div className="text-sm uppercase tracking-wider text-gray-400">ליווי אישי</div>
            </div>
          </div>
        </div>
      </section>

      <section id="services" className="relative bg-black">
        <div className="pointer-events-none absolute right-0 top-0 h-[500px] w-[500px] translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/5 blur-[120px]" />

        <div className="relative z-10 mx-auto max-w-7xl px-6 pb-16 pt-32 md:pb-20">
          <div className="mb-20 text-center">
            <h2 className="mb-6 text-3xl font-bold text-white md:text-5xl">
              תחומי <span className="text-gold">התמחות</span>
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-gray-400">
              פתרונות בנייה מקיפים המותאמים לסטנדרטים הגבוהים ביותר
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {serviceCards.map((card) => (
              <article
                key={card.title}
                className={[
                  "glass-panel group relative overflow-hidden rounded-2xl border border-white/5 transition-all duration-500 hover:border-gold/50",
                  card.raised ? "md:-translate-y-8" : "",
                ].join(" ")}
              >
                <div className="h-64 overflow-hidden">
                  <img
                    src={card.image}
                    alt={`${card.title} — תמונה מייצגת לתחום ההתמחות`}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <div className="relative p-8">
                  <div className="absolute -top-6 right-8 flex h-12 w-12 items-center justify-center rounded-full border border-gold/30 bg-black text-xl text-gold shadow-[0_0_15px_rgba(212,175,55,0.2)]">
                    {card.icon}
                  </div>
                  <h3 className="mb-4 mt-2 text-2xl font-bold text-white">{card.title}</h3>
                  <p className="mb-6 leading-relaxed text-gray-400">{card.description}</p>
                  <Link to="/projects" className="inline-flex items-center font-medium text-gold transition-colors hover:text-white">
                    קרא עוד <span className="mr-2 text-sm">←</span>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>

        {servicesSpotlight ? (
          <Link
            to="/projects"
            className="group relative flex min-h-screen w-full items-center justify-center overflow-hidden"
          >
            <div className="absolute inset-0 z-0">
              <img
                src={servicesSpotlight.imageUrl}
                alt={servicesSpotlight.project.title}
                className="h-full w-full object-cover opacity-78 transition-transform duration-[1.2s] ease-out group-hover:scale-105"
                loading="lazy"
                decoding="async"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/20 to-transparent" />
            </div>

            <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-gold">מפרויקטים שלנו</p>
              <h2 className="mb-4 text-4xl font-bold leading-tight text-white md:text-6xl">{servicesSpotlight.project.title}</h2>
              <p className="inline-flex items-center text-lg font-medium text-gray-200 transition-colors group-hover:text-white">
                לתיק העבודות המלא
                <span className="mr-2 text-gold transition-transform group-hover:-translate-x-1">←</span>
              </p>
            </div>
          </Link>
        ) : null}
      </section>

      <section id="contact" className="relative overflow-hidden border-t border-white/10 bg-darkGray">
        <div className="absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-gold to-transparent opacity-50" />

        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            <div>
              <h2 className="mb-6 text-4xl font-bold text-white">
                מוכנים להתחיל <span className="text-gold">לבנות?</span>
              </h2>
              <p className="mb-10 text-lg leading-relaxed text-gray-400">
                השאירו פרטים ונחזור אליכם בהקדם לשיחת ייעוץ ראשונית ללא התחייבות. המומחים שלנו כאן כדי להפוך את החזון שלכם למציאות.
              </p>

              <div className="space-y-6">
                <div className="group flex cursor-pointer items-center gap-4">
                  <div className="glass-panel flex h-12 w-12 items-center justify-center rounded-full text-gold transition-all group-hover:bg-gold group-hover:text-black">
                    ☎
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">התקשרו אלינו</div>
                    <a href={site.phoneTelHref} className="text-lg font-medium text-white hover:text-gold">
                      {site.phoneDisplay}
                    </a>
                  </div>
                </div>
                <div className="group flex cursor-pointer items-center gap-4">
                  <div className="glass-panel flex h-12 w-12 items-center justify-center rounded-full text-gold transition-all group-hover:bg-gold group-hover:text-black">
                    ✉
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">שלחו מייל</div>
                    <a href={`mailto:${site.email}`} className="text-lg font-medium text-white hover:text-gold">
                      {site.email}
                    </a>
                  </div>
                </div>
                <div className="group flex cursor-pointer items-center gap-4">
                  <div className="glass-panel flex h-12 w-12 items-center justify-center rounded-full text-gold transition-all group-hover:bg-gold group-hover:text-black">
                    ⌖
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">משרד ראשי</div>
                    <div className="text-lg font-medium text-white">מגדלי ב.ס.ר, תל אביב</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-panel relative rounded-2xl border border-white/10 p-8 md:p-10">
              <div className="pointer-events-none absolute -right-4 -top-4 h-24 w-24 rounded-full bg-gold/10 blur-xl" />
              <h3 className="mb-8 text-2xl font-bold text-white">בקשת הצעת מחיר</h3>
              <ContactForm />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
