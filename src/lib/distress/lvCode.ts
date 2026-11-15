/**
 * City of Las Vegas code-enforcement violations from the city's open-data
 * ArcGIS feed ("Code_Enforcement_Open_Data"). Free, no key.
 *
 * CAVEAT (checked Nov 15 2026): the feed's newest Event_Date is Feb 27 2024 —
 * the city appears to have stopped adding cases even though the layer itself
 * still shows recent "last updated" stamps. With the default 730-day window
 * this sync therefore imports almost nothing today. It is kept so the source
 * switches back on by itself if the city resumes publishing; the import report
 * shows the newest date it saw so staleness is visible.
 */
import { rescore, upsertParcelsBulk, upsertSignalsBulk, type ParcelUpsert, type SignalUpsert } from "./db";
import { normalizeAddress, normalizeApn } from "./parse";

const LAYER =
  "https://services1.arcgis.com/F1v0ufATbBQScMtY/ArcGIS/rest/services/Code_Enforcement_Open_Data/FeatureServer/0/query";
const PAGE = 1000; // the layer's maxRecordCount
const SOURCE = "lv-code-open-data";

export type CodeSyncResult = {
  fetched: number;
  imported: number;
  parcels: number;
  newestEventDate: string | null;
  sinceDate: string;
  dryRun: boolean;
};

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function syncLasVegasCode(opts: { maxAgeDays: number; dryRun: boolean; maxPages?: number }): Promise<CodeSyncResult> {
  const since = new Date(Date.now() - opts.maxAgeDays * 86_400_000).toISOString().slice(0, 10);
  const where = `STAT='Open' AND Event_Date >= DATE '${since}'`;
  const maxPages = opts.maxPages ?? 30;

  let offset = 0;
  let fetched = 0;
  let imported = 0;
  let newest: number | null = null;
  const touched = new Set<string>();
  const parcels: ParcelUpsert[] = [];
  const signals: SignalUpsert[] = [];

  for (let page = 0; page < maxPages; page++) {
    const params = new URLSearchParams({
      where,
      outFields: "ObjectId,Event_Date,STAT,DESCRIPT,ADDRESS,Parcel_Number",
      orderByFields: "ObjectId",
      resultOffset: String(offset),
      resultRecordCount: String(PAGE),
      f: "json",
    });
    const res = await fetch(`${LAYER}?${params}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`Las Vegas code feed returned ${res.status}`);
    const data: any = await res.json();
    if (data.error) throw new Error(`Las Vegas code feed error: ${data.error.message ?? "unknown"}`);
    const features: any[] = data.features ?? [];
    fetched += features.length;

    for (const f of features) {
      const a = f.attributes ?? {};
      if (typeof a.Event_Date === "number") newest = Math.max(newest ?? 0, a.Event_Date);
      const apn = normalizeApn(a.Parcel_Number);
      if (!apn) continue;
      if (opts.dryRun) {
        touched.add(apn);
        imported++;
        continue;
      }
      parcels.push({
        parcelKey: apn,
        apn,
        address: normalizeAddress(a.ADDRESS ?? ""),
        city: "LAS VEGAS",
        zip: "",
        ownerName: "",
        mailAddress: "",
        mailCity: "",
        mailState: "",
        mailZip: "",
        institutional: false,
      });
      const desc = String(a.DESCRIPT ?? "").trim();
      signals.push({
        parcelKey: apn,
        ref: `${SOURCE}:${a.ObjectId}`,
        signal: {
          type: "code_violation",
          source: SOURCE,
          eventDate: typeof a.Event_Date === "number" ? new Date(a.Event_Date).toISOString().slice(0, 10) : undefined,
          detail: desc && desc.toUpperCase() !== "NONE" ? desc : undefined,
        },
      });
      touched.add(apn);
      imported++;
    }

    if (!data.exceededTransferLimit || features.length < PAGE) break;
    offset += PAGE;
  }

  if (!opts.dryRun) {
    await upsertParcelsBulk(parcels);
    await upsertSignalsBulk(signals);
    await rescore([...touched]);
  }
  return {
    fetched,
    imported,
    parcels: touched.size,
    newestEventDate: newest ? new Date(newest).toISOString().slice(0, 10) : null,
    sinceDate: since,
    dryRun: opts.dryRun,
  };
}
