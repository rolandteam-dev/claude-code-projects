import { NextResponse } from "next/server";
import { communities } from "@/content/communities";
import { guides } from "@/content/guides";
import { areas } from "@/content/areas";
import { site } from "@/lib/site";
import { getListings } from "@/lib/idx/provider";
import type { ListingFilters, PropertyType } from "@/lib/idx/types";

export const runtime = "nodejs";

/**
 * Roland Luxury AI Concierge → Anthropic Messages API (with a live-listings
 * search tool). Set ANTHROPIC_API_KEY in Vercel to go live; without it the
 * endpoint returns a graceful, on-brand fallback. Live listing results also
 * require REPLIERS_API_KEY (otherwise the tool simply returns no matches).
 */

const MODEL = "claude-haiku-4-5-20251001";
const MAX_TURNS = 16; // cap conversation length we forward
const MAX_CARDS = 6; // listings surfaced in the chat per search

// Luxury price policy (mirrors /listings): default Min $400k, hard floor $300k.
const DEFAULT_MIN_PRICE = 400_000;
const HARD_MIN_PRICE = 300_000;

const PROPERTY_TYPES: PropertyType[] = ["Single Family", "Condo", "Townhouse", "Land", "Multi-Family"];
const CITIES = ["Henderson", "Las Vegas", "North Las Vegas", "Boulder City"];

type ChatMsg = { role: "user" | "assistant"; content: string };
type Card = {
  id: string;
  price: number;
  beds: number;
  baths: number;
  sqft: number;
  address: string;
  photo: string | null;
  url: string;
};

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

/** Compact, factual knowledge base built from the site's own content (with links). */
function knowledgeBase(): string {
  const communityLines = communities
    .map((c) => {
      const price = c.quickFacts?.find((f) => /price/i.test(f.label))?.value;
      return `- ${c.name} (${c.city}, NV)${price ? ` — ${price}` : ""} [/communities/${c.slug}]: ${c.intro}`;
    })
    .join("\n");
  const guideLines = guides.map((g) => `- ${g.title} [/guides/${g.slug}]`).join("\n");
  const areaLines = areas.map((a) => `- ${a.name} [/areas/${a.slug}]`).join("\n");

  return `COMMUNITIES WE SPECIALIZE IN (with page links):\n${communityLines}\n\nAREAS SERVED:\n${areaLines}\n\nGUIDES ON THE SITE:\n${guideLines}`;
}

function systemPrompt(): string {
  return `You are the Roland Luxury Concierge — the AI assistant for Roland Luxury, the luxury division of The Roland Team | LPT Realty, led by founder Mike Roland. You represent a Top 1% Las Vegas real estate team with 1,000+ homes sold and 800+ five-star reviews, specializing in luxury, guard-gated, and custom-estate real estate across Las Vegas and Henderson, Nevada.

VOICE: Warm, polished, concise, and quietly confident — a five-star concierge, never pushy or salesy. Keep replies short (2–4 sentences). Use elegant, plain language.

WHAT YOU DO:
- Answer questions about the communities, neighborhoods, buying, selling, relocating, and the general Las Vegas luxury market using the knowledge below.
- Recommend relevant community, area, or guide pages when helpful, and share their link path (e.g. /communities/ascaya) so the visitor can open them.
- SEARCH LIVE LISTINGS: When a visitor describes what they're looking for (a city or community, a budget, bedrooms, or a home type), call the search_listings tool to pull real, current homes. After the tool returns, write a brief, gracious summary (2–3 sentences) referencing a couple of the results by price/beds — the matching homes are shown to the visitor as cards automatically, so don't list them all. If the tool returns no homes, say so warmly and offer to broaden the search or have the team send options.
- Gently guide serious buyers and sellers toward connecting with the team; invite them to tap "Connect me with the team" in this window or call ${site.phone}.

STRICT RULES:
- Only state specific prices, addresses, bedroom counts, or availability that come from search_listings results. NEVER invent listings, prices, or inventory. If you haven't searched, don't quote specific homes.
- Listing details can change; remind visitors to confirm current details with the team.
- Follow Fair Housing guidelines: describe communities by objective features and lifestyle, never by demographics, and never steer based on protected characteristics.
- Never fabricate statistics, reviews, or facts beyond what's provided. If you don't know, say so and route to the team.
- Contact: phone ${site.phone}, email ${site.email}. Office: ${site.address.streetAddress}, ${site.address.addressLocality}, ${site.address.addressRegion}.

KNOWLEDGE BASE:
${knowledgeBase()}`;
}

const SEARCH_TOOL = {
  name: "search_listings",
  description:
    "Search live Las Vegas / Henderson area MLS listings for homes matching the visitor's criteria. Call this whenever the visitor asks to see homes, listings, or properties, or describes what they want (area/community, budget, bedrooms, home type).",
  input_schema: {
    type: "object" as const,
    properties: {
      city: { type: "string", enum: CITIES, description: "City to search." },
      community: {
        type: "string",
        description:
          "A specific community by name (e.g. 'Ascaya', 'Summerlin', 'MacDonald Highlands') when the visitor names one. Overrides city.",
      },
      minPrice: { type: "number", description: "Minimum price in USD." },
      maxPrice: { type: "number", description: "Maximum price in USD." },
      minBeds: { type: "number", description: "Minimum number of bedrooms." },
      propertyType: { type: "string", enum: PROPERTY_TYPES, description: "Type of home." },
    },
  },
};

