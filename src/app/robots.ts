import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  // Explicitly welcome AI assistants' crawlers so the site can be read and
  // cited in ChatGPT, Claude, Perplexity, and Google AI Overviews.
  const aiBots = ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-Web", "anthropic-ai", "PerplexityBot", "Google-Extended", "Applebot-Extended", "CCBot"];

  return {
    rules: [
      // /agent is the internal team console — never meant to be crawled.
      { userAgent: "*", allow: "/", disallow: "/agent" },
      ...aiBots.map((ua) => ({ userAgent: ua, allow: "/", disallow: "/agent" })),
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl("/"),
  };
}
