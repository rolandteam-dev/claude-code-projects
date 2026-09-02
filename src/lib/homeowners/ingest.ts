/**
 * Shared homeowner ingest — turns an anonymous home-value lookup (or a FUB
 * contact, or a manual add) into a tracked homeowner with a private dashboard.
 * Used by /api/homeowners/ingest and the public estimator's "track my home"
 * step. Seeds the value history from an estimate the caller already computed
 * (preferred — matches what the user just saw) or, failing that, from a fresh
 * Repliers estimate.
 */
import { homeownerStore, newToken, type EstimatePoint, type Homeowner } from "./store";
import { valueHome } from "./nvValue";
import { dashboardUrl } from "./brand";

export type IngestInput = {
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  address: string;
  city?: string;
  state?: string;
  zip?: string;
  beds?: number;
  baths?: number;
  sqft?: number;
  source?: string;
  /** An estimate already computed for this home (e.g. the instant comp range). */
  initialEstimate?: { value: number; low?: number; high?: number };
};

export async function ingestHomeowner(
  input: IngestInput
): Promise<{ token: string; url: string; homeowner: Homeowner }> {
  const store = homeownerStore();
  const token = newToken();
  const nowIso = new Date().toISOString();

  const record: Homeowner = {
    id: token,
    token,
    firstName: input.firstName ?? "",
    lastName: input.lastName ?? "",
    email: input.email,
    phone: input.phone,
    address: input.address,
    city: input.city ?? "",
    state: input.state ?? "NV",
    zip: input.zip ?? "",
    beds: input.beds,
    baths: input.baths,
    sqft: input.sqft,
    subscribed: true,
    source: input.source ?? "home-value",
    createdAt: nowIso,
    updatedAt: nowIso,
    estimates: [],
    views: [],
  };

  await store.upsert(record);

  // Seed the value history so the dashboard has a number immediately.
  const today = nowIso.slice(0, 10);
  let seeded: EstimatePoint | null = null;
  if (input.initialEstimate?.value) {
    seeded = {
      date: today,
      value: input.initialEstimate.value,
      low: input.initialEstimate.low,
      high: input.initialEstimate.high,
    };
  } else {
    seeded = await valueHome(record);
  }
  if (seeded) {
    await store.addEstimate(token, seeded);
    record.estimates.push(seeded);
  }

  return { token, url: dashboardUrl(token), homeowner: record };
}
