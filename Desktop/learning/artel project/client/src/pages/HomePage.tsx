import { useMemo } from "react";
import { useSite } from "../context/SiteSettingsContext";

type HomeServiceCategory = "renovation" | "construction" | "office";

const fallbackHeroImage = "/hero-main.png";

/** תמונות ייעוד לפי סקיצת "תחומי התמחות" (משרדים · בנייה פרטית · שיפוץ) */
const serviceCategoryImages: Record<HomeServiceCategory, string> = {
  office: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80",
  construction: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80",
  renovation: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80",
};

const whyUsKitchenImage =
  "https://images.unsplash.com/photo-1556912173-3bb406ef7e77?auto=format&fit=crop&w=960&q=75";

const aboutLivingImage =
  "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=960&q=75";

export default function HomePage() {
  const { site } = useSite();

  const heroFallback = site.homeHeroFallbackImageUrl?.trim() || fallbackHeroImage;

  const heroImage = heroFallback;

  /** מימין · אמצע · שמאל (RTL) — משרדים, בנייה פרטית, שיפוצי יוקרה */
  const serviceCards = useMemo(
    () =>
      (
        [
          { title: site.homeService3Title, description: site.homeService3Description, category: "office" as const },
          {
            title: site.homeService2Title,
            description: site.homeService2Description,
            category: "construction" as const,
          },
          { title: site.homeService1Title, description: site.homeService1Description, category: "renovation" as const },
        ] as const
      ).map((item) => ({
        ...item,
        image: serviceCategoryImages[item.category],
      })),
    [site],
  );

  const whyUsPoints = useMemo(
    () => site.homeWhyUsBullets.split("\n").map((l) => l.trim()).filter(Boolean),
    [site.homeWhyUsBullets],
  );

  const whyUsImg = site.homeWhyUsImageUrl?.trim() || whyUsKitchenImage;
  const aboutImg = site.homeAboutImageUrl?.trim() || aboutLivingImage;

  return (
    <>
      <section
        id="hero"
        className="relative flex min-h-[100svh] items-stretch overflow-hidden border-b border-gold/30 scroll-mt-24"
      >
        <img
          src={heroImage}
          alt=""
          width={1920}
          height={1080}
          sizes="100vw"
          className="absolute inset-0 h-full w-full object-cover"
          decoding="async"
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/24 via-black/16 to-black/24" aria-hidden />
      </section>

      <section
        id="services"
        className="scroll-mt-28 bg-[#F3EFE6] py-section-y text-neutral-900 md:py-section-y-lg"
      >
        <div className="section-shell">
          <h2 className="section-heading-light mb-10 md:mb-12">
            {site.homeServicesHeadingPrefix.trim()} {site.homeServicesHeadingAccent.trim()}
          </h2>
          {site.homeServicesLead.trim() ? (
            <p className="mx-auto -mt-6 mb-10 max-w-3xl text-center text-body text-neutral-600 md:-mt-8 md:mb-12">
              {site.homeServicesLead}
            </p>
          ) : null}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3 md:gap-6">
            {serviceCards.map((card) => (
              <a
                key={card.category}
                href={`/projects?cat=${card.category as HomeServiceCategory}#project-grid`}
                className="group relative block min-h-[20rem] overflow-hidden rounded-lg shadow-card can-hover:hover:-translate-y-0.5 can-hover:hover:shadow-lg motion-safe:transition-transform md:min-h-[24rem]"
              >
                <img
                  src={card.image}
                  alt=""
                  width={1200}
                  height={800}
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 can-hover:group-hover:scale-105"
                  loading="lazy"
                  decoding="async"
                />
                <div className="absolute inset-x-0 bottom-0 z-10 border-t border-white/10 bg-black/40 px-4 py-4 text-center shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] backdrop-blur-sm sm:px-6 sm:py-5 sm:backdrop-blur-md">
                  <h3 className="mx-auto mb-2 max-w-prose text-balance font-bold text-card-title text-white [text-shadow:0_1px_14px_rgba(0,0,0,0.45)]">
                    {card.title}
                  </h3>
                  <p className="mx-auto max-w-prose text-card-lead font-normal text-white/95 [text-shadow:0_1px_10px_rgba(0,0,0,0.4)]">
                    {card.description}
                  </p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section id="why-us" className="scroll-mt-28 border-y border-gold/20">
        <div className="grid grid-cols-1 md:grid-cols-2">
          <div className="order-2 relative min-h-[280px] md:order-1 md:min-h-0">
            <img
              src={whyUsImg}
              alt=""
              width={960}
              height={540}
              sizes="(max-width: 768px) 100vw, 50vw"
              className="h-full min-h-[280px] w-full object-cover md:absolute md:inset-0 md:min-h-full"
              loading="lazy"
              decoding="async"
            />
          </div>
          <div className="order-1 bg-marble-dark px-6 py-section-y md:order-2 md:px-12 md:py-section-y-lg">
            <h2 className="section-heading mb-8 md:mb-10">{site.homeWhyUsHeading}</h2>
            <ul className="mx-auto flex w-full max-w-[22rem] flex-col gap-4 text-list-item">
              {whyUsPoints.map((point) => (
                <li key={point} className="grid w-full grid-cols-[1px_minmax(0,1fr)] items-center gap-3">
                  <span className="h-6 w-px justify-self-end bg-gold" aria-hidden />
                  <span className="text-right font-semibold text-textPrimary/95">{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section id="about" className="scroll-mt-28 border-t border-black/10 bg-white text-neutral-900">
        <div className="grid grid-cols-1 md:grid-cols-2">
          <div className="order-2 px-6 py-section-y md:order-1 md:px-12 md:py-section-y-lg">
            <div className="mx-auto w-full max-w-xl text-right">
              <p className="mb-3 font-medium tracking-[0.16em] text-[0.9375rem] leading-[1.4] text-black">
                {site.homeAboutBrandLine}
              </p>
              <h2 className="mb-6 font-semibold text-page-title text-neutral-900 md:mb-8">{site.homeAboutHeading}</h2>
              <div className="space-y-5 text-body text-neutral-600">
                <p>{site.homeAboutParagraph1}</p>
                <p>{site.homeAboutParagraph2}</p>
              </div>
            </div>
          </div>
          <div className="order-1 relative min-h-[320px] md:order-2 md:min-h-0">
            <img
              src={aboutImg}
              alt=""
              width={960}
              height={600}
              sizes="(max-width: 768px) 100vw, 50vw"
              className="h-full min-h-[320px] w-full object-cover md:absolute md:inset-0 md:min-h-full"
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>
      </section>
    </>
  );
}
