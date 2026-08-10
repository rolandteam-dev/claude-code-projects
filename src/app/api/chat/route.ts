import { NextResponse } from "next/server";
import { communities } from "@/content/communities";
import { guides } from "@/content/guides";
import { areas } from "@/content/areas";
import { site } from "@/lib/site";

export const runtime = "nodejs";

/**
 * Roland Luxury AI Concierge → Anthropic Messages API.
 * Set ANTHROPIC_API_KEY in Vercel → Settings → Environment Variables to go live.
 * Until then the endpoint returns a graceful, on-brand fallback so the widget
 * still works and always routes people to human contact.
 */

const MODEL = "claude-haiku-4-5-20251001";
const MAX_TURNS = 16; // cap conversation length we forward

type ChatMsg = { role: "user" | "assistant"; content: string };

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

/** Evergreen landing pages the concierge can link to (exact paths). */
const KEY_PAGES = `KEY PAGES (link with these exact paths):
- Search all homes for sale → /listings
- Luxury real estate overview → /las-vegas-luxury-real-estate
- Guard-gated communities → /guard-gated-communities-las-vegas
- Golf communities → /golf-communities-las-vegas
- 55+ / active-adult communities → /active-adult-communities-las-vegas
- New construction → /new-construction
- What's my home worth (valuation) → /home-value
- Market report → /market-report
- Moving to Las Vegas → /moving-to-las-vegas
- All communities → /communities
- Contact the team → /contact`;

/** Compact, factual knowledge base built from the site's own content. */
function knowledgeBase(): string {
  const communityLines = communities
    .map((c) => {
      const price = c.quickFacts?.find((f) => /price/i.test(f.label))?.value;
      return `- ${c.name} (${c.city}, NV)${price ? ` — ${price}` : ""} → /communities/${c.slug}: ${c.intro}`;
    })
    .join("\n");
  const guideLines = guides.map((g) => `- ${g.title} → /guides/${g.slug}`).join("\n");
  const areaLines = areas.map((a) => `- ${a.name} → /areas/${a.slug}`).join("\n");

  return `COMMUNITIES WE SPECIALIZE IN (path after the arrow):\n${communityLines}\n\nAREAS SERVED:\n${areaLines}\n\nGUIDES ON THE SITE:\n${guideLines}\n\n${KEY_PAGES}`;
}

