/**
 * Market report data. Designed to be refreshed monthly (the daily/market
 * automation can rewrite this file). Figures here are ILLUSTRATIVE
 * placeholders until wired to a live MLS statistics source — the UI labels
 * them as sample so nothing is presented as verified data.
 */

export type AreaStat = {
  area: string;
  medianPrice: number;
  /** year-over-year median price change, percent (e.g. 3.2 or -1.5) */
  priceYoY: number;
  /** median days on market */
  medianDom: number;
  /** active inventory count */
  activeListings: number;
};

export type MarketReport = {
  /** reporting period, e.g. "July 2026" */
  period: string;
  isSampleData: boolean;
  valley: {
    medianPrice: number;
    priceYoY: number;
    medianDom: number;
    activeListings: number;
    closedSales: number;
    monthsOfSupply: number;
  };
  areas: AreaStat[];
  takeaways: string[];
};

export const marketReport: MarketReport = {
  period: "July 2026",
  isSampleData: true,
  valley: {
    medianPrice: 485000,
    priceYoY: 3.4,
    medianDom: 38,
    activeListings: 6100,
    closedSales: 2450,
    monthsOfSupply: 2.6,
  },
  areas: [
    { area: "Las Vegas", medianPrice: 460000, priceYoY: 3.1, medianDom: 37, activeListings: 3200 },
    { area: "Henderson", medianPrice: 545000, priceYoY: 3.8, medianDom: 35, activeListings: 1450 },
    { area: "Summerlin", medianPrice: 720000, priceYoY: 4.2, medianDom: 33, activeListings: 640 },
    { area: "North Las Vegas", medianPrice: 425000, priceYoY: 2.6, medianDom: 41, activeListings: 720 },
    { area: "Boulder City", medianPrice: 560000, priceYoY: 1.9, medianDom: 52, activeListings: 90 },
  ],
  takeaways: [
    "Prices continue a steady, moderate climb year-over-year — a healthy market rather than a runaway one.",
    "Homes are still moving in well under two months on average, so well-priced, well-presented listings sell.",
    "Inventory remains below the ~5–6 months that signals a balanced market, keeping conditions favorable for sellers in most price bands.",
    "Luxury and guard-gated segments move on their own timeline — pricing and marketing strategy matter more there than valley-wide averages.",
  ],
};
