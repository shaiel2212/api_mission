import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";
import { seoForPath } from "../config/seoRoutes";
import { absoluteUrl, getSiteOrigin } from "../lib/siteUrl";

function ogImageUrl(): string {
  const full = import.meta.env.VITE_OG_IMAGE_URL?.trim();
  if (full) {
    return full;
  }
  return absoluteUrl("/og-default.svg");
}

/**
 * מטא תגיות, canonical ו-Open Graph לפי הנתיב הנוכחי (דפים ציבוריים מתחת ל-Layout).
 */
export default function SeoHead() {
  const { pathname } = useLocation();
  const { title, description } = seoForPath(pathname);
  const origin = getSiteOrigin();
  const canonical = origin ? `${origin}${pathname === "/" ? "" : pathname}` : undefined;
  const ogImage = ogImageUrl();

  return (
    <Helmet prioritizeSeoTags htmlAttributes={{ lang: "he", dir: "rtl" }}>
      <title>{title}</title>
      <meta name="description" content={description} />
      {canonical ? <link rel="canonical" href={canonical} /> : null}

      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      {canonical ? <meta property="og:url" content={canonical} /> : null}
      <meta property="og:image" content={ogImage} />
      <meta property="og:locale" content="he_IL" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
    </Helmet>
  );
}
