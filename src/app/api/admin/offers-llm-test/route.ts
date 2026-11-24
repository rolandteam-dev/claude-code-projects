import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { safeEqual } from "@/lib/offers/config";
import { extractTerms, SCHEMA, SYSTEM } from "@/lib/offers/extract";
import { todayLasVegas } from "@/lib/offers/types";

export const runtime = "nodejs";
export const maxDuration = 120;

/**
 * TEMPORARY latency diagnostic for the Offer Machine's Claude call. Delete this
 * route and the OFFER_DIAG_TOKEN variable once the timeout is understood.
 *
 *   GET /api/admin/offers-llm-test?key=<OFFER_DIAG_TOKEN>&variant=ping|plain|structured|real
 *                                   [&model=claude-...][&effort=low|medium|high]
 *
 * Returns timing, token counts and the error text only. Never message content,
 * never a key. Fails closed without OFFER_DIAG_TOKEN.
 */
const SENTENCE =
  "Write an offer for Megan Smith on 123 Main St, Henderson, NV 89014 for $450k, FHA 3.5% down, $10k closing costs, seller paid home warranty, COE 12/15/26, fridge, washer, dryer and window coverings included";

export async function GET(req: Request) {
  const token = process.env.OFFER_DIAG_TOKEN;
  const p = new URL(req.url).searchParams;
  if (!token || !safeEqual(p.get("key") ?? "", token)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const variant = p.get("variant") ?? "ping";
  const model = p.get("model") || process.env.OFFER_LLM_MODEL || "claude-opus-5-5";
  const effort = p.get("effort") || undefined;
  const startedAt = Date.now();
  const done = (extra: Record<string, unknown>) =>
    NextResponse.json({ variant, model, effort: effort ?? null, ms: Date.now() - startedAt, ...extra });

  try {
    if (variant === "real") {
      // The exact production function, end to end.
      process.env.OFFER_LLM_MODEL = model;
      const r = await extractTerms({ message: SENTENCE, current: {}, lastQuestion: null, today: todayLasVegas() });
      return done({ kind: r.kind, fields: r.kind === "ok" ? Object.keys(r.extraction.terms) : undefined });
    }

    const client = new Anthropic({ maxRetries: 0, timeout: 110_000 });
    const outputConfig: Record<string, unknown> = {};
    if (effort) outputConfig.effort = effort;
    if (variant === "structured") outputConfig.format = { type: "json_schema", schema: SCHEMA };

    const res = await client.messages.create({
      model,
      max_tokens: variant === "ping" ? 32 : 1500,
      ...(variant === "ping"
        ? { messages: [{ role: "user", content: "Say hi." }] }
        : {
            system: variant === "plain" ? `${SYSTEM}\nReturn only a single JSON object and nothing else.` : SYSTEM,
            messages: [{ role: "user", content: `Today's date: ${todayLasVegas()}\nNew message from the agent:\n<<<\n${SENTENCE}\n>>>` }],
          }),
      ...(Object.keys(outputConfig).length ? { output_config: outputConfig as never } : {}),
    });
    return done({
      stop: res.stop_reason,
      usage: { in: res.usage.input_tokens, out: res.usage.output_tokens },
      blocks: res.content.map((b) => b.type),
    });
  } catch (e) {
    return done({ error: `${e instanceof Error ? e.name : "Error"}: ${e instanceof Error ? e.message : String(e)}` });
  }
}
