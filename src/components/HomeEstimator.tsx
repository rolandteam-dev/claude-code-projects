"use client";

import { useRef, useState } from "react";
import { site } from "@/lib/site";
import { AddressAutocomplete, type StructuredAddress } from "@/components/AddressAutocomplete";

type Estimate = { low: number; mid: number; high: number; compCount: number; ppsfMedian: number };
type ApiResponse = { ok: true; estimate: Estimate } | { ok: false; reason: string };

/** Where a field's current value came from — never a fabricated default. */
type Src = "" | "mls" | "user";

const fmt = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

const field =
  "w-full rounded-md border border-[var(--color-line)] bg-white px-3 py-2.5 font-sans text-[0.95rem] text-[var(--color-ink)] focus:border-[var(--color-gold)] focus:outline-none";
const label = "mb-1 block font-sans text-[0.66rem] font-semibold uppercase tracking-[0.1em] text-[var(--color-muted)]";

/**
 * Instant comp-based home value estimator with Google Places autocomplete.
 * Picking an address pre-fills beds/baths/sqft from the MLS (editable, tagged
 * "from records"); when the MLS has no record, the fields are blank for manual
 * entry. Nothing is ever invented — beds has no default. Posts ZIP + beds + sqft
 * to /api/home-estimate (sold comps) and shows a low/mid/high range.
 *
 * `showCmaButton` (default true) toggles the "Get my precise CMA →" link.
 */