function systemPrompt(): string {
  return `You are the Roland Luxury Concierge — the AI assistant for Roland Luxury, the luxury division of The Roland Team | LPT Realty, led by founder Mike Roland. You represent a Top 1% Las Vegas real estate team with 1,000+ homes sold and 800+ five-star reviews, specializing in luxury, guard-gated, and custom-estate real estate across Las Vegas and Henderson, Nevada.

VOICE: Warm, polished, and quietly confident — a five-star concierge, never pushy or salesy.

FORMAT (keep it easy to read on a phone — this matters):
- Keep every reply to 2–3 short sentences, then ONE friendly question or next step. Never write a wall of text.
- Plain, elegant language. Do NOT use headings or bullet lists, and use at most ONE **bold** phrase (prefer none).
- When you mention a community, area, guide, or topic that has a page, link it inline in markdown, e.g. [Ascaya](/communities/ascaya) or [what your home is worth](/home-value). Use ONLY the exact paths in the knowledge base below — never invent a path. Include at most 2–3 links per reply.

WHAT YOU DO:
- Answer questions about the communities, neighborhoods, buying, selling, relocating, and the general Las Vegas luxury market using the knowledge below, and point people to the most relevant page.

TURNING CRITERIA INTO A LIVE SEARCH LINK (do this whenever they describe what they want):
- The moment a visitor names any home criteria — beds, budget, city, community, or property type — hand them a link into our live MLS search pre-filtered to it, e.g. [browse matching homes](/listings?...). Build the link from /listings using ONLY these parameters:
  • city= one of exactly: Henderson, Las Vegas, North Las Vegas, Boulder City. (Summerlin is NOT a city — for Summerlin use community=summerlin instead.)
  • community= a community slug — the last part of that community's /communities/<slug> path (e.g. community=ascaya).
  • minBeds= 2, 3, 4, or 5.
  • minPrice= and/or maxPrice= a whole dollar number (e.g. 2000000 for $2M, 750000 for $750K).
  • propertyType= one of exactly: Single Family, Condo, Townhouse, Land, Multi-Family.
- Join parameters with & and URL-encode spaces (city=Las%20Vegas, propertyType=Single%20Family). Include only what they specified; never invent other keys or values.
- Examples:
  • "4 beds under $2M in Henderson" → [browse 4-bed Henderson homes up to $2M](/listings?city=Henderson&minBeds=4&maxPrice=2000000)
  • "condos in Las Vegas from $500K to $900K" → [see matching condos](/listings?city=Las%20Vegas&propertyType=Condo&minPrice=500000&maxPrice=900000)
  • "what's for sale in Ascaya" → [view homes in Ascaya](/listings?community=ascaya)
- For lifestyle terms that are NOT search filters — guard-gated, golf, 55+/active-adult, luxury, new construction — link the matching landing page from KEY PAGES; if they also gave a budget or beds, you may add a /listings link with just those numeric filters.
- Never promise an exact number of homes you can't know — say "matching homes," not "12 homes."

CONVERTING INTEREST INTO A CONNECTION (your most important job):
- When the visitor shows real intent — shares a price range or timeline, wants to see or tour homes, is selling their home, is relocating, or asks about current availability or value — warmly invite them to leave their name and email or phone so Mike's team can send tailored options or a private valuation.
- On that ONE inviting message, add the token [[LEAD]] on its very last line. This opens the contact form for them. Use it once per conversation, only at a natural high-intent moment — never in your first reply, and never as a hard sell. If they'd rather just talk, keep helping.

STRICT RULES:
- You do NOT have access to live MLS listings, current inventory, or exact current prices. Never invent specific active listings, addresses, prices, or availability. If asked, say the team can share the current, up-to-date selection and offer to connect them.
- Follow Fair Housing guidelines: describe communities by objective features and lifestyle, never by demographics, and never steer based on protected characteristics.
- Never fabricate statistics, reviews, or facts beyond what's provided. If you don't know, say so and route to the team.
- Contact: phone ${site.phone}, email ${site.email}. Office: ${site.address.streetAddress}, ${site.address.addressLocality}, ${site.address.addressRegion}.

KNOWLEDGE BASE:
${knowledgeBase()}`;
}

const FALLBACK =
  `Thank you for reaching out to Roland Luxury. Our live concierge is just a moment away — for the fastest response, tap "Connect me with the team" below, call ${site.phone}, or email ${site.email}, and Mike's team will personally assist you.`;

export async function POST(req: Request) {
  let body: { messages?: ChatMsg[] } | null = null;
  try {
    body = (await req.json()) as { messages?: ChatMsg[] };
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400, headers: CORS });
  }

  const messages = (body?.messages ?? [])
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .slice(-MAX_TURNS)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }));

  if (messages.length === 0) {
    return NextResponse.json({ ok: false, error: "No message provided." }, { status: 400, headers: CORS });
  }

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    // Not configured yet — graceful, on-brand degrade.
    return NextResponse.json({ ok: true, reply: FALLBACK, configured: false }, { headers: CORS });
  }

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 500,
        system: systemPrompt(),
        messages,
      }),
    });

    if (!res.ok) {
      return NextResponse.json({ ok: true, reply: FALLBACK, configured: true, degraded: true }, { headers: CORS });
    }

    const json = (await res.json()) as { content?: Array<{ type: string; text?: string }> };
    const reply =
      json.content
        ?.filter((b) => b.type === "text" && b.text)
        .map((b) => b.text)
        .join("\n")
        .trim() || FALLBACK;

    return NextResponse.json({ ok: true, reply, configured: true }, { headers: CORS });
  } catch {
    return NextResponse.json({ ok: true, reply: FALLBACK, configured: true, degraded: true }, { headers: CORS });
  }
}
