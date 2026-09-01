import type { Metadata } from "next";
import { site } from "@/lib/site";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Concierge } from "@/components/Concierge";
import { JsonLd } from "@/components/JsonLd";
import { realEstateAgentSchema, webSiteSchema } from "@/lib/schema";

/**
 * Marketing site chrome (Roland Luxury). Wraps every public marketing route;
 * the homeowner dashboard experience lives in its own route group with its own
 * chrome, so it does not inherit this header/footer.
 */
export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} | ${site.tagline}`,
    template: `%s | ${site.name}`,
  },
  description: `${site.name} — ${site.tagline}. Explore luxury homes, guard-gated communities, and expert buyer & seller guidance across Las Vegas and Henderson, Nevada.`,
  applicationName: site.name,
  keywords: [
    "Las Vegas real estate",
    "Henderson NV homes for sale",
    "luxury homes Las Vegas",
    "guard-gated communities Henderson",
    "Summerlin homes for sale",
    "Roland Luxury",
  ],
  authors: [{ name: site.name, url: site.url }],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: site.locale,
    url: site.url,
    siteName: site.name,
    title: `${site.name} | ${site.tagline}`,
    description: `Luxury Las Vegas & Henderson real estate — community guides, buyer resources, and expert local representation.`,
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name} | ${site.tagline}`,
    description: `Luxury Las Vegas & Henderson real estate with Roland Luxury.`,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
};

export default function SiteLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <JsonLd data={[realEstateAgentSchema(), webSiteSchema()]} />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <Concierge />
    </>
  );
}
