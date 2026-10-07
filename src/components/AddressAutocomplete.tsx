"use client";

import { useEffect, useRef, useState } from "react";

export type StructuredAddress = {
  address: string; // "1234 Main St"
  streetNumber: string;
  streetName: string;
  city: string;
  state: string;
  zip: string;
  lat: number | null;
  lng: number | null;
  formatted: string;
};

type Suggestion = { placeId: string; text: string };

/**
 * Google Places (New) autocomplete over our server proxy — the API key never
 * reaches the browser. Fails soft: if Places is unavailable, no suggestions
 * appear and the field is a normal text input, so the user can always finish
 * typing their address (requirement: a Places outage never blocks an estimate).
 */
export function AddressAutocomplete({
  value,
  onTextChange,
  onPick,
  placeholder,
  className,
  autoFocus,
}: {
  value: string;
  onTextChange: (text: string) => void;
  onPick: (s: StructuredAddress) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [noResults, setNoResults] = useState(false);
  const sessionRef = useRef<string>(newSession());
  const boxRef = useRef<HTMLDivElement>(null);
  const skipNext = useRef(false); // don't re-query right after a pick

  // Debounced autocomplete query. All state changes happen inside the timeout
  // callback (not synchronously in the effect body) to avoid cascading renders.
  useEffect(() => {
    if (skipNext.current) {
      skipNext.current = false;
      return;
    }
    const q = value.trim();
    const t = setTimeout(async () => {
      if (q.length < 3) {
        setSuggestions([]);
        setNoResults(false);
        setOpen(false);
        return;
      }
      try {
        const res = await fetch("/api/places/autocomplete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ input: q, sessionToken: sessionRef.current }),
        });
        const data = await res.json();
        const list: Suggestion[] = Array.isArray(data?.suggestions) ? data.suggestions : [];
        setSuggestions(list);
        setNoResults(list.length === 0);
        setOpen(list.length > 0);
      } catch {
        setSuggestions([]);
        setNoResults(true);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [value]);

  // Close the dropdown on outside click.
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  async function choose(s: Suggestion) {
    setOpen(false);
    setSuggestions([]);
    skipNext.current = true;
    onTextChange(s.text); // reflect the chosen text immediately
    try {
      const res = await fetch(
        `/api/places/details?placeId=${encodeURIComponent(s.placeId)}&session=${encodeURIComponent(sessionRef.current)}`,
      );
      const d = await res.json();
      if (d?.ok) {
        onPick({
          address: d.address || s.text,
          streetNumber: d.streetNumber || "",
          streetName: d.streetName || "",
          city: d.city || "",
          state: d.state || "",
          zip: d.zip || "",
          lat: d.lat ?? null,
          lng: d.lng ?? null,
          formatted: d.formatted || s.text,
        });
      }
    } catch {
      // keep the typed text; user can finish manually
    } finally {
      sessionRef.current = newSession(); // a session ends at details
    }
  }

  return (
    <div ref={boxRef} className="relative">
      <input
        className={className}
        value={value}
        placeholder={placeholder}
        autoComplete="off"
        autoFocus={autoFocus}
        onChange={(e) => onTextChange(e.target.value)}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        aria-label="Street address"
      />
      {open && suggestions.length > 0 && (
        <ul className="absolute left-0 right-0 top-full z-20 mt-1 max-h-60 overflow-auto rounded-md border border-[var(--color-line)] bg-white py-1 shadow-[var(--shadow-soft)]">
          {suggestions.map((s) => (
            <li key={s.placeId}>
              <button
                type="button"
                onClick={() => choose(s)}
                className="block w-full px-3 py-2 text-left font-sans text-[0.9rem] text-[var(--color-ink)] hover:bg-[var(--color-sand)]"
              >
                {s.text}
              </button>
            </li>
          ))}
        </ul>
      )}
      {noResults && value.trim().length >= 5 && (
        <p className="mt-1 font-sans text-[0.68rem] text-[var(--color-muted)]">
          Not seeing your address? Just finish typing it — you can enter the details manually.
        </p>
      )}
    </div>
  );
}

function newSession(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}
