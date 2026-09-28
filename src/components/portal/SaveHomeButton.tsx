"use client";

import { usePortal } from "@/lib/portal/store";
import { trackPortal } from "@/lib/portal/track";
import { trackListingSave } from "@/lib/buyer/track";
import type { PropertyRef } from "@/lib/buyer/activity";

/**
 * Heart toggle shown on listing cards and listing detail pages.
 *
 * Saving is the highest-signal thing a client does on the site, so it posts to
 * the CRM with the address — that's what turns "someone browsed" into "call
 * Jane about 123 Quail Run".
 *
 * Two routes to the CRM, and exactly one runs per save so an agent never sees
 * the same save twice: a client with a hub reports through the portal (which
 * carries their journey context), and a visitor identified only by a campaign
 * link reports as buyer activity.
 */
export function SaveHomeButton({
  id,
  address,
  property,
  variant = "icon",
}: {
  id: string;
  address: string;
  /** Listing detail for the CRM event. Without it the event still fires, with less context. */
  property?: PropertyRef;
  variant?: "icon" | "button";
}) {
  const { state, toggleSaved, ready } = usePortal();
  const saved = state.saved.includes(id);

  function onClick(e: React.MouseEvent) {
    // Cards wrap the whole tile in a link — don't navigate when saving.
    e.preventDefault();
    e.stopPropagation();
    toggleSaved(id);
    if (saved) return; // un-saving is a correction, not a signal
    if (state.profile) {
      trackPortal("portal.saved-home", address);
    } else {
      // No hub — only a campaign-link identity can attribute this.
      trackListingSave(property ?? { address });
    }
  }

  const label = saved ? "Saved — remove from your hub" : "Save this home to your hub";

  if (variant === "button") {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={saved}
        className={[
          "btn btn-ghost !px-5 !py-3",
          saved ? "!border-[var(--color-gold)] !text-[var(--color-gold)]" : "",
        ].join(" ")}
      >
        <Heart filled={saved} />
        {saved ? "Saved" : "Save home"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={saved}
      aria-label={label}
      title={label}
      // Hidden until storage has been read so the icon never flips after hydration.
      className={[
        "flex h-9 w-9 items-center justify-center rounded-full border border-white/40 bg-black/35 backdrop-blur transition-colors hover:bg-black/55",
        saved ? "text-[var(--color-gold-3)]" : "text-white",
        ready ? "" : "invisible",
      ].join(" ")}
    >
      <Heart filled={saved} />
    </button>
  );
}

function Heart({ filled }: { filled: boolean }) {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1L12 21.2l7.7-7.8 1.1-1a5.5 5.5 0 0 0 0-7.8z" />
    </svg>
  );
}
