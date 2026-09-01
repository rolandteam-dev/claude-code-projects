/**
 * Client Portal content model.
 *
 * The portal mirrors what a buyer or seller actually has to do, stage by
 * stage, and pairs each step with the guide on this site that explains it.
 * Everything here is content-only — no state, no client data — so stages and
 * tasks can be edited without touching the app code.
 *
 * Adding a stage: append to `buyerJourney` / `sellerJourney`. Task ids are the
 * storage keys for a client's checked-off progress, so **never renumber or
 * reuse an id** — an id change silently un-checks that task for every client.
 */

export type PortalTask = {
  /** Stable storage key. Never change once shipped. */
  id: string;
  label: string;
  detail: string;
  /** Optional link to the page/tool on this site that does the work. */
  href?: string;
  hrefLabel?: string;
};

export type PortalStage = {
  id: string;
  label: string;
  /** One-line answer to "where am I and what happens now?" */
  blurb: string;
  /** Typical elapsed time for this stage — sets expectations, not a promise. */
  timing: string;
  tasks: PortalTask[];
};

export type JourneyKind = "buy" | "sell";

export const buyerJourney: PortalStage[] = [
  {
    id: "prepare",
    label: "Get ready",
    blurb: "Set your budget and get pre-approved so you can move the moment the right home appears.",
    timing: "Week 1",
    tasks: [
      {
        id: "buy.prepare.budget",
        label: "Set your target budget",
        detail:
          "Work out the monthly payment you're genuinely comfortable with — not just the maximum a lender will approve.",
        href: "/portal/budget",
        hrefLabel: "Open the budget planner",
      },
      {
        id: "buy.prepare.preapproval",
        label: "Get pre-approved with a lender",
        detail:
          "A verified pre-approval letter tells you your real price range and makes your offer credible to sellers.",
        href: "/mortgage-pre-approval",
        hrefLabel: "Request pre-approval",
      },
      {
        id: "buy.prepare.dpa",
        label: "Check if you qualify for down payment assistance",
        detail:
          "Nevada has programs that can cover part of the down payment or closing costs. Worth ten minutes to rule in or out.",
        href: "/down-payment-assistance",
        hrefLabel: "See the programs",
      },
      {
        id: "buy.prepare.wishlist",
        label: "Separate your must-haves from your nice-to-haves",
        detail:
          "Bring this list to your agent. It's the single fastest way to stop touring homes that were never going to work.",
      },
    ],
  },
  {
    id: "search",
    label: "Search",
    blurb: "Learn the areas, save the homes you like, and let your agent see what's resonating.",
    timing: "Weeks 2–8",
    tasks: [
      {
        id: "buy.search.areas",
        label: "Narrow down your areas",
        detail:
          "Commute, schools, HOA, lot size and price all move together. Two or three target areas beats a valley-wide search.",
        href: "/communities",
        hrefLabel: "Browse communities",
      },
      {
        id: "buy.search.saved",
        label: "Save at least five homes you'd consider",
        detail:
          "Saving homes here tells your agent what you actually respond to — often more accurately than a wish list does.",
        href: "/listings",
        hrefLabel: "Search homes",
      },
      {
        id: "buy.search.tour",
        label: "Tour your shortlist in person",
        detail:
          "Photos hide street noise, elevation, afternoon sun and neighbors. Plan on seeing 6–10 homes before you know your range.",
      },
      {
        id: "buy.search.hoa",
        label: "Understand the HOA where you're shopping",
        detail:
          "Fees, transfer costs and rules vary widely across Las Vegas communities. Know them before you write an offer.",
        href: "/guides/understanding-hoas-las-vegas",
        hrefLabel: "Read the HOA guide",
      },
    ],
  },
  {
    id: "offer",
    label: "Make an offer",
    blurb: "Price, terms and timing get built into a written offer and negotiated.",
    timing: "1–5 days",
    tasks: [
      {
        id: "buy.offer.comps",
        label: "Review comparable sales with your agent",
        detail:
          "What similar homes actually closed for — not list prices — is what supports your number and the appraisal later.",
      },
      {
        id: "buy.offer.terms",
        label: "Decide your terms, not just your price",
        detail:
          "Close date, contingencies, seller concessions and earnest money often matter as much to a seller as the price.",
      },
      {
        id: "buy.offer.submit",
        label: "Submit the offer",
        detail: "Your agent presents it with your pre-approval letter and follows up with the listing agent directly.",
      },
    ],
  },
  {
    id: "contract",
    label: "Under contract",
    blurb: "The due-diligence window. Inspections, appraisal and loan underwriting all run at once.",
    timing: "30–45 days",
    tasks: [
      {
        id: "buy.contract.earnest",
        label: "Deliver earnest money to escrow",
        detail: "Usually due within a few days of acceptance. Escrow will confirm receipt in writing — keep that confirmation.",
      },
      {
        id: "buy.contract.inspection",
        label: "Complete your home inspection",
        detail:
          "Schedule early in the window so there's time to negotiate repairs. Add pool, roof or sewer specialists when it applies.",
      },
      {
        id: "buy.contract.appraisal",
        label: "Appraisal ordered by your lender",
        detail: "The lender verifies the home supports the loan amount. Your agent handles it if the value comes in low.",
      },
      {
        id: "buy.contract.insurance",
        label: "Lock in homeowners insurance",
        detail: "Your lender needs the policy before closing. Shop it — premiums vary more than most buyers expect.",
      },
      {
        id: "buy.contract.docs",
        label: "Send the lender everything they ask for, fast",
        detail:
          "Underwriting delays are the most common reason closings slip. Same-day responses keep your close date intact.",
      },
    ],
  },
  {
    id: "closing",
    label: "Closing",
    blurb: "Final numbers, final walkthrough, signing, and keys.",
    timing: "Final week",
    tasks: [
      {
        id: "buy.closing.walkthrough",
        label: "Do the final walkthrough",
        detail: "Confirm agreed repairs are done and the home is in the condition you agreed to buy it in.",
      },
      {
        id: "buy.closing.funds",
        label: "Wire your closing funds",
        detail:
          "Call escrow using a number you already have to verify wire instructions before sending. Wire fraud is the real risk at this stage.",
      },
      {
        id: "buy.closing.sign",
        label: "Sign and record",
        detail: "Once the deed records with Clark County, the home is yours and keys are released.",
      },
    ],
  },
  {
    id: "settled",
    label: "After closing",
    blurb: "The part most agents skip — and where most of the money gets saved or lost.",
    timing: "First year",
    tasks: [
      {
        id: "buy.settled.utilities",
        label: "Transfer utilities and update your address",
        detail: "NV Energy, water, trash, internet, DMV and voter registration.",
      },
      {
        id: "buy.settled.homestead",
        label: "File your Nevada homestead declaration",
        detail:
          "A low-cost filing with the Clark County Recorder that protects equity in your primary residence. Ask us for the current form and fee.",
      },
      {
        id: "buy.settled.tax",
        label: "Confirm your property tax cap status",
        detail:
          "Nevada caps annual property tax increases on an owner-occupied primary residence. Verify the cap is applied to your parcel.",
      },
      {
        id: "buy.settled.value",
        label: "Track your home's value once a year",
        detail: "We'll send a yearly valuation so you always know your equity position.",
        href: "/home-value",
        hrefLabel: "Check your value",
      },
    ],
  },
];

