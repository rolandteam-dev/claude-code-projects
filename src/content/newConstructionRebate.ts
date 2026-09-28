/**
 * The new-construction buyer rebate offered from rebate.therolandteam.com,
 * the page linked from the new-construction YouTube video.
 *
 * The offer, in one sentence: 1% of the base purchase price back at closing,
 * capped at 50% of the buyer's-agent commission the builder actually pays
 * LPT Realty. Every number, definition and condition the page, the terms
 * page, the email and the FUB note use lives here, so a change to the offer
 * is a change to one file.
 *
 * Copy rules: calm, confident, direct. No dashes, no emojis, no hype. Fair
 * Housing on every line. Nothing here is legal advice; the terms below are
 * the program as The Roland Team defines it, for LPT Realty compliance to
 * review before the video goes live.
 */

import { channelSources, DEFAULT_CHANNEL_SOURCE } from "@/content/relocationGuides";

export const rebateOffer = {
  /** Share of the base purchase price credited at closing. */
  pricePercent: 1,
  /** Cap, as a share of the buyer's-agent commission LPT Realty actually receives. */
  commissionCapPercent: 50,
  /** Where the buyer must be before a builder will pay a commission on them. */
  area: "Las Vegas, Henderson, North Las Vegas and Boulder City, Nevada",
  /** Tag every lead from this page gets in Follow Up Boss. */
  fubTag: "New Construction Rebate",
  /** Program name as it appears in the buyer agreement and on the terms page. */
  programName: "The Roland Team New Construction Rebate",
  /** Terms version, printed on the terms page so a signed agreement can cite it. */
  termsVersion: "September 2026",
};

/** Contact details shown on the rebate pages. YouTube-only page, so the YouTube number. */
export const rebateContact = {
  phoneDisplay: "(702) 830-7568",
  phoneHref: "tel:+17028307568",
  email: "mike@therolandteam.com",
  bookingUrl: "https://scheduler.zoom.us/mike-roland-l0cm4c/mike-roland-real-estate-consultation",
  privacyUrl: "https://therolandteam.com/privacy-policy",
  legalName: "The Roland Team | LPT Realty",
  address: "5860 S Pecos Rd, Unit 300, Las Vegas, NV 89120",
  /** Where the rebate page lives. Canonical URL and the origin used in the email. */
  origin: "https://rebate.therolandteam.com",
  /**
   * License line for the footer, email and terms page. NRS 645.315 requires
   * the licensee's own license number and the brokerage's name on any ad.
   * S.0177048 is from the Las Vegas REALTORS directory (Sept 2026); confirm
   * it at red.prod.secure.nv.gov/Lookup/LicenseLookup.aspx if it changes.
   */
  agentLicense: "Mike Roland, NV Lic. S.0177048",
  brokerLicense: "Brokerage: LPT Realty, LLC",
};

/** The consent line under the form. Matches the wording used on therolandteam.com forms. */
export const rebateConsentText =
  "I agree to be contacted by The Roland Team - LPT Realty via call, email, and text for real estate services. To opt out, you can reply 'stop' at any time or reply 'help' for assistance. You can also click the unsubscribe link in the emails. Message and data rates may apply. Message frequency may vary.";

/** Form dropdowns. Values are what lands in the FUB note, so keep them readable. */
export const timelineOptions = [
  "Within 30 days",
  "1 to 3 months",
  "3 to 6 months",
  "6 to 12 months",
  "Just researching",
];

export const priceRangeOptions = [
  "Under $500,000",
  "$500,000 to $700,000",
  "$700,000 to $1,000,000",
  "$1,000,000 to $1,500,000",
  "Over $1,500,000",
];

/** Worked examples on the page. Base price in, credit out, at the 1% rate. */
export const rebateExamples = [500_000, 750_000, 1_000_000].map((basePrice) => ({
  basePrice,
  credit: Math.round((basePrice * rebateOffer.pricePercent) / 100),
}));

export function formatUsd(n: number): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export const howItWorks = [
  {
    n: "01",
    title: "Tell us where you are looking",
    body: "Fill in the form and book a short call. We go over the builders and communities on your list and sign the buyer agreement electronically.",
  },
  {
    n: "02",
    title: "We register you before your first visit",
    body: "Builders pay a buyer's agent commission, but most only pay it if your agent is on record before you walk into the sales office. That one step is what funds the rebate.",
  },
  {
    n: "03",
    title: "You close, the credit lands",
    body: "At closing, 1% of the base price shows up as a credit on your Closing Disclosure, up to half of the commission the builder pays us.",
  },
];

