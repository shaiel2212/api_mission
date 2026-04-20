import { Helmet } from "react-helmet-async";
import { instagramHref, site } from "../config/site";
import { getSiteOrigin } from "../lib/siteUrl";

/**
 * LocalBusiness + WebSite schema (ללא SearchAction — אין חיפוש באתר).
 */
export default function JsonLdOrganization() {
  const origin = getSiteOrigin();
  if (!origin) {
    return null;
  }

  const sameAs: string[] = [];
  try {
    const ig = instagramHref();
    if (ig && !ig.endsWith("instagram.com/")) {
      sameAs.push(ig);
    }
  } catch {
    /* ignore */
  }

  const idOrg = `${origin}/#organization`;

  const localBusiness: Record<string, unknown> = {
    "@type": "LocalBusiness",
    "@id": idOrg,
    name: site.companyName,
    description: site.summary,
    url: origin,
    telephone: site.phoneTelHref.replace(/^tel:/, ""),
    email: site.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: site.address,
      addressCountry: "IL",
    },
    ...(sameAs.length ? { sameAs } : {}),
  };

  const website = {
    "@type": "WebSite",
    "@id": `${origin}/#website`,
    name: site.companyName,
    url: origin,
    publisher: { "@id": idOrg },
  };

  const payload = {
    "@context": "https://schema.org",
    "@graph": [localBusiness, website],
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(payload)}</script>
    </Helmet>
  );
}
