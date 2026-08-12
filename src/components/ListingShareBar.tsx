"use client";

import { useEffect, useRef, useState } from "react";
import { getIdentifiedEmail } from "@/lib/identity";
import { sendFubEvent, type FubProperty } from "@/lib/fubEvents";

/**
 * Save + Share bar for a listing. "Save" favorites the home to the browser
 * (localStorage) so it persists without an account, and also sends a "Saved
 * Property" event to Follow Up Boss when we already know the visitor's
 * email; "Share" opens a menu with Facebook, X, LinkedIn, WhatsApp, Email,
 * Text message, and Copy link, plus the native share sheet on mobile.
 */
export function ListingShareBar({
    url,
    title,
    listingId,
    property,
}: {
    url: string;
    title: string;
    listingId: string;
    property: FubProperty;
}) {
    const [open, setOpen] = useState(false);
    const [saved, setSaved] = useState(false);
    const [copied, setCopied] = useState(false);
    const [canNativeShare, setCanNativeShare] = useState(false);
    const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
        // Read client-only state on mount (avoids SSR hydration mismatch).
                /* eslint-disable react-hooks/set-state-in-effect */
                try {
                        const list = JSON.parse(localStorage.getItem("rl_saved_listings") || "[]");
                        setSaved(Array.isArray(list) && list.includes(listingId));
                } catch {}
        setCanNativeShare(typeof navigator !== "undefined" && !!navigator.share);
        /* eslint-enable react-hooks/set-state-in-effect */
  }, [listingId]);

  useEffect(() => {
        if (!open) return;
        const onDown = (e: MouseEvent) => {
                if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", onDown);
        return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  function toggleSave() {
        try {
                const raw = JSON.parse(localStorage.getItem("rl_saved_listings") || "[]");
                const arr: string[] = Array.isArray(raw) ? raw : [];
                const isSaving = !arr.includes(listingId);
                const next = isSaving ? [...arr, listingId] : arr.filter((x) => x !== listingId);
                localStorage.setItem("rl_saved_listings", JSON.stringify(next));
                setSaved(next.includes(listingId));
                // Only fire the FUB "Saved Property" event when the visitor saves the
          // listing (not when un-saving), and only when we know their email.
          if (isSaving) {
                    void sendFubEvent("Saved Property", property, getIdentifiedEmail());
          }
        } catch {}
  }

  async function copyLink() {
        try {
                await navigator.clipboard.writeText(url);
                setCopied(true);
                setTimeout(() => setCopied(false), 1600);
        } catch {}
  }

  const e = encodeURIComponent;
    const links: { label: string; href: string; icon: React.ReactNode }[] = [
      { label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${e(url)}`, icon: <Badge>f</Badge> },
      { label: "X", href: `https://twitter.com/intent/tweet?url=${e(url)}&text=${e(title)}`, icon: <Badge>X</Badge> },
      { label: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${e(url)}`, icon: <Badge>in</Badge> },
      { label: "WhatsApp", href: `https://wa.me/?text=${e(`${title} ${url}`)}`, icon: <Badge>W</Badge> },
      { label: "Email", href: `mailto:?subject=${e(title)}&body=${e(url)}`, icon: <Badge>@</Badge> },
      { label: "Text message", href: `sms:?&body=${e(`${title} ${url}`)}`, icon: <Badge>T</Badge> },
        ];
  
    const btn =
          "inline-flex items-center gap-1.5 rounded-full border border-[var(--color-line)] bg-white px-3.5 py-1.5 font-sans text-[0.8rem] font-semibold text-[var(--color-ink)] transition-colors hover:border-[var(--color-gold)]";
  
    return (
          <div ref={wrapRef} className="relative flex items-center gap-2">
                <button type="button" onClick={toggleSave} className={btn} aria-pressed={saved}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill={saved ? "var(--color-gold)" : "none"} stroke="var(--color-gold)" strokeWidth="2" aria-hidden="true">
                                  <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 1 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8z" />
                        </svg>
                  {saved ? "Saved" : "Save"}
                </button>
          
                <button type="button" onClick={() => setOpen((o) => !o)} className={btn} aria-expanded={open} aria-haspopup="menu">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                  <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                                  <line x1="8.6" y1="13.5" x2="15.4" y2="17.5" /><line x1="15.4" y1="6.5" x2="8.6" y2="10.5" />
                        </svg>
                        Share
                </button>
          
            {open && (
                    <div
                                role="menu"
                                className="absolute right-0 top-[calc(100%+8px)] z-30 w-52 overflow-hidden rounded-[12px] border border-[var(--color-line)] bg-white py-1.5 shadow-[var(--shadow-soft)]"
                              >
                      {links.map((l) => (
                                            <a
                                                            key={l.label}
                                                            href={l.href}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            onClick={() => setOpen(false)}
                                                            className="flex items-center gap-3 px-4 py-2 font-sans text-[0.85rem] text-[var(--color-ink)] no-underline hover:bg-[var(--color-sand)]"
                                                          >
                                              {l.icon}
                                              {l.label}
                                            </a>
                                          ))}
                              <button
                                            type="button"
                                            onClick={copyLink}
                                            className="flex w-full items-center gap-3 px-4 py-2 text-left font-sans text-[0.85rem] text-[var(--color-ink)] hover:bg-[var(--color-sand)]"
                                          >
                                          <Badge>L</Badge>
                                {copied ? "Copied!" : "Copy link"}
                              </button>
                      {canNativeShare && (
                                            <button
                                                            type="button"
                                                            onClick={() => {
                                                                              navigator.share({ title, url }).catch(() => {});
                                                                              setOpen(false);
                                                            }}
                                                            className="flex w-full items-center gap-3 px-4 py-2 text-left font-sans text-[0.85rem] text-[var(--color-ink)] hover:bg-[var(--color-sand)]"
                                                          >
                                                          <Badge>M</Badge>
                                                          More options
                                            </button>
                              )}
                    </div>
                )}
          </div>
        );
}

function Badge({ children }: { children: React.ReactNode }) {
    return (
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-sand-deep,#efeae0)] font-sans text-[0.72rem] font-semibold text-[var(--color-graphite)]">
            {children}
          </span>
        );
}</Badge>
