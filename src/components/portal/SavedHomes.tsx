"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePortal } from "@/lib/portal/store";
import { trackPortal } from "@/lib/portal/track";
import type { Listing } from "@/lib/idx/types";
import { Card, CardTitle, EmptyState, Pill, money, fieldClass } from "./ui";

/**
 * Saved homes, re-fetched live from the MLS feed.
 *
 * The browser only stores ids — price, status and photos are pulled fresh, so
 * a client who saved a home three weeks ago sees today's price and finds out
 * when something has gone pending.
 */
export function SavedHomes() {
  const { state, toggleSaved, setNote, removeSearch } = usePortal();
  const ids = state.saved;
  const idKey = ids.join(",");
  // Results are stored with the id list they belong to, so a stale response for
  // a previous set of saved homes is never rendered against the current one.
  const [result, setResult] = useState<{ key: string; listings: Listing[] } | null>(null);
  const [failedKey, setFailedKey] = useState<string | null>(null);

  useEffect(() => {
    if (!idKey) return;
    let cancelled = false;
    // Every state update below happens after an await, so this effect never
    // triggers a synchronous cascading render.
    (async () => {
      try {
        const res = await fetch(`/api/listings?ids=${encodeURIComponent(idKey)}`);
        if (!res.ok) throw new Error("request failed");
        const data = (await res.json()) as { listings?: Listing[] };
        if (cancelled) return;
        setResult({ key: idKey, listings: data.listings ?? [] });
      } catch {
        if (cancelled) return;
        setFailedKey(idKey);
        setResult({ key: idKey, listings: [] });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [idKey]);

  // No saved ids means an empty list with nothing to fetch; a mismatched key
  // means the request for the current set is still in flight.
  const listings = !idKey ? [] : result?.key === idKey ? result.listings : null;
  const failed = failedKey === idKey;

  const found = new Set((listings ?? []).map((l) => l.id));
  const goneIds = ids.filter((id) => listings !== null && !found.has(id));

  return (
    <div className="space-y-10">
      <section>
        <CardTitle hint={ids.length ? `${ids.length} saved` : undefined}>Saved homes</CardTitle>

        {listings === null && (
          <div className="grid gap-5 sm:grid-cols-2">
            {[0, 1].map((i) => (
              <div key={i} className="h-40 animate-pulse rounded-[14px] border border-[var(--color-line)] bg-[var(--color-sand)]" />
            ))}
          </div>
        )}

        {listings !== null && ids.length === 0 && (
          <EmptyState title="Nothing saved yet">
            Tap the heart on any home in the search and it lands here — with your notes, and with your agent notified so
            they can pull the comps before you ask.{" "}
            <Link href="/listings" className="link-gold">Search homes →</Link>
          </EmptyState>
        )}

        {failed && ids.length > 0 && (
          <p className="font-sans text-[0.88rem] text-[var(--color-ink-soft)]">
            We couldn&apos;t reach the MLS feed just now. Your saved homes are safe — refresh in a moment.
          </p>
        )}

        {listings !== null && listings.length > 0 && (
          <div className="space-y-4">
            {listings.map((l) => (
              <div key={l.id} className="overflow-hidden rounded-[14px] border border-[var(--color-line)] bg-white">
                <div className="flex flex-col sm:flex-row">
                  <Link href={`/listings/${l.id}`} className="relative block h-44 w-full shrink-0 bg-[var(--color-graphite)] sm:h-auto sm:w-56">
                    {l.photos[0] && (
                      <Image src={l.photos[0]} alt={l.address.line1} fill sizes="224px" className="object-cover" />
                    )}
                  </Link>
                  <div className="flex-1 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <Link href={`/listings/${l.id}`} className="font-sans text-[1rem] font-semibold text-[var(--color-ink)] no-underline hover:text-[var(--color-gold)]">
                          {l.address.line1}
                        </Link>
                        <div className="font-sans text-[0.84rem] text-[var(--color-muted)]">
                          {l.address.city}, {l.address.state} {l.address.postalCode}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-serif text-[1.4rem] leading-none text-[var(--color-gold)]">{money(l.listPrice)}</div>
                        {l.status !== "Active" && <div className="mt-1"><Pill tone="quiet">{l.status}</Pill></div>}
                      </div>
                    </div>

                    <div className="mt-3 flex gap-4 font-sans text-[0.84rem] text-[var(--color-ink-soft)]">
                      <span><strong>{l.beds}</strong> bd</span>
                      <span><strong>{l.baths}</strong> ba</span>
                      <span><strong>{l.sqft.toLocaleString()}</strong> sqft</span>
                    </div>

                    <label className="mt-4 block">
                      <span className="font-sans text-[0.68rem] uppercase tracking-[0.1em] text-[var(--color-muted)]">
                        Your notes (only you see these)
                      </span>
                      <textarea
                        className={`${fieldClass} mt-1 !py-2 text-[0.88rem]`}
                        rows={2}
                        defaultValue={state.notes[l.id] ?? ""}
                        placeholder="Loved the kitchen, worried about the west-facing yard…"
                        onBlur={(e) => setNote(l.id, e.target.value)}
                      />
                    </label>

                    <div className="mt-3 flex flex-wrap gap-4">
                      <button
                        type="button"
                        onClick={() => trackPortal("portal.tour-request", `Tour request: ${l.address.line1}`, { always: true })}
                        className="link-gold"
                      >
                        Ask my agent to schedule a tour →
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleSaved(l.id)}
                        className="font-sans text-[0.8rem] uppercase tracking-[0.1em] text-[var(--color-muted)] hover:text-[var(--color-ink)]"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {goneIds.length > 0 && (
          <p className="mt-4 font-sans text-[0.85rem] text-[var(--color-muted)]">
            {goneIds.length} saved {goneIds.length === 1 ? "home is" : "homes are"} no longer in the active MLS feed —
            usually that means sold or withdrawn. Ask your agent what it closed for.{" "}
            <button
              type="button"
              onClick={() => goneIds.forEach((id) => toggleSaved(id))}
              className="underline hover:text-[var(--color-ink)]"
            >
              Clear them
            </button>
          </p>
        )}
      </section>

      <section>
        <CardTitle>Saved searches</CardTitle>
        {state.searches.length === 0 ? (
          <EmptyState title="No saved searches">
            Save a search from the results page and we&apos;ll watch it for you — new listings that match go to your
            agent, who sends the ones actually worth your time.
          </EmptyState>
        ) : (
          <div className="space-y-3">
            {state.searches.map((s) => (
              <Card key={s.id} className="flex flex-wrap items-center justify-between gap-4 !py-4">
                <div>
                  <div className="font-sans text-[0.94rem] font-semibold text-[var(--color-ink)]">{s.label}</div>
                  <div className="font-sans text-[0.8rem] text-[var(--color-muted)]">
                    Saved {new Date(s.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Link href={`/listings?${s.query}`} className="link-gold">Run search →</Link>
                  <button
                    type="button"
                    onClick={() => removeSearch(s.id)}
                    className="font-sans text-[0.8rem] uppercase tracking-[0.1em] text-[var(--color-muted)] hover:text-[var(--color-ink)]"
                  >
                    Remove
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