/** What the fee we keep pays for. Short, specific, no adjectives. */
export const whatWeDo = [
  { title: "Builder contract review", body: "Builder contracts are written by the builder. We walk you through every deadline, deposit and the parts that are negotiable." },
  { title: "Incentive negotiation", body: "Rate buydowns, closing cost credits, design center dollars and lot premiums move more than most buyers think. We ask." },
  { title: "Independent inspections", body: "A third-party inspector at foundation, pre-drywall and final, because the builder's own inspection is not yours." },
  { title: "Lender comparison", body: "The builder's preferred lender may or may not be your best option. We help you compare both before you commit." },
  { title: "Construction tracking", body: "Regular check-ins on the build so a slipped date or a changed selection does not surprise you at the walkthrough." },
  { title: "Walkthrough and closing", body: "We are with you at the walkthrough and through the close, and after, when the punch list needs a nudge." },
];

export const rebateFaqs = [
  {
    q: "Is a buyer rebate legal in Nevada?",
    a: "Yes. Nevada allows a real estate broker to share part of its commission with its own client in a transaction. The rebate is paid by LPT Realty, the brokerage, and is disclosed on your Closing Disclosure. It is not a builder program and does not change any incentive the builder offers you.",
  },
  {
    q: "What is the base purchase price?",
    a: "The price on the builder's purchase agreement for the home and homesite before lot premium, structural options, design center selections, and before any builder incentives or credits are applied. If the builder's contract lists one combined price, that figure is the base price.",
  },
  {
    q: "Why is the rebate capped at half of the commission?",
    a: "Builders set their own commissions and they vary by builder, community and month. Most pay 2% to 3% of the base price, some pay a flat amount, and some pay less during a promotion. The cap means the rebate is always funded by what the builder actually pays, so it is never a bait and switch and never comes out of your price.",
  },
  {
    q: "How do I receive the rebate?",
    a: "As a credit on your Closing Disclosure at closing, applied to your closing costs and prepaid items. Your lender has to approve the credit and every loan program limits how much can be credited, so on a financed purchase the rebate cannot be paid in cash outside of closing. If you are paying cash, LPT Realty pays the rebate by check after closing.",
  },
  {
    q: "Does the builder lower the price if I do not use an agent?",
    a: "In our experience, no. Builders set aside the buyer's agent commission as part of their marketing budget and hold their pricing so it does not undercut the values in the rest of the community. When a buyer shows up unrepresented the builder simply keeps that money.",
  },
  {
    q: "I already visited a builder. Can I still get the rebate?",
    a: "Sometimes. Every builder has its own registration policy, and many will not pay a commission if you toured or registered on your own first. Call us before you go back and we will find out where you stand with that builder.",
  },
  {
    q: "Is the rebate taxable?",
    a: "The IRS has treated buyer rebates as a reduction in the purchase price rather than income, so no 1099 is issued. We are not tax advisors, so please confirm with yours.",
  },
  {
    q: "Which builders does this work with?",
    a: "Any builder in Southern Nevada that pays a buyer's agent commission, which is nearly all of them. The rebate is 1% of the base price whenever the builder pays 2% or more, and half of what we receive when it pays less.",
  },
];

/** Verified credibility stats (same figures the guide page and the marketing site use). */
export const rebateStats = [
  { value: "Top 1%", label: "Las Vegas real estate team" },
  { value: "1,000+", label: "homes sold" },
  { value: "800+", label: "five-star reviews" },
  { value: "No. 1", label: "in Henderson, RealTrends 2026" },
];

/**
 * The program terms. Rendered on /terms, linked from the video, the page and
 * the email, and referenced by the buyer agreement addendum. Each entry is one
 * heading and its paragraphs.
 */
