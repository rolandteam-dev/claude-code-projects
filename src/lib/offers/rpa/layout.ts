/**
 * Where each blank sits on GLVAR's Residential Purchase Agreement (Rev. 10/25, 11 pages, 612x792pt).
 *
 * The form is a flat PDF (no fillable fields), so the offer terms are typed on top of it.
 * Coordinates are in points measured from the TOP-left of the page (like the PDF viewer),
 * and `x` is where text starts. `top` is the top of the blank's line, as pdfplumber reports it.
 *
 * If GLVAR publishes a new revision these must be re-mapped: run scripts/offers/rpa-sample.mjs
 * and check every page image before trusting the output.
 */
export const RPA_REVISION = "Rev. 10/25";
export const RPA_PAGES = 11;

export interface TextBlank {
  page: number; // 1-based
  x: number;
  top: number;
  /** Usable width in points; text is shrunk to fit. */
  width: number;
  size?: number;
  /** Raise the text this many points (for blanks whose underline sits lower than usual). */
  lift?: number;
}

export interface Box {
  page: number;
  /** Left edge and top of the checkbox glyph. */
  x: number;
  top: number;
}

/** Page-1 blanks. */
export const P1 = {
  date: { page: 1, x: 440, top: 81.6, width: 100 },
  buyer: { page: 1, x: 58, top: 98.7, width: 338 },
  property: { page: 1, x: 58, top: 116, width: 428 },
  city: { page: 1, x: 222, top: 133.3, width: 180 },
  county: { page: 1, x: 454, top: 133.3, width: 86 },
  zip: { page: 1, x: 143, top: 150.6, width: 74 },
  apn: { page: 1, x: 260, top: 150.6, width: 178 },
  price: { page: 1, x: 64, top: 167.7, width: 115 },
  priceWords: { page: 1, x: 190, top: 167.7, width: 274, size: 8 },
  emd: { page: 1, x: 62, top: 274.7, width: 50 },
  loanAmount: { page: 1, x: 62, top: 393.3, width: 50 },
  balance: { page: 1, x: 62, top: 562.3, width: 50 },
  total: { page: 1, x: 62, top: 596.9, width: 48 },
} satisfies Record<string, TextBlank>;

export const BOX = {
  occupyDoes: { page: 1, x: 276.1, top: 183.6 },
  occupyDoesNot: { page: 1, x: 330.4, top: 183.6 },
  loanConventional: { page: 1, x: 131.0, top: 409.2 },
  loanFha: { page: 1, x: 198.5, top: 409.2 },
  loanVa: { page: 1, x: 231.9, top: 409.2 },
  loanOther: { page: 1, x: 259.9, top: 409.2 },
  dueDiligenceIs: { page: 3, x: 299.9, top: 328.2 },
  dueDiligenceIsNot: { page: 3, x: 344.7, top: 328.2 },
  closingCostDollars: { page: 5, x: 108.5, top: 233.6 },
  warrantyWaives: { page: 5, x: 366, top: 286.6 },
  warrantyRequires: { page: 5, x: 436, top: 286.6 },
  warrantySeller: { page: 5, x: 405, top: 298.1 },
  warrantyBuyer: { page: 5, x: 473, top: 298.1 },
} satisfies Record<string, Box>;

export const P2 = {
  appraisalDays: { page: 2, x: 392, top: 246.8, width: 32 },
  loanDays: { page: 2, x: 162.5, top: 357.2, width: 32 },
  /** The three "additional items of personal property" lines. */
  inclusionLines: [
    { page: 2, x: 92, top: 650.1, width: 462, size: 9 },
    { page: 2, x: 92, top: 667.4, width: 462, size: 9 },
    { page: 2, x: 92, top: 684.6, width: 462, size: 9 },
  ] satisfies TextBlank[],
};

export const P3 = {
  coeDate: { page: 3, x: 408, top: 184.7, width: 110 },
  dueDiligenceDays: { page: 3, x: 476, top: 353.4, width: 22 },
};

export const P5 = {
  closingCostDollars: { page: 5, x: 124, top: 235.3, width: 50 },
  warrantyPrice: { page: 5, x: 300, top: 311.1, width: 70 },
};

/** Footer blanks repeated on every page: "Buyer's Name(s)" and "Property Address". */
export const FOOTER = {
  buyerX: 116,
  buyerTops: { 1: 702.0, rest: 735.0 },
  addressX: 117,
  addressTops: { 1: 720.4, rest: 753.4 },
  width: 266,
};
