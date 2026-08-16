/**
 * JSON-LD structured-data builders. Rich, consistent entity data improves
 * Google rich results AND how AI assistants (ChatGPT, Claude, Perplexity,
 * AI Overviews) understand and cite the business.
 */
import { site, absoluteUrl } from "./site";
import type { Faq } from "@/content/communities";

/** The core business entity — referenced by @id across the site. */
export function realEstateAgentSchema() {
  const hasStreet = Boolean(site.address.streetAddress);
  return {
    "@context": "https://schema.org",
    "@type": ["RealEstateAgent", "LocalBusiness"],
    "@id": absoluteUrl("/#organization"),
    name: site.name,
    legalName: site.legalName,
    url: site.url,
    telephone: site.phone,
    email: site.email,
    priceRange: "$$$",
    description: `${site.name} is the luxury division of ${site.parentBrand} | ${site.brokerage} — a Top 1% Las Vegas real estate team with 1,000+ homes sold, specializing in luxury and guard-gated communities across Las Vegas and Henderson, Nevada, led by ${site.founder}.`,
    slogan: site.tagline,
    founder: { "@type": "Person", name: site.founder },
    foundingDate: String(site.foundedYear),
    parentOrganization: {
      "@type": "Organization",
      name: `${site.parentBrand} | ${site.brokerage}`,
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: site.aggregateRating.ratingValue,
      reviewCount: site.aggregateRating.reviewCount,
      bestRating: 5,
    },
    address: {
      "@type": "PostalAddress",
      ...(hasStreet ? { streetAddress: site.address.streetAddress } : {}),
      addressLocality: site.address.addressLocality,
      addressRegion: site.address.addressRegion,
      ...(site.address.postalCode ? { postalCode: site.address.postalCode } : {}),
      addressCountry: site.address.addressCountry,
    },
    areaServed: site.areaServed.map((name) => ({ "@type": "City", name })),
    knowsAbout: site.knowsAbout,
    sameAs: site.sameAs.filter(Boolean),
    // aggregateRating reflects real, verified reviews (combined Zillow + Google
    // tally). Source is defined and documented in site.aggregateRating.
  };
}

/** WebSite entity with a sitewide search action. */
export function webSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": absoluteUrl("/#website"),
    url: site.url,
    name: site.name,
    publisher: { "@id": absoluteUrl("/#organization") },
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${absoluteUrl("/listings")}?city={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbSchema(trail: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function faqSchema(faqs: Faq[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}
