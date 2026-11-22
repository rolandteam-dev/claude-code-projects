/**
 * Public-records property lookup — the fallback for homes that aren't in the MLS.
 *
 * Our comp engine (`lib/idx/estimate`) needs the subject home's beds/baths/sqft.
 * For a home that has transacted on the GLVAR MLS, `nvValue.resolveProperty`
 * gets those. For one that HASN'T (new construction, long-held, never listed),
 * the MLS has no record — so we look the home up in public-records / assessor
 * data instead and value it with the SAME comp engine. This closes the gap with
 * Fello, which also valued homes off public records.
 *
 * Provider-agnostic and OFF by default: `PROPERTY_DATA_PROVIDER` selects the
 * source ("rentcast" today) and `PROPERTY_DATA_API_KEY` authenticates. With
 * neither set, every call is a no-op (returns null) — so nothing changes until it
 * is deliberately configured, and the MLS path is untouched.
 *
 * We NEVER invent attributes: a lookup returns facts only when the source holds a
 * real record with a usable sqft AND beds; otherwise null, and `valueHome` falls
 * through to asking the homeowner for the details.
 */

export type PublicRecordFacts = {
  beds: number;
  baths: number;
  sqft: number;
  propertyType: string;
  style: string;
  /** which source answered — surfaced in the admin diagnostic. */
  source: string;
};

/* eslint-disable @typescript-eslint/no-explicit-any */
function num(...vals: any[]): number {
  for (const v of vals) {
    const x = Number(v);
    if (Number.isFinite(x) && x > 0) return x;
  }
  return 0;
}

/** The configured provider, lowercased; "" / "off" means disabled. */
export function publicRecordsProvider(): string {
  return (process.env.PROPERTY_DATA_PROVIDER ?? "").trim().toLowerCase();
}

/**
 * Resolve beds/baths/sqft (+ type) for an address from public-records data.
 * Returns null when the provider is off/unconfigured, the address is unusable,
 * the lookup fails, or the record lacks a real sqft + beds (never fabricated).
 */
export async function resolvePropertyFromPublicRecords(input: {
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
}): Promise<PublicRecordFacts | null> {
  const provider = publicRecordsProvider();
  const key = (process.env.PROPERTY_DATA_API_KEY ?? "").trim();
  if (!provider || provider === "off" || !key) return null; // OFF by default

  const address = (input.address ?? "").trim();
  if (!address) return null;
  const full = [
    address,
    (input.city ?? "").trim(),
    `${(input.state ?? "").trim()} ${(input.zip ?? "").trim()}`.trim(),
  ]
    .filter(Boolean)
    .join(", ");

  switch (provider) {
    case "rentcast":
      return rentcast(full, key);
    // Add providers here (attom, …) — same return shape, selected by env.
    default:
      return null; // unknown provider → no-op rather than a hard failure
  }
}

/**
 * RentCast property records (developers.rentcast.io): GET /v1/properties?address=
 * Auth via the `X-Api-Key` header. Returns the property's assessor-style record
 * (bedrooms / bathrooms / squareFootage / propertyType).
 */
async function rentcast(fullAddress: string, key: string): Promise<PublicRecordFacts | null> {
  const url = `https://api.rentcast.io/v1/properties?address=${encodeURIComponent(fullAddress)}`;
  try {
    const res = await fetch(url, {
      headers: { "X-Api-Key": key, accept: "application/json" },
      // Never hang a value/digest request on a slow upstream.
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const data: any = await res.json();
    const rec = Array.isArray(data) ? data[0] : (data?.properties?.[0] ?? data);
    if (!rec || typeof rec !== "object") return null;
    const sqft = num(rec.squareFootage, rec.squareFeet, rec.livingArea);
    const beds = num(rec.bedrooms, rec.beds);
    if (sqft <= 0 || beds <= 0) return null; // no usable record — do not fabricate
    const propertyType = String(rec.propertyType ?? "").trim();
    return {
      beds,
      baths: num(rec.bathrooms, rec.baths),
      sqft,
      propertyType,
      style: propertyType,
      source: "rentcast",
    };
  } catch {
    return null; // timeout / network / parse — fall through to the "ask the owner" path
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */
