import { NextResponse } from "next/server";
import { homeownerStore } from "@/lib/homeowners/store";

export const runtime = "nodejs";

/**
 * Per-contact admin actions for the Recipients page. ADMIN_TOKEN-gated (`?key=`).
 *
 * POST body: { token: string, mode: "unsubscribe" | "resubscribe" | "delete" }
 *   - unsubscribe  → stop emailing them (subscribed = false). Kept on file, keeps
 *                    history, survives the FUB sync. The everyday "remove."
 *   - resubscribe  → undo an unsubscribe / suppression (subscribed = true).
 *   - delete       → hard delete the row AND block the token so the automated FUB
 *                    import never re-adds them. Irreversible from here.
 *
 * Writes one contact at a time, keyed by its dashboard token (what the Recipients
 * table already has). No email is ever sent from this route.
 */
type Mode = "unsubscribe" | "resubscribe" | "delete";

export async function POST(req: Request) {
  const url = new URL(req.url);
  if (!process.env.ADMIN_TOKEN || url.searchParams.get("key") !== process.env.ADMIN_TOKEN) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let body: { token?: string; mode?: Mode };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 });
  }

  const token = (body.token ?? "").trim();
  const mode = body.mode;
  if (!token) return NextResponse.json({ ok: false, error: "missing token" }, { status: 400 });

  const store = homeownerStore();
  try {
    if (mode === "unsubscribe") {
      await store.unsubscribe(token);
      return NextResponse.json({ ok: true, mode, token });
    }
    if (mode === "resubscribe") {
      await store.resubscribe(token);
      return NextResponse.json({ ok: true, mode, token });
    }
    if (mode === "delete") {
      const r = await store.deleteAndBlock(token);
      return NextResponse.json({ ok: true, mode, token, ...r });
    }
    return NextResponse.json({ ok: false, error: "mode must be unsubscribe | resubscribe | delete" }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