export const rebateTerms: { heading: string; paragraphs: string[] }[] = [
  {
    heading: "1. The offer",
    paragraphs: [
      `${rebateOffer.programName} (the "Program") is offered by The Roland Team with LPT Realty ("we," "us," or the "Brokerage"). Under the Program, a buyer who purchases a newly constructed home through the Brokerage receives a credit at closing equal to ${rebateOffer.pricePercent}% of the base purchase price of the home, capped at ${rebateOffer.commissionCapPercent}% of the buyer's agent commission actually received by LPT Realty for that transaction (the "Rebate").`,
      "The Rebate is paid by LPT Realty from its own commission. It is not a builder program, is not paid by the builder, and does not replace or reduce any incentive, credit or concession the builder offers.",
    ],
  },
  {
    heading: "2. Base purchase price",
    paragraphs: [
      `"Base purchase price" means the price stated on the builder's purchase agreement for the home and homesite before any lot premium, structural options, design center or upgrade selections, and before any builder incentives, credits or concessions are applied. Where the builder's purchase agreement states a single combined price without separating these items, that stated price is the base purchase price.`,
    ],
  },
  {
    heading: "3. Who qualifies",
    paragraphs: [
      "To qualify, the buyer must (a) sign the Nevada Duties Owed by a Real Estate Licensee form and an Exclusive Buyer Brokerage Agreement with The Roland Team at LPT Realty that references the Program, before the buyer's first visit to the builder's sales office or model homes for the community purchased; (b) have The Roland Team registered with the builder as the buyer's agent in accordance with that builder's registration policy; and (c) close on the purchase of a newly constructed home located in " +
        rebateOffer.area +
        " with The Roland Team acting as the buyer's agent through closing.",
      "Builders set their own registration rules. If a builder declines to recognize The Roland Team as the buyer's agent because the buyer visited, registered or contracted before we were on record, no commission is paid to LPT Realty and no Rebate is owed. We will tell you before you sign a builder contract whether the builder has confirmed our registration.",
    ],
  },
  {
    heading: "4. How the Rebate is calculated",
    paragraphs: [
      `The Rebate equals the lesser of (a) ${rebateOffer.pricePercent}% of the base purchase price, or (b) ${rebateOffer.commissionCapPercent}% of the buyer's agent commission actually received by LPT Realty from the builder for the transaction, after any reduction, offset or flat-fee arrangement the builder applies. If the builder pays no buyer's agent commission, the Rebate is zero.`,
      `Example: on a home with a base purchase price of ${formatUsd(700_000)} where the builder pays a 2.5% commission (${formatUsd(17_500)}), the Rebate is ${formatUsd(7_000)}. On the same home where the builder pays a flat ${formatUsd(10_000)}, the Rebate is ${formatUsd(5_000)}.`,
    ],
  },
  {
    heading: "5. How the Rebate is paid",
    paragraphs: [
      "On a financed purchase, the Rebate is paid as a credit on the buyer's Closing Disclosure at closing, applied to the buyer's closing costs and prepaid items. The credit is subject to the buyer's lender's approval and to the limits of the buyer's loan program. Where the lender limits the credit, the Rebate is reduced to the amount the lender allows. The Rebate cannot be paid in cash or outside of closing on a financed purchase.",
      "On an all-cash purchase, the Rebate is paid by check from LPT Realty within ten business days after closing and the Brokerage's receipt of the builder's commission.",
      "Nevada law requires that any share of a commission paid to a party be paid by the brokerage, so the Rebate is paid only by LPT Realty and never by an individual agent.",
    ],
  },
  {
    heading: "6. Other conditions",
    paragraphs: [
      "The Rebate applies to one transaction per buyer agreement and is paid only when the transaction closes and LPT Realty has received its commission. It may not be combined with any other Roland Team rebate, credit or fee program unless we agree to it in writing. It has no cash value before closing and cannot be transferred.",
      "The Program is a marketing offer of The Roland Team at LPT Realty. We may change or end the Program at any time. The terms in effect on the date the buyer signs the Buyer Brokerage Agreement are the terms that apply to that buyer, and they are restated in an addendum to that agreement so nothing depends on this page.",
      "Nothing on this page is legal, tax or lending advice. Please consult your own advisors. The Rebate is generally treated as a reduction in the purchase price rather than income, but your tax situation is your own.",
    ],
  },
  {
    heading: "7. Who we are",
    paragraphs: [
      `${rebateContact.legalName}, ${rebateContact.address}. ${rebateContact.agentLicense}. ${rebateContact.brokerLicense}. Equal Housing Opportunity.`,
      `Questions about the Program: call or text ${rebateContact.phoneDisplay}, or email ${rebateContact.email}.`,
    ],
  },
];

/** Same channel map as the guide page, so ?s= means the same thing on both. */
export function rebateSourceForChannel(channel?: string | null): string {
  const key = (channel ?? "").trim().toLowerCase();
  if (!key) return DEFAULT_CHANNEL_SOURCE;
  return channelSources[key] ?? "New Construction Rebate Page";
}
