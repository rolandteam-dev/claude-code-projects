/**
 * Normalized listing model, aligned to the RESO Data Dictionary so any
 * MLS/IDX provider (RESO Web API, Bridge/Trestle, Spark, SimplyRETS) maps
 * cleanly onto it. The rest of the app only ever sees this shape — swapping
 * providers never touches the UI.
 */

export type ListingStatus = "Active" | "Pending" | "Closed" | "Coming Soon";

export type PropertyType =
  | "Single Family"
  | "Condo"
  | "Townhouse"
  | "Land"
  | "Multi-Family";

export type Listing = {
  /** Stable provider id used in the URL, e.g. the MLS listing key */
  id: string;
  /** Human-facing MLS number (for display + attribution) */
  mlsNumber: string;
  status: ListingStatus;
  listPrice: number;
  address: {
    line1: string;
    city: string;
    state: string;
    postalCode: string;
    /** community slug if we can map it to one of our community pages */
    communitySlug?: string;
  };
  beds: number;
  baths: number;
  /** interior square footage */
  sqft: number;
  /** lot size in acres (optional) */
  lotAcres?: number;
  yearBuilt?: number;
  propertyType: PropertyType;
  description: string;
  /** absolute or app-relative photo URLs; empty array renders a placeholder */
  photos: string[];
  coords?: { lat: number; lng: number };
  listedDate: string; // ISO date
  /** last feed update for this listing (ISO), for the IDX "last updated" line */
  updatedAt?: string;
  /** Listing brokerage — REQUIRED for IDX attribution/compliance */
  listingOffice: string;
  /** true for our own team's listings (can be highlighted) */
  isOurListing?: boolean;

  /* ---- Extended detail (all optional; render only when present) ---- */
  /** covered garage spaces */
  garageSpaces?: number;
  /** number of levels/stories */
  stories?: number;
  /** architectural style, e.g. "Contemporary", "Two Story" */
  style?: string;
  /** subdivision / neighborhood name from the feed */
  subdivision?: string;
  /** county the property is in (e.g. "Clark") */
  county?: string;
  /** assigned school district */
  schoolDistrict?: string;
  /** assigned/nearby schools when the feed provides them */
  schools?: string[];
  /** days on market (derived from listedDate if the feed omits it) */
  daysOnMarket?: number;
  /** HOA / association fee amount */
  hoaFee?: number;
  /** how often the HOA fee is charged, e.g. "Monthly", "Quarterly" */
  hoaFrequency?: string;
  /** annual property tax amount */
  annualTax?: number;
  heating?: string;
  cooling?: string;
  /** pool description, e.g. "Private", "Community", "None" */
  pool?: string;
  view?: string;
  /** flattened interior/exterior features + amenities for a chip list */
  features?: string[];
  /** individual rooms with dimensions, when the feed provides them */
  rooms?: { name: string; dimensions?: string; level?: string }[];
  /** 3D tour / video walkthrough URL */
  virtualTourUrl?: string;
  /** prior MLS records for this address (sold / listed / leased), newest first */
  history?: { date: string; event: string; price?: number }[];
  /** Repliers AI AVM estimate (present when the Estimates add-on is enabled) */
  estimate?: { value: number; low?: number; high?: number; confidence?: string };
};

export type ListingFilters = {
  /** free-text keyword: address, street, subdivision, or MLS number */
  q?: string;
  city?: string;
  communitySlug?: string;
  minPrice?: number;
  maxPrice?: number;
  minBeds?: number;
  minBaths?: number;
  propertyType?: PropertyType;
  status?: ListingStatus;
  /* ---- Facet filters (applied in-app; not native MLS query params) ---- */
  /** minimum covered garage spaces, e.g. 3 for "3+ car garage" */
  minGarage?: number;
  /** only homes with no HOA fee reported */
  noHoa?: boolean;
  /** only 55+/age-restricted communities */
  ageRestricted?: boolean;
  /** only new construction — built in the previous calendar year or newer */
  newConstruction?: boolean;
  /** only homes whose features/remarks mention RV parking */
  rvParking?: boolean;
  /** result page size */
  limit?: number;
  offset?: number;
};

export type ListingResult = {
  listings: Listing[];
  total: number;
  /** true when data is sample/placeholder rather than a live MLS feed */
  isSampleData: boolean;
  /** most-recent feed update timestamp (ISO) for the IDX "last updated" line */
  lastUpdated?: string;
  /** true when the upstream feed errored and results are a safe empty fallback */
  error?: boolean;
};
