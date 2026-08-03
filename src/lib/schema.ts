/**
 * JSON-LD structured-data builders. Rich results (breadcrumbs, FAQ,
 * business info) improve both Google SERP presence and AI answer citations.
 */
import { site, absoluteUrl } from "./site";
import type { Faq } from "@/content/communities";

export function realEstateAgentSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    "@id": absoluteUrl("/#organization"),
    name: site.name,
    legalName: site.legalName,
    url: site.url,
    telephone: site.phone,
    email: site.email,
    areaServed: site.areaServed.map((name) => ({ "@type": "City", name })),
    sameAs: site.sameAs,
    description: `${site.name} — ${site.tagline}. Specialists in luxury and guard-gated communities across Las Vegas and Henderson, Nevada.`,
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
