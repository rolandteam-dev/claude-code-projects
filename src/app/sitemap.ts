import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";
import { communities } from "@/content/communities";
import { guides } from "@/content/guides";
import { areas } from "@/content/areas";
import { blogPosts } from "@/content/blog";
import { calculators } from "@/content/calculators";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes = [
    "/", "/buy", "/sell", "/home-value", "/mortgage-pre-approval", "/down-payment-assistance",
    "/new-construction", "/las-vegas-luxury-real-estate",
    "/guard-gated-communities-las-vegas", "/moving-to-las-vegas",
    "/active-adult-communities-las-vegas", "/golf-communities-las-vegas", "/listings", "/communities",
    "/areas", "/guides", "/market-report", "/about", "/why-the-roland-team", "/testimonials",
    "/contact", "/blog", "/calculators", "/neighborhood-finder", "/portal", "/cash-offer",
  ].map(
    (path) => ({
      url: absoluteUrl(path),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: path === "/" ? 1 : 0.7,
    }),
  );

  const communityRoutes = communities.map((c) => ({
    url: absoluteUrl(`/communities/${c.slug}`),
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const guideRoutes = guides.map((g) => ({
    url: absoluteUrl(`/guides/${g.slug}`),
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const areaRoutes = areas.map((a) => ({
    url: absoluteUrl(`/areas/${a.slug}`),
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const blogRoutes = blogPosts.map((p) => ({
    url: absoluteUrl(`/blog/${p.slug}`),
    lastModified: new Date(p.date + "T00:00:00"),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const calculatorRoutes = calculators.map((c) => ({
    url: absoluteUrl(`/calculators/${c.slug}`),
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...communityRoutes, ...areaRoutes, ...guideRoutes, ...blogRoutes, ...calculatorRoutes];
}
