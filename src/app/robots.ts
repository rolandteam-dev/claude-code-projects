import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  // Explicitly welcome AI assistants' crawlers so the site can be read and
  // cited in ChatGPT, Claude, Perplexity, and Google AI Overviews.
  const aiBots = ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-Web", "anthropic-ai", "PerplexityBot", "Google-Extended", "Applebot-Extended", "CCBot"];

  return {
    rules: [
      { userAgent: "*", allow: "/" },
      ...aiBots.map((ua) => ({ userAgent: ua, allow: "/" })),
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl("/"),
  };
}
