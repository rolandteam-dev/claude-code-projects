import { NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";
import { safeEqual } from "@/lib/offers/config";
import { RPA_PAGES } from "@/lib/offers/rpa/layout";
import { BLANK_PATH, blobConfigured, loadBlank, storeBlank } from "@/lib/offers/rpa/store";

export const runtime = "nodejs";

/**
 * Admin: upload / check the blank GLVAR RPA the Offer Machine fills.
 *
 *   GET  ?key=…   reports whether the blank is stored (and its size). Writes nothing.
 *   POST ?key=…   body = the raw, UNLOCKED blank PDF (no open/edit password). Replaces the stored one
 *                 after checking it is a readable PDF with the page count the layout expects.
 *
 * key = ADMIN_TOKEN or OFFER_FORMS_KEY. Fails closed when neither is set.
 */
function authorized(req: Request): boolean {
  const key = new URL(req.url).searchParams.get("key") ?? "";
  return [process.env.ADMIN_TOKEN, process.env.OFFER_FORMS_KEY].some((t) => Boolean(t) && safeEqual(key, t as string));
}

export async function GET(req: Request) {
  if (!authorized(req)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  if (!blobConfigured()) return NextResponse.json({ ok: true, blobConfigured: false, blankStored: false });
  const blank = await loadBlank();
  return NextResponse.json({ ok: true, blobConfigured: true, blankStored: Boolean(blank), path: BLANK_PATH, bytes: blank?.length ?? 0 });
}

export async function POST(req: Request) {
  if (!authorized(req)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  if (!blobConfigured()) return NextResponse.json({ ok: false, error: "BLOB_READ_WRITE_TOKEN is not set" }, { status: 503 });
  const bytes = new Uint8Array(await req.arrayBuffer());
  try {
    const doc = await PDFDocument.load(bytes);
    if (doc.getPageCount() !== RPA_PAGES) {
      return NextResponse.json({ ok: false, error: `expected ${RPA_PAGES} pages, got ${doc.getPageCount()}` }, { status: 422 });
    }
  } catch (e) {
    return NextResponse.json({ ok: false, error: `not a readable, unlocked PDF: ${e instanceof Error ? e.message : String(e)}` }, { status: 422 });
  }
  await storeBlank(bytes);
  return NextResponse.json({ ok: true, bytes: bytes.length });
}
