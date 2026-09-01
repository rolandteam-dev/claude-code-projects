"use client";

import { useState } from "react";
import { usePortal } from "@/lib/portal/store";
import { trackPortal } from "@/lib/portal/track";
import { vendorCategories } from "@/content/portal";
import { site } from "@/lib/site";
import { Card, CardTitle, Pill } from "./ui";

/**
 * "My pros" — the vetted-vendor list.
 *
 * We introduce rather than publish: requesting an intro pings the agent in the
 * CRM, who makes the connection personally. That keeps partner details off a
 * public page and keeps the agent in the middle of the relationship, which is
 * the whole point of owning the client experience.
 */
export function VendorDirectory() {
  const { state } = usePortal();
  const journey = state.profile?.journey ?? "buy";
  const [requested, setRequested] = useState<string[]>([]);

  const relevant = vendorCategories.filter((v) => v.journey === "both" || v.journey === journey);

  function request(id: string, name: string) {
    setRequested((r) => [...r, id]);
    trackPortal("portal.vendor-intro", `Wants an intro to a ${name.toLowerCase()}`, { always: true });
  }

  return (
    <div>
      <CardTitle hint={`${relevant.length} categories`}>People you&apos;ll need</CardTitle>
      <p className="-mt-2 mb-6 max-w-[68ch] font-sans text-[0.9rem] text-[var(--color-ink-soft)]">
        These are the pros we work with repeatedly and trust with our own clients. Ask for an introduction and your{" "}
        {site.parentBrand} agent makes it personally — usually the same day.
      </p>

      <div className="grid gap-5 sm:grid-cols-2">
        {relevant.map((v) => {
          const done = requested.includes(v.id);
          return (
            <Card key={v.id} className="flex flex-col">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-sans text-[1rem] font-semibold text-[var(--color-ink)]">{v.name}</h3>
                <Pill tone="quiet">{v.when}</Pill>
              </div>
              <p className="mt-2 flex-1 font-sans text-[0.88rem] leading-relaxed text-[var(--color-ink-soft)]">{v.what}</p>
              {done ? (
                <div className="mt-4 rounded-md bg-[var(--color-sand)] px-4 py-3 font-sans text-[0.85rem] text-[var(--color-ink-soft)]">
                  Your agent has been notified — expect an introduction shortly.
                </div>
              ) : (
                <button type="button" onClick={() => request(v.id, v.name)} className="link-gold mt-4 self-start">
                  Request an introduction →
                </button>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
