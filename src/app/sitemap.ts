import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";
import { communities } from "@/content/communities";
import { guides } from "@/content/guides";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes = ["/", "/communities", "/guides", "/sell", "/about", "/contact", "/blog"].map(
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

  return [...staticRoutes, ...communityRoutes, ...guideRoutes];
}