function resolveCommunitySlug(nameOrSlug?: string): string | undefined {
  if (!nameOrSlug) return undefined;
  const norm = nameOrSlug.toLowerCase().trim();
  const c = communities.find((c) => c.slug === norm || c.name.toLowerCase() === norm);
  return c?.slug;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
/** Run the live search and shape results for both the model and the widget. */
async function runSearch(input: any): Promise<{ cards: Card[]; searchUrl: string; resultText: string }> {
  const slug = resolveCommunitySlug(typeof input?.community === "string" ? input.community : undefined);
  const rawMin = typeof input?.minPrice === "number" ? input.minPrice : undefined;
  const minPrice = Math.max(HARD_MIN_PRICE, rawMin ?? DEFAULT_MIN_PRICE);
  const filters: ListingFilters = {
    communitySlug: slug,
    city: !slug && typeof input?.city === "string" ? input.city : undefined,
    minPrice,
    maxPrice: typeof input?.maxPrice === "number" ? input.maxPrice : undefined,
    minBeds: typeof input?.minBeds === "number" ? input.minBeds : undefined,
    propertyType: PROPERTY_TYPES.includes(input?.propertyType) ? input.propertyType : undefined,
    limit: MAX_CARDS,
  };

  const { listings, total } = await getListings(filters);
  const cards: Card[] = listings.map((l) => ({
    id: l.id,
    price: l.listPrice,
    beds: l.beds,
    baths: l.baths,
    sqft: l.sqft,
    address: `${l.address.line1}, ${l.address.city}`,
    photo: l.photos[0] ?? null,
    url: `/listings/${l.id}`,
  }));

  // Build the matching results-page URL (only include explicit criteria).
  const p = new URLSearchParams();
  if (slug) p.set("community", slug);
  else if (filters.city) p.set("city", filters.city);
  if (rawMin) p.set("minPrice", String(rawMin));
  if (filters.maxPrice) p.set("maxPrice", String(filters.maxPrice));
  if (filters.minBeds) p.set("minBeds", String(filters.minBeds));
  if (filters.propertyType) p.set("propertyType", filters.propertyType);
  const searchUrl = `/listings${p.toString() ? `?${p.toString()}` : ""}`;

  const resultText = cards.length
    ? `Found ${total} matching home(s). Showing ${cards.length}:\n` +
      cards
        .map((c) => `- $${c.price.toLocaleString()} · ${c.beds}bd/${c.baths}ba · ${c.sqft.toLocaleString()} sqft · ${c.address}`)
        .join("\n") +
      `\nResults page: ${searchUrl}`
    : `No live listings currently match those criteria.`;

  return { cards, searchUrl, resultText };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

const FALLBACK =
  `Thank you for reaching out to Roland Luxury. Our live concierge is just a moment away — for the fastest response, tap "Connect me with the team" below, call ${site.phone}, or email ${site.email}, and Mike's team will personally assist you.`;

async function callAnthropic(key: string, body: unknown): Promise<Response> {
  return fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
  });
}

export async function POST(req: Request) {
  let body: { messages?: ChatMsg[] } | null = null;
  try {
    body = (await req.json()) as { messages?: ChatMsg[] };
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400, headers: CORS });
  }

  const incoming = (body?.messages ?? [])
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .slice(-MAX_TURNS)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }));

  if (incoming.length === 0) {
    return NextResponse.json({ ok: false, error: "No message provided." }, { status: 400, headers: CORS });
  }

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    return NextResponse.json({ ok: true, reply: FALLBACK, configured: false }, { headers: CORS });
  }

  try {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const messages: any[] = [...incoming];
    let cards: Card[] = [];
    let searchUrl: string | undefined;
    let reply = "";

    // Agentic loop: model may call search_listings, we run it, feed results back.
    for (let step = 0; step < 3; step++) {
      const res = await callAnthropic(key, {
        model: MODEL,
        max_tokens: 600,
        system: systemPrompt(),
        tools: [SEARCH_TOOL],
        messages,
      });
      if (!res.ok) {
        return NextResponse.json({ ok: true, reply: FALLBACK, configured: true, degraded: true }, { headers: CORS });
      }
      const json = (await res.json()) as any;
      const blocks: any[] = json.content ?? [];
      const toolUses = blocks.filter((b) => b.type === "tool_use");

      if (json.stop_reason === "tool_use" && toolUses.length) {
        messages.push({ role: "assistant", content: blocks });
        const toolResults: any[] = [];
        for (const tu of toolUses) {
          const r = await runSearch(tu.input ?? {});
          if (r.cards.length && cards.length === 0) {
            cards = r.cards;
            searchUrl = r.searchUrl;
          } else if (!searchUrl) {
            searchUrl = r.searchUrl;
          }
          toolResults.push({ type: "tool_result", tool_use_id: tu.id, content: r.resultText });
        }
        messages.push({ role: "user", content: toolResults });
        continue;
      }

      reply = blocks
        .filter((b) => b.type === "text" && b.text)
        .map((b) => b.text)
        .join("\n")
        .trim();
      break;
    }
    /* eslint-enable @typescript-eslint/no-explicit-any */

    return NextResponse.json(
      { ok: true, reply: reply || FALLBACK, listings: cards, searchUrl, configured: true },
      { headers: CORS },
    );
  } catch {
    return NextResponse.json({ ok: true, reply: FALLBACK, configured: true, degraded: true }, { headers: CORS });
  }
}
