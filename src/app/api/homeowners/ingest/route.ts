import { NextResponse } from "next/server";
import { homeownerStore, newToken, type Homeowner } from "@/lib/homeowners/store";
import { fetchEstimate } from "@/lib/homeowners/avm";
import { dashboardUrl } from "@/lib/homeowners/brand";

export const runtime = "nodejs";

/**
 * Create (or refresh) a homeowner record and return their dashboard link. This
 * is the funnel the home-value tool calls: a homeowner asks for their value,
 * we store them, pull an initial estimate, and hand back a private dashboard
 * URL they'll keep receiving updates for. An email/phone + address are required.
 */
type Input = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  beds?: number;
  baths?: number;
  sqft?: number;
  source?: string;
};

export async function POST(req: Request) {
  let d: Input;
  try {
    d = (await req.json()) as Input;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }
  if (!d.email || !d.address) {
    return NextResponse.json({ ok: false, error: "email and address are required" }, { status: 400 });
  }

  const store = homeownerStore();
  const token = newToken();
  const nowIso = new Date().toISOString();
  const record: Homeowner = {
    id: token,
    token,
    firstName: d.firstName ?? "",
    lastName: d.lastName ?? "",
    email: d.email,
    phone: d.phone,
    address: d.address,
    city: d.city ?? "",
    state: d.state ?? "NV",
    zip: d.zip ?? "",
    beds: d.beds,
    baths: d.baths,
    sqft: d.sqft,
    subscribed: true,
    source: d.source ?? "home-value",
    createdAt: nowIso,
    updatedAt: nowIso,
    estimates: [],
    views: [],
  };

  try {
    await store.upsert(record);
    // Seed an initial estimate so the dashboard has data immediately.
    const est = await fetchEstimate(record);
    if (est) await store.addEstimate(token, est);
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }

  return NextResponse.json({ ok: true, token, url: dashboardUrl(token) });
}