export const sellerJourney: PortalStage[] = [
  {
    id: "value",
    label: "Know your number",
    blurb: "Understand what your home is worth today and what you'd net from a sale.",
    timing: "Week 1",
    tasks: [
      {
        id: "sell.value.estimate",
        label: "Get a current valuation",
        detail: "An automated estimate gets you close; a walkthrough gets you accurate.",
        href: "/home-value",
        hrefLabel: "Get your home value",
      },
      {
        id: "sell.value.net",
        label: "Review your estimated net proceeds",
        detail: "Sale price minus payoff, commissions, title, taxes and concessions — this is the number that matters.",
        href: "/blog/las-vegas-luxury-seller-net-proceeds",
        hrefLabel: "See how net is calculated",
      },
      {
        id: "sell.value.timing",
        label: "Decide your timing",
        detail: "If you're buying next, sequencing the two closings is the whole ballgame. Plan it before you list.",
      },
    ],
  },
  {
    id: "prep",
    label: "Prepare the home",
    blurb: "Small, targeted work before photos returns more than any price reduction later.",
    timing: "2–3 weeks",
    tasks: [
      {
        id: "sell.prep.repairs",
        label: "Handle the obvious repairs",
        detail: "Anything a buyer will notice in the first ten seconds — or an inspector will find anyway.",
      },
      {
        id: "sell.prep.declutter",
        label: "Declutter and depersonalize",
        detail: "Buyers need to picture their life in the home. Less furniture photographs as more space.",
      },
      {
        id: "sell.prep.photos",
        label: "Professional photography and media",
        detail: "We arrange photos, video and floor plans. This is the listing — it's not a place to economize.",
      },
    ],
  },
  {
    id: "market",
    label: "On the market",
    blurb: "Launch, showings, and reading the feedback the market gives you.",
    timing: "Weeks 1–6",
    tasks: [
      {
        id: "sell.market.live",
        label: "Go live on the MLS and syndicate",
        detail: "Your listing pushes to the MLS, the major portals and our own marketing channels.",
      },
      {
        id: "sell.market.showings",
        label: "Make showings easy",
        detail: "The homes that sell are the ones buyers can actually get into on short notice.",
      },
      {
        id: "sell.market.feedback",
        label: "Review traffic and feedback weekly",
        detail:
          "Lots of views and no showings is a price problem. Showings and no offers is usually a condition problem.",
      },
    ],
  },
  {
    id: "escrow",
    label: "Under contract",
    blurb: "Offer accepted — now inspections, appraisal and the buyer's loan have to clear.",
    timing: "30–45 days",
    tasks: [
      {
        id: "sell.escrow.review",
        label: "Review offers on terms, not just price",
        detail: "The highest offer and the one most likely to close are often not the same offer.",
      },
      {
        id: "sell.escrow.repairs",
        label: "Negotiate the inspection response",
        detail: "You can repair, credit, or hold firm. We'll model what each choice costs you.",
      },
      {
        id: "sell.escrow.appraisal",
        label: "Support the appraisal",
        detail: "We provide the appraiser with comps and a list of improvements so the value is defensible.",
      },
    ],
  },
  {
    id: "close",
    label: "Closing",
    blurb: "Sign, hand over the keys, and get your proceeds.",
    timing: "Final week",
    tasks: [
      {
        id: "sell.close.sign",
        label: "Sign your closing documents",
        detail: "Usually a short signing at title, and it can often be done remotely.",
      },
      {
        id: "sell.close.move",
        label: "Be fully moved out before the walkthrough",
        detail: "The buyer's final walkthrough is the last chance for a dispute. An empty, clean home avoids it.",
      },
      {
        id: "sell.close.proceeds",
        label: "Confirm how your proceeds are delivered",
        detail: "Wire or check, and to which account. Verify instructions by phone before closing day.",
      },
    ],
  },
];