export function HomeEstimator({ showCmaButton = true }: { showCmaButton?: boolean } = {}) {
  const [f, setF] = useState({
    address: "",
    zip: "",
    city: "",
    state: "NV",
    propertyType: "Single Family",
    beds: "", // no default — never invented
    baths: "",
    sqft: "",
  });
  // Where each editable value came from (for the "from records" tag).
  const [src, setSrc] = useState<{ beds: Src; baths: Src; sqft: Src; propertyType: Src }>({
    beds: "",
    baths: "",
    sqft: "",
    propertyType: "",
  });
  // Structured geo captured from Places (lat/lng held for a future distance-comp
  // pass — see the PR notes). Kept in a ref: it feeds no request in this version,
  // so it must not trigger re-renders or read as unused state.
  const geoRef = useRef<{ streetNumber: string; streetName: string; lat: number | null; lng: number | null }>({
    streetNumber: "",
    streetName: "",
    lat: null,
    lng: null,
  });
  const [prefilling, setPrefilling] = useState(false);

  const [status, setStatus] = useState<"idle" | "loading" | "done" | "nocomps" | "error">("idle");
  const [estimate, setEstimate] = useState<Estimate | null>(null);

  // "Track my home" capture → homeowner dashboard + value updates.
  const [track, setTrack] = useState({ name: "", email: "", address: "" });
  const [trackStatus, setTrackStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [dashUrl, setDashUrl] = useState<string | null>(null);

  function set<K extends keyof typeof f>(k: K, v: string) {
    setF((prev) => ({ ...prev, [k]: v }));
  }
  /** User-typed edit of a prefillable field → mark it as user-sourced. */
  function edit(k: "beds" | "baths" | "sqft" | "propertyType", v: string) {
    set(k, v);
    setSrc((prev) => ({ ...prev, [k]: "user" }));
  }

  /** User picked a Places suggestion → fill address parts, then prefill from MLS. */
  async function onPickAddress(a: StructuredAddress) {
    setF((prev) => ({ ...prev, address: a.address, city: a.city || prev.city, zip: a.zip || prev.zip, state: a.state || prev.state }));
    geoRef.current = { streetNumber: a.streetNumber, streetName: a.streetName, lat: a.lat, lng: a.lng };
    if (!a.address || !a.zip) return;
    setPrefilling(true);
    try {
      const res = await fetch("/api/homeowners/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: a.address, zip: a.zip }),
      });
      const d = await res.json();
      if (d?.ok && d.found) {
        setF((prev) => ({
          ...prev,
          beds: d.beds ? String(d.beds) : prev.beds,
          baths: d.baths ? String(d.baths) : prev.baths,
          sqft: d.sqft ? String(d.sqft) : prev.sqft,
          propertyType: d.propertyType || prev.propertyType,
        }));
        setSrc({
          beds: d.beds ? "mls" : "",
          baths: d.baths ? "mls" : "",
          sqft: d.sqft ? "mls" : "",
          propertyType: d.propertyType ? "mls" : "",
        });
      }
    } catch {
      // leave fields for manual entry — never guess
    } finally {
      setPrefilling(false);
    }
  }

  const fromRecords = (k: "beds" | "baths" | "sqft" | "propertyType") =>
    src[k] === "mls" ? <span className="ml-2 font-sans text-[0.6rem] font-semibold normal-case text-[var(--color-gold)]">✓ from records</span> : null;

  async function saveTracking(e: React.FormEvent) {
    e.preventDefault();
    const address = (track.address || f.address).trim();
    if (!track.email.trim() || !address) {
      setTrackStatus("error");
      return;
    }
    setTrackStatus("sending");
    const parts = track.name.trim().split(/\s+/);
    try {
      const res = await fetch("/api/homeowners/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: parts[0] || undefined,
          lastName: parts.slice(1).join(" ") || undefined,
          email: track.email,
          address,
          city: f.city,
          zip: f.zip,
          beds: Number(f.beds) || undefined,
          sqft: Number(f.sqft) || undefined,
          source: "home-value",
          initialEstimate: estimate ? { value: estimate.mid, low: estimate.low, high: estimate.high } : undefined,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setDashUrl(data.url as string);
        setTrackStatus("done");
      } else {
        setTrackStatus("error");
      }
    } catch {
      setTrackStatus("error");
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.zip.trim() || !f.beds || !f.sqft.trim()) {
      setStatus("error");
      return;
    }
    setStatus("loading");
    try {
      const res = await fetch("/api/home-estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          zip: f.zip,
          city: f.city,
          propertyType: f.propertyType,
          beds: Number(f.beds),
          sqft: Number(f.sqft),
        }),
      });
      const data: ApiResponse = await res.json();
      if (data.ok) {
        setEstimate(data.estimate);
        setStatus("done");
      } else {
        setStatus("nocomps");
      }
    } catch {
      setStatus("nocomps");
    }
  }

  const trackBox = (
    <div className="mt-5 rounded-[12px] border border-[var(--color-line)] bg-[var(--color-sand)] p-4">
      {trackStatus === "done" ? (
        <div className="text-center">
          <div className="font-serif text-[1.15rem] text-[var(--color-ink)]">Your dashboard is ready ✦</div>
          <p className="mt-1 font-sans text-[0.82rem] text-[var(--color-ink-soft)]">
            We&apos;ll email you value updates as the market moves. Check your inbox for the link.
          </p>
          {dashUrl && (
            <a href={dashUrl} target="_blank" rel="noreferrer" className="btn mt-3 inline-block">
              View my home dashboard →
            </a>
          )}
        </div>
      ) : (
        <form onSubmit={saveTracking}>
          <div className="font-sans text-[0.92rem] font-semibold text-[var(--color-ink)]">
            {estimate ? "Track this home's value — free" : "Get your private home dashboard — free"}
          </div>
          <p className="mt-1 font-sans text-[0.78rem] text-[var(--color-ink-soft)]">
            {estimate
              ? "Get a private dashboard and value updates as the market moves."
              : "We'll set up your dashboard and our team will prepare your valuation by hand."}
          </p>
          <div className="mt-3 space-y-2">
            {!f.address.trim() && (
              <AddressAutocomplete
                className={field}
                placeholder="Street address"
                value={track.address}
                onTextChange={(v) => setTrack((p) => ({ ...p, address: v }))}
                onPick={(a) => {
                  setTrack((p) => ({ ...p, address: a.address }));
                  setF((prev) => ({ ...prev, city: a.city || prev.city, zip: a.zip || prev.zip }));
                }}
              />
            )}
            <input
              className={field}
              placeholder="Your name"
              value={track.name}
              onChange={(e) => setTrack((p) => ({ ...p, name: e.target.value }))}
              aria-label="Your name"
            />
            <input
              className={field}
              type="email"
              placeholder="Email"
              value={track.email}
              onChange={(e) => setTrack((p) => ({ ...p, email: e.target.value }))}
              aria-label="Email"
              required
            />
            {trackStatus === "error" && (
              <div className="font-sans text-[0.76rem] text-[#b4433a]">Please add your email and street address.</div>
            )}
            <button type="submit" disabled={trackStatus === "sending"} className="btn w-full disabled:opacity-60">
              {trackStatus === "sending" ? "Setting up…" : estimate ? "Track my home value" : "Create my dashboard"}
            </button>
            <p className="text-center font-sans text-[0.62rem] text-[var(--color-muted)]">
              Periodic value updates from {site.name}. Unsubscribe anytime.
            </p>
          </div>
        </form>
      )}
    </div>
  );

  if (status === "done" && estimate) {
    return (
      <div className="rounded-[14px] bg-white p-7 text-[var(--color-ink)] shadow-[var(--shadow-soft)]">
        <div className="font-sans text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">
          Estimated value range
        </div>
        <div className="mt-1 font-serif text-[2.9rem] leading-none text-[var(--color-gold)]">{fmt(estimate.mid)}</div>
        <div className="mt-2 font-sans text-[0.95rem] text-[var(--color-ink-soft)]">
          Likely range <strong>{fmt(estimate.low)}</strong> – <strong>{fmt(estimate.high)}</strong>
        </div>
        <div className="mt-3 rounded-md bg-[var(--color-sand)] px-3 py-2 font-sans text-[0.78rem] text-[var(--color-ink-soft)]">
          Based on <strong>{estimate.compCount}</strong> sold comps in {f.zip} over the past 6 months · median{" "}
          {fmt(estimate.ppsfMedian)}/sqft.
        </div>
        <a href="#request-cma" className={`btn mt-5 w-full${showCmaButton ? "" : " hidden"}`}>
          Get my precise CMA →
        </a>

        {trackBox}

        <button
          type="button"
          onClick={() => {
            setStatus("idle");
            setEstimate(null);
          }}
          className="mt-3 block w-full text-center font-sans text-[0.8rem] font-semibold text-[var(--color-gold)]"
        >
          Estimate another home
        </button>
        <p className="mt-3 font-sans text-[0.64rem] leading-relaxed text-[var(--color-muted)]">
          This is a data-backed estimate from recent sold comparables, not an appraisal or a guarantee of value. Your
          home&apos;s condition, upgrades, lot, and view can move the number ±15%. For a precise figure, request a CMA.
        </p>
      </div>
    );
  }

  if (status === "nocomps") {
    return (
      <div className="rounded-[14px] bg-white p-7 text-[var(--color-ink)] shadow-[var(--shadow-soft)]">
        <div className="font-serif text-[1.4rem] text-[var(--color-ink)]">Let&apos;s run this one by hand</div>
        <p className="mt-2 font-sans text-[0.9rem] text-[var(--color-ink-soft)]">
          There aren&apos;t enough recent sold comparables in {f.zip || "that ZIP"} that match your home to give a
          defensible instant range — which is common for unique or luxury properties. {site.founder.split(" ")[0]}&apos;s
          team will pull the full comp set and prepare a precise CMA.
        </p>
        <a href="#request-cma" className={`btn mt-5 w-full${showCmaButton ? "" : " hidden"}`}>
          Request a free CMA →
        </a>

        {trackBox}

        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-3 block w-full text-center font-sans text-[0.8rem] font-semibold text-[var(--color-gold)]"
        >
          Try a different home
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-[14px] bg-white p-7 text-[var(--color-ink)] shadow-[var(--shadow-soft)]">
      <div className="font-sans text-[1.1rem] font-semibold">Get a starting home value</div>
      <p className="mt-1 font-sans text-[0.82rem] text-[var(--color-ink-soft)]">
        Start typing your address — we&apos;ll pull your home&apos;s details automatically. No sign-up to see the number.
      </p>
      <div className="mt-4 space-y-3">
        <div>
          <label className={label}>Street address</label>
          <AddressAutocomplete
            className={field}
            placeholder="123 Main St, Las Vegas, NV"
            value={f.address}
            onTextChange={(v) => set("address", v)}
            onPick={onPickAddress}
          />
          {prefilling && (
            <p className="mt-1 font-sans text-[0.68rem] text-[var(--color-muted)]">Looking up your home&apos;s details…</p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={label}>ZIP code *</label>
            <input
              className={field}
              inputMode="numeric"
              placeholder="89135"
              value={f.zip}
              onChange={(e) => set("zip", e.target.value.replace(/[^0-9]/g, "").slice(0, 5))}
              required
            />
          </div>
          <div>
            <label className={label}>City</label>
            <input className={field} placeholder="Las Vegas" value={f.city} onChange={(e) => set("city", e.target.value)} />
          </div>
        </div>
        <div>
          <label className={label}>Property type{fromRecords("propertyType")}</label>
          <select className={field} value={f.propertyType} onChange={(e) => edit("propertyType", e.target.value)}>
            <option>Single Family</option>
            <option>Condo</option>
            <option>Townhouse</option>
            <option>Multi-Family</option>
          </select>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={label}>Bedrooms *{fromRecords("beds")}</label>
            <select className={field} value={f.beds} onChange={(e) => edit("beds", e.target.value)} required>
              <option value="">Select</option>
              {["1", "2", "3", "4", "5", "6"].map((b) => (
                <option key={b} value={b}>
                  {b === "6" ? "6+" : b}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Baths{fromRecords("baths")}</label>
            <select className={field} value={f.baths} onChange={(e) => edit("baths", e.target.value)}>
              <option value="">—</option>
              {["1", "2", "3", "4", "5"].map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Sq ft *{fromRecords("sqft")}</label>
            <input
              className={field}
              inputMode="numeric"
              placeholder="2,400"
              value={f.sqft}
              onChange={(e) => edit("sqft", e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
              required
            />
          </div>
        </div>
        {status === "error" && (
          <div className="font-sans text-[0.78rem] text-[#b4433a]">Please enter your ZIP, bedrooms, and square footage.</div>
        )}
        <button type="submit" disabled={status === "loading"} className="btn w-full disabled:opacity-60">
          {status === "loading" ? "Pulling comps…" : "Estimate my home value →"}
        </button>
        <p className="text-center font-sans text-[0.64rem] text-[var(--color-muted)]">
          Live Nevada MLS data · Instant range from sold comps · Not an appraisal.
        </p>
      </div>
    </form>
  );
}
