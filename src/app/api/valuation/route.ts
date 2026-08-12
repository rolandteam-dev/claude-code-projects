import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * "What's My Home Worth?" — home valuation + seller lead capture.
 *
 * 1. Requests an AI AVM estimate from Repliers (POST /estimates) for the
 *    homeowner's off-market property, IF the Estimates add-on is enabled.
 * 2. ALWAYS captures the homeowner as a seller lead in Follow Up Boss (so no
 *    lead is lost even when the estimate is unavailable).
 *
 * The estimate request/response shapes below follow the Repliers docs
 * (docs.repliers.io/reference/create-an-estimate); confirm exact field names
 * against a live response once the add-on is enabled.
 */

type Input = {
  address?: string;
  city?: string;
  zip?: string;
  propertyType?: string;
  beds?: number;
  baths?: number;
  sqft?: number;
  yearBuilt?: number;
  name?: string;
  email?: string;
  phone?: string;
};

type Estimate = { value: number; low?: number; high?: number; confidence?: string };

/* eslint-disable @typescript-eslint/no-explicit-any */
const num = (v: any): number | undefined => {
  const x = Number(v);
  return Number.isFinite(x) && x > 0 ? x : undefined;
};

function mapEstimate(json: any): Estimate | null {
  const est = json?.estimate ?? json?.estimates ?? json;
  const value = num(est?.value ?? est?.estimate ?? est?.predictedValue ?? est?.price);
  if (!value) return null;
  const low = num(est?.low ?? est?.valueLow ?? est?.range?.low ?? est?.confidenceRange?.low);
  const high = num(est?.high ?? est?.valueHigh ?? est?.range?.high ?? est?.confidenceRange?.high);
  const confRaw = est?.confidence ?? est?.confidenceLevel;
  const confidence =
    typeof confRaw === "number" ? `${Math.round(confRaw <= 1 ? confRaw * 100 : confRaw)}%` : confRaw || undefined;
  return { value, low, high, confidence };
}

async function requestEstimate(d: Input): Promise<Estimate | null> {
  const key = process.env.REPLIERS_API_KEY;
  if (!key) return null;
  if (!d.address || !d.beds || !d.baths || !d.sqft) return null; // need attributes to estimate
  try {
    const res = await fetch("https://api.repliers.io/estimates", {
      method: "POST",
      headers: { "content-type": "application/json", "REPLIERS-API-KEY": key },
      body: JSON.stringify({
        boardId: Number(process.env.REPLIERS_BOARD_ID ?? 193),
        propertyType: d.propertyType,
        numBedrooms: d.beds,
        numBathrooms: d.baths,
        sqft: d.sqft,
        yearBuilt: d.yearBuilt,
        address: { streetName: d.address, city: d.city, state: "NV", zip: d.zip },
      }),
    });
    if (!res.ok) return null;
    return mapEstimate(await res.json());
  } catch {
    return null;
  }
}

async function sendLead(d: Input, estimate: Estimate | null): Promise<void> {
  const key = process.env.FUB_API_KEY;
  if (!key) return;
  const first = (d.name ?? "").trim().split(/\s+/)[0] || "";
  const last = (d.name ?? "").trim().split(/\s+/).slice(1).join(" ");
  const propertyLine = [d.address, d.city, "NV", d.zip].filter(Boolean).join(", ");
  const specs = [d.beds && `${d.beds} bd`, d.baths && `${d.baths} ba`, d.sqft && `${d.sqft} sqft`]
    .filter(Boolean)
    .join(" · ");
  const estLine = estimate
    ? `Instant estimate: $${estimate.value.toLocaleString()}${
        estimate.low && estimate.high ? ` ($${estimate.low.toLocaleString()}–$${estimate.high.toLocaleString()})` : ""
      }`
    : "Instant estimate: unavailable — follow up with a CMA.";
  try {
    await fetch("https://api.followupboss.com/v1/events", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Basic ${Buffer.from(`${key}:`).toString("base64")}`,
        "X-System": "TheRolandTeamWebsite",
      },
      body: JSON.stringify({
        source: "Home Valuation",
        system: "Roland Luxury Website",
        type: "Seller Inquiry",
        message: [`Home valuation request for ${propertyLine}`, specs, estLine].filter(Boolean).join("\n"),
        person: {
          firstName: first || undefined,
          lastName: last || undefined,
          emails: d.email ? [{ value: d.email }] : [],
          phones: d.phone ? [{ value: d.phone, type: "mobile" }] : [],
          tags: ["Seller Lead", "Home Valuation"],
          addresses: propertyLine ? [{ street: d.address, city: d.city, state: "NV", code: d.zip }] : [],
        },
      }),
    });
  } catch {
    // Swallow — the UX shouldn't fail because the CRM hiccuped.
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export async function POST(req: Request) {
  let d: Input;
  try {
    d = (await req.json()) as Input;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }
  if (!d || (!d.email && !d.phone)) {
    return NextResponse.json({ ok: false, error: "An email or phone is required." }, { status: 400 });
  }

  const estimate = await requestEstimate(d);
  await sendLead(d, estimate);

  return NextResponse.json({ ok: true, estimate });
}
