/**
 * Offer Machine — MLS lookup by address, through the app's existing listing feed
 * (Repliers / GLVAR). Fails open: any problem returns null and the bot simply asks
 * the agent for the list price. Only an exact street match is accepted
 * (see pickListing); a wrong list price is worse than a question.
 */
import { getListings } from "@/lib/idx/provider";
import { pickListing } from "./terms";

export interface ListingHit {
  listPrice: number;
  mlsNumber: string;
  status: string;
  matchedAddress: string;
}

export async function lookupListing(address: string): Promise<ListingHit | null> {
  try {
    const res = await getListings({ q: address, limit: 10 });
    if (res.error || res.isSampleData) return null;
    const hit = pickListing(res.listings, address);
    if (!hit || !hit.listPrice) return null;
    return {
      listPrice: hit.listPrice,
      mlsNumber: hit.mlsNumber,
      status: hit.status,
      matchedAddress: `${hit.address.line1}, ${hit.address.city}`,
    };
  } catch (e) {
    console.error("[offers] listing lookup failed", e instanceof Error ? e.message : e);
    return null;
  }
}
