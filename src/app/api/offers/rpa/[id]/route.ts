import { NextResponse } from "next/server";
import { loadDraft, verifyDraftLink } from "@/lib/offers/rpa/store";

export const runtime = "nodejs";

/**
 * Download link for a filled RPA draft, posted in Slack. Signed and expiring (see store.ts);
 * the id is random and the PDF lives in a private blob, so the URL alone is the credential.
 * noindex + no-store because it carries client names and prices.
 */
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const url = new URL(req.url);
  if (!verifyDraftLink(id, url.searchParams.get("exp"), url.searchParams.get("sig"))) {
    return NextResponse.json({ ok: false, error: "link invalid or expired" }, { status: 403 });
  }
  const pdf = await loadDraft(id);
  if (!pdf) return NextResponse.json({ ok: false, error: "not found" }, { status: 404 });
  return new Response(Buffer.from(pdf), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": 'attachment; filename="RPA-draft.pdf"',
      "cache-control": "private, no-store",
      "x-robots-tag": "noindex",
    },
  });
}
