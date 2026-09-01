"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePortal } from "@/lib/portal/store";
import { trackPortal } from "@/lib/portal/track";
import { useLocationSearch } from "@/lib/portal/browser";

/** Turn the current filter set into a readable name, e.g. "Henderson · 3+ bd · under $900,000". */
function describe(params: URLSearchParams): string {
  const money = (v: string) => {
    const n = Number(v);
    return Number.isFinite(n) ? n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }) : v;
  };
  const bits = [
    params.get("q"),
    params.get("city"),
    params.get("propertyType"),
    params.get("minBeds") ? `${params.get("minBeds")}+ bd` : "",
    params.get("minBaths") ? `${params.get("minBaths")}+ ba` : "",
    params.get("minPrice") ? `from ${money(params.get("minPrice") as string)}` : "",
    params.get("maxPrice") ? `under ${money(params.get("maxPrice") as string)}` : "",
    params.get("newConstruction") ? "new construction" : "",
    params.get("noHoa") ? "no HOA" : "",
    params.get("minGarage") ? `${params.get("minGarage")}+ car garage` : "",
  ].filter(Boolean);
  return bits.length ? bits.join(" · ") : "All Las Vegas homes";
}

/**
 * Saves the current /listings filter set to the client's hub. Only meaningful
 * once they have a hub, so it invites sign-up rather than silently doing
 * nothing when they don't.
 */
export function SaveSearchButton() {
  const { state, addSearch, ready } = usePortal();
  const search = useLocationSearch();
  const [saved, setSaved] = useState(false);

  // Filters live in the URL. Page number isn't part of a saved search.
  const query = useMemo(() => {
    const params = new URLSearchParams(search);
    params.delete("page");
    return params.toString();
  }, [search]);

  if (!ready) return null;

  if (!state.profile) {
    return (
      <Link href="/portal" className="font-sans text-[0.82rem] text-[var(--color-gold)] no-underline hover:underline">
        Save this search to your hub →
      </Link>
    );
  }

  const already = saved || state.searches.some((s) => s.query === query);

  return (
    <button
      type="button"
      disabled={already}
      onClick={() => {
        const label = describe(new URLSearchParams(query));
        addSearch({ label, query });
        trackPortal("portal.saved-search", label);
        setSaved(true);
      }}
      className="font-sans text-[0.82rem] text-[var(--color-gold)] hover:underline disabled:text-[var(--color-muted)] disabled:no-underline"
    >
      {already ? "Saved to your hub" : "Save this search to your hub →"}
    </button>
  );
}