export function journeyStages(kind: JourneyKind): PortalStage[] {
  return kind === "sell" ? sellerJourney : buyerJourney;
}

export function allTaskIds(kind: JourneyKind): string[] {
  return journeyStages(kind).flatMap((s) => s.tasks.map((t) => t.id));
}

/**
 * Vendor directory. Deliberately role-based rather than name-based: we
 * introduce clients to a vetted pro per category rather than publishing a
 * third party's contact details on a public site. Replace `note` copy as the
 * preferred-partner list changes.
 */
export type VendorCategory = {
  id: string;
  name: string;
  when: string;
  what: string;
  /** Which journey this pro belongs to. "both" shows on either. */
  journey: JourneyKind | "both";
};

export const vendorCategories: VendorCategory[] = [
  {
    id: "lender",
    name: "Mortgage lender",
    when: "Before you shop",
    what: "Pre-approval, loan programs, rate options, and the closing-cost estimate you'll budget against.",
    journey: "buy",
  },
  {
    id: "title",
    name: "Title & escrow",
    when: "Once you're under contract",
    what: "Holds earnest money, clears title, prepares closing documents, and records the deed with Clark County.",
    journey: "both",
  },
  {
    id: "inspector",
    name: "Home inspector",
    when: "First week under contract",
    what: "A top-to-bottom condition report. Add pool, roof, sewer scope or HVAC specialists where it applies.",
    journey: "buy",
  },
  {
    id: "insurance",
    name: "Homeowners insurance",
    when: "Before closing",
    what: "Your lender requires a bound policy. Premiums vary widely — shopping it is usually worth real money.",
    journey: "buy",
  },
  {
    id: "warranty",
    name: "Home warranty",
    when: "At closing",
    what: "Covers major systems and appliances in the first year. Often negotiable as a seller-paid item.",
    journey: "buy",
  },
  {
    id: "contractor",
    name: "General contractor & handyman",
    when: "Pre-listing or post-closing",
    what: "Repairs, paint, flooring and the punch-list work that moves a home's value more than it costs.",
    journey: "both",
  },
  {
    id: "photographer",
    name: "Photography & media",
    when: "Before you list",
    what: "Photos, video, aerial and floor plans. Arranged and paid for by us on our listings.",
    journey: "sell",
  },
  {
    id: "stager",
    name: "Staging & organizing",
    when: "Before photos",
    what: "Furniture, styling and decluttering so the home photographs and shows the way buyers expect.",
    journey: "sell",
  },
  {
    id: "mover",
    name: "Moving & storage",
    when: "Two weeks out",
    what: "Local and long-distance movers, plus short-term storage when your closings don't line up.",
    journey: "both",
  },
  {
    id: "cleaner",
    name: "Cleaning",
    when: "Move-in or move-out",
    what: "Deep clean between owners. Cheap insurance against a walkthrough dispute.",
    journey: "both",
  },
];
