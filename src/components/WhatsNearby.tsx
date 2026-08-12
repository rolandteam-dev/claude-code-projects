/**
 * "What's Nearby" — great-circle distance from a listing to major Las Vegas
 * landmarks, computed from the listing's coordinates. No external data or API;
 * distances are straight-line (as the crow flies), so we say so.
 */
const LANDMARKS: { name: string; lat: number; lng: number; icon: string }[] = [
  { name: "Las Vegas Strip", lat: 36.1147, lng: -115.1728, icon: "🎰" },
  { name: "Harry Reid Int'l Airport", lat: 36.084, lng: -115.1537, icon: "✈️" },
  { name: "Allegiant Stadium", lat: 36.0909, lng: -115.1833, icon: "🏟️" },
  { name: "T-Mobile Arena", lat: 36.1028, lng: -115.1783, icon: "🏒" },
  { name: "Downtown Summerlin", lat: 36.1663, lng: -115.3281, icon: "🛍️" },
  { name: "Red Rock Canyon", lat: 36.1355, lng: -115.4272, icon: "⛰️" },
  { name: "Downtown / Fremont St.", lat: 36.1699, lng: -115.1423, icon: "🎆" },
  { name: "Lake Mead (Boulder Beach)", lat: 36.019, lng: -114.79, icon: "🌊" },
  { name: "The District at Green Valley Ranch", lat: 36.0114, lng: -115.0844, icon: "🍽️" },
  { name: "Ascaya / McCullough foothills", lat: 35.985, lng: -115.03, icon: "🏔️" },
];

function milesBetween(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 3958.8; // Earth radius in miles
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const s =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

export function WhatsNearby({ lat, lng }: { lat: number; lng: number }) {
  const nearby = LANDMARKS.map((l) => ({ ...l, mi: milesBetween(lat, lng, l.lat, l.lng) }))
    .sort((a, b) => a.mi - b.mi)
    .slice(0, 6);

  return (
    <div className="rounded-[12px] border border-[var(--color-line)] bg-[var(--color-sand)] p-5">
      <div className="font-sans text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">
        What&apos;s Nearby
      </div>
      <ul className="mt-3 space-y-2.5 p-0">
        {nearby.map((n) => (
          <li key={n.name} className="flex items-center justify-between gap-4 font-sans text-[0.88rem]">
            <span className="flex items-center gap-2.5 text-[var(--color-ink)]">
              <span aria-hidden="true">{n.icon}</span>
              {n.name}
            </span>
            <span className="shrink-0 font-semibold text-[var(--color-muted)]">{n.mi.toFixed(1)} mi</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 font-sans text-[0.68rem] text-[var(--color-muted)]">
        Straight-line distances from the property. Drive times vary by route and traffic.
      </p>
    </div>
  );
}
