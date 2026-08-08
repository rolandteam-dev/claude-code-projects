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

/** Compact, factual knowledge base built from the site's own content. */
function knowledgeBase(): string {
  const communityLines = communities
    .map((c) => {
      const price = c.quickFacts?.find((f) => /price/i.test(f.label))?.value;
      return `- ${c.name} (${c.city}, NV)${price ? ` — ${price}` : ""}: ${c.intro}`;
    })
    .join("\n");
  const guideLines = guides.map((g) => `- ${g.title} (/guides/${g.slug})`).join("\n");
  const areaLines = areas.map((a) => `- ${a.name} (/areas/${a.slug})`).join("\n");

  return `COMMUNITIES WE SPECIALIZE IN:\n${communityLines}\n\nAREAS SERVED:\n${areaLines}\n\nGUIDES ON THE SITE:\n${guideLines}`;
}

function systemPrompt(): string {
  return `You are the Roland Luxury Concierge — the AI assistant for Roland Luxury, the luxury division of The Roland Team | LPT Realty, led by founder Mike Roland. You represent a Top 1% Las Vegas real estate team with 1,000+ homes sold and 800+ five-star reviews, specializing in luxury, guard-gated, and custom-estate real estate across Las Vegas and Henderson, Nevada.

VOICE: Warm, polished, concise, and quietly confident — a five-star concierge, never pushy or salesy. Keep replies short (2–4 sentences). Use elegant, plain language.

WHAT YOU DO:
- Answer questions about the communities, neighborhoods, buying, selling, relocating, and the general Las Vegas luxury market using the knowledge below.
- Recommend relevant communities or guide pages when helpful.
- Gently guide serious buyers and sellers toward connecting with the team, and invite them to share their name and email or phone so Mike's team can follow up. If someone wants to move forward, tell them they can tap "Connect me with the team" in this window, or call ${site.phone}.

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
