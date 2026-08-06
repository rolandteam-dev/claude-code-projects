/**
 * Buyer / seller / relocation guides — long-form, keyword-rich content
 * that captures top-of-funnel organic search and AI citations.
 * Rendered at /guides/<slug>.
 */

import type { Faq, Section } from "./communities";

export type Guide = {
  slug: string;
  title: string;
  category: "Buying" | "Selling" | "Relocation" | "Market";
  seoTitle: string;
  seoDescription: string;
  h1: string;
  eyebrow: string;
  intro: string;
  readMinutes: number;
  sections: Section[];
  faqs: Faq[];
  featured?: boolean;
};

export const guides: Guide[] = [
  {
    slug: "buying-a-home-in-las-vegas",
    title: "Buying a Home in Las Vegas: The Complete 2026 Guide",
    category: "Buying",
    featured: true,
    seoTitle: "Buying a Home in Las Vegas: Complete 2026 Buyer Guide",
    seoDescription:
      "A step-by-step guide to buying a home in Las Vegas & Henderson — from getting pre-approved and choosing a neighborhood to making an offer and closing.",
    h1: "Buying a Home in Las Vegas: The Complete Guide",
    eyebrow: "Buyer Guide",
    intro:
      "Everything you need to buy a home in the Las Vegas Valley with confidence — the process, the neighborhoods, the numbers, and the local details that matter.",
    readMinutes: 9,
    sections: [
      {
        heading: "1. Get Pre-Approved Before You Shop",
        body: [
          "Before touring a single home, talk to a lender and get pre-approved. In a competitive market like Las Vegas, a pre-approval letter tells sellers you're serious and defines your realistic budget. It also surfaces any credit or documentation issues early, when there's still time to fix them.",
          "Ask your lender to break down your estimated monthly payment including property taxes, insurance, and any HOA dues — Las Vegas has many master-planned and gated communities where HOA fees are a real part of the budget.",
        ],
      },
      {
        heading: "2. Choose the Right Area",
        body: [
          "The valley is a patchwork of distinct communities, each with its own character and price point. Summerlin and Henderson anchor the luxury and family markets, while areas closer to the Strip and Downtown appeal to buyers who want walkability and nightlife.",
        ],
        bullets: [
          "Henderson — family-friendly master plans, top schools, and guard-gated luxury like Ascaya and MacDonald Highlands.",
          "Summerlin — a large master-planned community on the west side with parks, trails, and The Ridges at its luxury tier.",
          "Southwest & Mountain's Edge — newer construction and strong value for move-up buyers.",
          "Lake Las Vegas — resort-style living around the water in eastern Henderson.",
        ],
      },
      {
        heading: "3. Make a Competitive Offer",
        body: [
          "Once you find the right home, your agent will help you structure an offer that's strong but protects your interests. That means the right price based on recent comparable sales, sensible contingencies for inspection and appraisal, and terms that appeal to the seller's timeline.",
        ],
      },
      {
        heading: "4. Inspect, Appraise, and Close",
        body: [
          "After your offer is accepted, you'll move into the due-diligence period: a home inspection, the lender's appraisal, and a title review. Nevada typically uses an escrow and title company to manage the closing. Most transactions close in about 30 days when financing is involved.",
        ],
      },
    ],
    faqs: [
      {
        q: "How much do I need for a down payment in Las Vegas?",
        a: "It depends on your loan program. Conventional loans often start around 3–5% down, FHA around 3.5%, and VA loans can be zero down for eligible buyers. Luxury and jumbo purchases typically require more. A local lender can outline your options.",
      },
      {
        q: "How long does it take to buy a home in Las Vegas?",
        a: "From accepted offer to closing, most financed purchases take about 30 days. Cash purchases can close faster. The search itself varies widely depending on inventory and how specific your criteria are.",
      },
      {
        q: "Are property taxes high in Nevada?",
        a: "Nevada has no state income tax and relatively moderate property taxes compared to many states, which is a major draw for buyers relocating from higher-tax states.",
      },
    ],
  },

  {
    slug: "selling-your-home-in-las-vegas",
    title: "Selling Your Home in Las Vegas: A Step-by-Step Guide",
    category: "Selling",
    featured: true,
    seoTitle: "Selling Your Home in Las Vegas: Step-by-Step Seller Guide",
    seoDescription:
      "How to sell your Las Vegas or Henderson home for top dollar — pricing, prep, marketing, negotiation, and closing, explained step by step by Roland Luxury.",
    h1: "Selling Your Home in Las Vegas",
    eyebrow: "Seller Guide",
    intro:
      "A clear, step-by-step roadmap to selling your Las Vegas Valley home for the best price and terms — with the local details that actually move the needle.",
    readMinutes: 8,
    sections: [
      {
        heading: "1. Price It Right From Day One",
        body: [
          "The most important decision you'll make is your list price. Overpricing leads to stale listings and price cuts; pricing to the market attracts more buyers and often multiple offers. Your agent should build a pricing strategy from recent comparable sales in your specific neighborhood — not valley-wide averages, which can be misleading in a market as varied as Las Vegas.",
        ],
      },
      {
        heading: "2. Prepare and Stage",
        body: [
          "First impressions drive offers. Declutter, handle deferred maintenance, and consider light staging to help buyers picture themselves in the home. Professional photography — and increasingly video and drone for larger or view properties — is essential in a market where most buyers start online.",
        ],
      },
      {
        heading: "3. Market to the Right Buyers",
        body: [
          "A strong plan combines MLS syndication, targeted digital advertising, and your agent's local network. For luxury and guard-gated homes, reaching the right buyer pool matters as much as broad exposure — a specialist who knows the community's buyers has a real edge.",
        ],
      },
      {
        heading: "4. Negotiate and Close",
        body: [
          "Once offers arrive, your agent helps you weigh price against terms — financing type, contingencies, close date, and buyer strength. In Nevada, escrow and title companies manage the closing, which typically takes about 30 days for financed buyers.",
        ],
      },
    ],
    faqs: [
      {
        q: "How long does it take to sell a home in Las Vegas?",
        a: "It depends on pricing, condition, and market conditions, but well-priced, well-presented homes often go under contract within a few weeks, followed by roughly a 30-day close for financed buyers.",
      },
      {
        q: "What does it cost to sell a home in Nevada?",
        a: "Typical seller costs include the real estate commission, title and escrow fees, and any negotiated concessions or repairs. Your agent can provide an estimated net-proceeds sheet before you list.",
      },
      {
        q: "Should I make repairs before selling?",
        a: "Addressing obvious maintenance and cosmetic issues usually pays off by attracting more buyers and stronger offers. Your agent can advise which improvements are worth it in your price range.",
      },
    ],
  },

  {
    slug: "relocating-to-las-vegas",
    title: "Relocating to Las Vegas: A Newcomer's Guide",
    category: "Relocation",
    featured: false,
    seoTitle: "Relocating to Las Vegas: Complete Newcomer's Moving Guide",
    seoDescription:
      "Moving to Las Vegas? Learn about the best areas, cost of living, no state income tax, schools, weather, and what to know before relocating to Southern Nevada.",
    h1: "Relocating to Las Vegas",
    eyebrow: "Relocation Guide",
    intro:
      "Everything a newcomer should know before moving to the Las Vegas Valley — the areas, the numbers, and the lifestyle beyond the Strip.",
    readMinutes: 8,
    sections: [
      {
        heading: "Why People Move to Las Vegas",
        body: [
          "Beyond the entertainment the city is famous for, the Las Vegas Valley draws newcomers with Nevada's lack of a state income tax, a relatively favorable cost of living compared to coastal metros, abundant sunshine, and quick access to outdoor recreation like Red Rock Canyon and Lake Mead.",
        ],
      },
      {
        heading: "Where to Live",
        body: [
          "The valley is a collection of distinct areas. Henderson and Summerlin are the anchors for master-planned and luxury living, while newer southwest communities offer modern construction and value. Consider commute, amenities, and the character of each community.",
        ],
        bullets: [
          "Henderson — master-planned communities, established amenities, and guard-gated luxury like Ascaya and MacDonald Highlands.",
          "Summerlin — west-side master plan with parks, trails, and Downtown Summerlin.",
          "Lake Las Vegas — waterfront resort living in eastern Henderson.",
          "Southwest & Southern Highlands — newer construction and golf-community options.",
        ],
      },
      {
        heading: "Practical Details",
        body: [
          "Nevada has no state income tax, which is a significant draw for many relocating households. Summers are hot and dry, and winters are mild. Public and private school options vary by area, so confirm current attendance zones as part of your home search.",
        ],
      },
    ],
    faqs: [
      {
        q: "Does Nevada have a state income tax?",
        a: "No. Nevada has no state income tax, which is one of the most common reasons people relocate to Las Vegas from higher-tax states.",
      },
      {
        q: "What are the best areas to live in Las Vegas?",
        a: "Popular choices include Henderson and Summerlin for master-planned living, Lake Las Vegas for waterfront resort living, and southwest communities like Southern Highlands for newer construction and golf. The right fit depends on your commute, budget, and lifestyle.",
      },
      {
        q: "What is the cost of living in Las Vegas?",
        a: "Las Vegas generally offers a more favorable cost of living than many coastal metros, helped by no state income tax. Housing costs vary widely by community and home type.",
      },
    ],
  },

  {
    slug: "las-vegas-vs-henderson",
    title: "Las Vegas vs. Henderson: Where Should You Buy?",
    category: "Buying",
    featured: false,
    seoTitle: "Las Vegas vs. Henderson: Where Should You Buy a Home?",
    seoDescription:
      "Comparing Las Vegas and Henderson for homebuyers — communities, amenities, commute, and lifestyle — to help you decide where to buy in Southern Nevada.",
    h1: "Las Vegas vs. Henderson: Where Should You Buy?",
    eyebrow: "Buyer Guide",
    intro:
      "Two of Southern Nevada's most popular places to buy, side by side — so you can decide which fits your life and budget.",
    readMinutes: 6,
    sections: [
      {
        heading: "The Quick Answer",
        body: [
          "Both Las Vegas and Henderson are part of the same metro valley and share Nevada's tax advantages and climate. Henderson, a separate incorporated city to the southeast, is known for its master-planned communities and amenities, while Las Vegas proper offers everything from urban living near the Strip to the western master plan of Summerlin.",
        ],
      },
      {
        heading: "Consider Henderson If…",
        body: [
          "You want established master-planned communities, a wide range of amenities, and access to guard-gated luxury like Ascaya, MacDonald Highlands, and Lake Las Vegas. Henderson is frequently recognized for its parks, trails, and community planning.",
        ],
      },
      {
        heading: "Consider Las Vegas If…",
        body: [
          "You want the breadth of the city — from Summerlin's west-side master plan and Red Rock access to homes closer to the Strip, Downtown, and entertainment. Las Vegas offers the widest overall range of neighborhoods and price points.",
        ],
      },
    ],
    faqs: [
      {
        q: "Is Henderson part of Las Vegas?",
        a: "Henderson is a separate incorporated city within the greater Las Vegas Valley metro area, located southeast of Las Vegas. The two share the same region, climate, and Nevada tax advantages.",
      },
      {
        q: "Is it cheaper to live in Las Vegas or Henderson?",
        a: "Prices in both cities vary widely by community and home type, and they overlap significantly. The better value depends on the specific neighborhood and property rather than the city as a whole.",
      },
      {
        q: "Which is better for families, Las Vegas or Henderson?",
        a: "Both offer master-planned communities, parks, and schools. The right choice depends on objective factors like commute, home size, amenities, and the specific neighborhood — we're happy to help you compare options.",
      },
    ],
  },

  {
    slug: "first-time-home-buyer-las-vegas",
    title: "First-Time Home Buyer Guide for Las Vegas",
    category: "Buying",
    featured: true,
    seoTitle: "First-Time Home Buyer Guide for Las Vegas (2026)",
    seoDescription:
      "A first-time buyer's guide to Las Vegas — down payment help, loan programs, the step-by-step process, and Nevada-specific tips to buy your first home with confidence.",
    h1: "First-Time Home Buyer Guide for Las Vegas",
    eyebrow: "Buyer Guide",
    intro:
      "Buying your first home in Las Vegas, demystified — what you need, what it costs, and how the process actually works.",
    readMinutes: 8,
    sections: [
      {
        heading: "Start With Your Budget and Pre-Approval",
        body: [
          "Before anything else, get pre-approved. A lender will look at your income, debts, and credit to tell you what you can realistically borrow and what your monthly payment looks like — including taxes, insurance, and any HOA dues. In Las Vegas, HOA fees are common in master-planned and gated communities, so factor them in from the start.",
        ],
      },
      {
        heading: "Down Payment Help for Nevada Buyers",
        body: [
          "First-time buyers often assume they need 20% down — you usually don't. Nevada offers down-payment assistance programs (such as those through the Nevada Housing Division's Home Is Possible), and loan programs like FHA (as low as 3.5% down), conventional (as low as 3%), and VA (zero down for eligible veterans) all lower the barrier. A local lender can match you to the right one.",
        ],
      },
      {
        heading: "The Step-by-Step Process",
        body: ["Once you're pre-approved, the path is straightforward with the right agent guiding you:"],
        bullets: [
          "Tour homes and identify the right community and price point.",
          "Make an offer with sensible inspection and appraisal contingencies.",
          "Complete inspections and the lender's appraisal during escrow.",
          "Do a final walkthrough, sign at title/escrow, and get your keys — typically about 30 days from accepted offer.",
        ],
      },
      {
        heading: "First-Timer Tips",
        body: [
          "Don't skip the inspection, don't make big purchases or open new credit before closing, and lean on your agent — a good one protects you through negotiation, disclosures, and deadlines so nothing catches you off guard.",
        ],
      },
    ],
    faqs: [
      {
        q: "How much do I need to buy my first home in Las Vegas?",
        a: "Less than most people think. Depending on the loan, down payments start around 3–3.5%, and VA loans can be zero down. Nevada also has down-payment assistance programs for eligible first-time buyers.",
      },
      {
        q: "What credit score do I need to buy a home in Nevada?",
        a: "It varies by loan program. FHA loans can allow lower scores than conventional loans. A local lender can review your credit and outline your options and any steps to improve your terms.",
      },
      {
        q: "How long does buying a first home take?",
        a: "Once you're under contract, most financed purchases close in about 30 days. The search itself depends on inventory and how specific your criteria are.",
      },
    ],
  },

  {
    slug: "va-loans-nevada",
    title: "VA Loans in Nevada: A Guide for Veterans & Military Buyers",
    category: "Buying",
    featured: false,
    seoTitle: "VA Loans in Nevada: Guide for Veterans & Military Buyers",
    seoDescription:
      "How VA loans work in Nevada — zero down payment, no PMI, eligibility, funding fee, and tips for veterans and active military buying a home in Las Vegas.",
    h1: "VA Loans in Nevada: A Guide for Veterans & Military Buyers",
    eyebrow: "Buyer Guide",
    intro:
      "Las Vegas is a fantastic place to use your VA benefit. Here's how VA loans work and how to make the most of yours.",
    readMinutes: 7,
    sections: [
      {
        heading: "Why the VA Loan Is So Powerful",
        body: [
          "For eligible veterans, active-duty service members, and qualifying surviving spouses, the VA loan is one of the best financing tools available: zero down payment, no private mortgage insurance (PMI), and competitive interest rates. In a market like Las Vegas — home to a large veteran and military community near Nellis Air Force Base — it's widely used.",
        ],
      },
      {
        heading: "Eligibility and the Certificate of Eligibility",
        body: [
          "Eligibility is based on your service history. You'll obtain a Certificate of Eligibility (COE) to confirm your entitlement — a VA-savvy lender can pull this quickly. Occupancy is required, meaning the home must be your primary residence.",
        ],
      },
      {
        heading: "The Funding Fee and Costs",
        body: [
          "Most VA loans include a one-time funding fee (which can be financed into the loan), though some veterans — such as those with a service-connected disability rating — may be exempt. Because there's no down payment or PMI, VA buyers often have lower upfront and monthly costs than comparable conventional buyers.",
        ],
      },
      {
        heading: "Tips for VA Buyers in Las Vegas",
        body: [
          "Work with an agent and lender experienced in VA transactions — VA appraisals and the Minimum Property Requirements have their own nuances. Structuring the offer well (including who pays certain fees) keeps your transaction smooth.",
        ],
      },
    ],
    faqs: [
      {
        q: "Do VA loans really require no down payment?",
        a: "Yes. For eligible buyers, VA loans allow 100% financing with no down payment and no monthly PMI, which is a major advantage over most other loan types.",
      },
      {
        q: "Can I use a VA loan more than once?",
        a: "Yes. VA entitlement can be reused, and in some cases you can have more than one VA loan at a time. A VA-experienced lender can explain how your entitlement applies to your situation.",
      },
      {
        q: "Is there a loan limit on VA loans in Nevada?",
        a: "Veterans with full entitlement generally have no VA loan limit, though your lender still qualifies you based on income and credit. Your lender can confirm how this applies to your purchase.",
      },
    ],
  },

  {
    slug: "new-construction-vs-resale-las-vegas",
    title: "New Construction vs. Resale Homes in Las Vegas",
    category: "Buying",
    featured: false,
    seoTitle: "New Construction vs. Resale Homes in Las Vegas: Which Is Better?",
    seoDescription:
      "Should you buy a new-construction or resale home in Las Vegas? Compare price, timelines, upgrades, negotiation, and using your own agent with a builder.",
    h1: "New Construction vs. Resale Homes in Las Vegas",
    eyebrow: "Buyer Guide",
    intro:
      "Las Vegas has both booming new-build communities and established resale neighborhoods. Here's how to choose.",
    readMinutes: 7,
    sections: [
      {
        heading: "The Case for New Construction",
        body: [
          "Las Vegas has abundant new construction, especially in growing communities like Skye Canyon, Cadence, Inspirada, and Summerlin's newer villages. New homes offer modern floor plans, energy efficiency, warranties, and the chance to select finishes. Trade-offs: build timelines, fewer mature trees/landscaping, and lots that may be smaller.",
        ],
      },
      {
        heading: "The Case for Resale",
        body: [
          "Established resale homes often mean larger lots, mature landscaping, and locations closer to the valley's core amenities — plus you can see exactly what you're buying and move in sooner. Trade-offs: possible updates or maintenance, and more competition for well-priced homes.",
        ],
      },
      {
        heading: "Bring Your Own Agent to the Builder",
        body: [
          "One of the most important tips: when buying new construction, register with your own agent on your first visit to the builder. The on-site representative works for the builder — your agent represents you, helps you compare incentives, review the contract, and choose upgrades wisely, usually at no cost to you.",
        ],
      },
    ],
    faqs: [
      {
        q: "Is new construction more expensive than resale in Las Vegas?",
        a: "It depends on the community and finishes. New builds can carry a premium for being new and customizable, while resale can offer more space or better locations for the money. Comparing specific homes is the only real answer.",
      },
      {
        q: "Do I need my own agent to buy new construction?",
        a: "Yes — it's strongly recommended. Register your agent on your first builder visit. The builder's rep represents the builder; your agent represents your interests through pricing, contract, and upgrades, typically at no cost to you.",
      },
      {
        q: "Can you negotiate with home builders?",
        a: "Often, yes — though builders may prefer incentives (upgrades, closing-cost help, rate buydowns) over price cuts to protect community comps. An experienced agent knows how to maximize builder incentives.",
      },
    ],
  },

  {
    slug: "cost-of-living-las-vegas",
    title: "Cost of Living in Las Vegas: What to Expect",
    category: "Relocation",
    featured: false,
    seoTitle: "Cost of Living in Las Vegas: Taxes, Housing & What to Expect",
    seoDescription:
      "A breakdown of the cost of living in Las Vegas — no state income tax, housing costs, utilities, and how Southern Nevada compares for relocating buyers.",
    h1: "Cost of Living in Las Vegas: What to Expect",
    eyebrow: "Relocation Guide",
    intro:
      "One of the biggest reasons people move to Las Vegas is the numbers. Here's an honest look at the cost of living.",
    readMinutes: 6,
    sections: [
      {
        heading: "No State Income Tax",
        body: [
          "Nevada is one of a handful of states with no state income tax. For households relocating from higher-tax states, this is often the single biggest financial reason to make the move, and it meaningfully changes take-home pay.",
        ],
      },
      {
        heading: "Housing Costs",
        body: [
          "Housing is the largest line item for most households. Las Vegas generally offers more home for the money than many coastal metros, though prices vary widely by community — from approachable master plans to multimillion-dollar guard-gated estates. Property taxes in Nevada are relatively moderate compared with many states.",
        ],
      },
      {
        heading: "Utilities, Transportation, and Everyday Costs",
        body: [
          "Summer cooling drives up utility bills, so energy efficiency matters — one reason newer construction is popular. Everyday costs like groceries and transportation are broadly in line with national averages, and the lack of state income tax helps offset them.",
        ],
      },
    ],
    faqs: [
      {
        q: "Does Las Vegas have a state income tax?",
        a: "No. Nevada has no state income tax, which is one of the most cited financial reasons people relocate to Las Vegas.",
      },
      {
        q: "Is Las Vegas cheaper than California?",
        a: "For many households, yes — particularly on housing and taxes. The absence of a state income tax and generally lower home prices than major California metros are frequent motivators for relocating buyers.",
      },
      {
        q: "Are property taxes high in Las Vegas?",
        a: "Nevada's property taxes are relatively moderate compared to many states. Your exact amount depends on the home's assessed value and location; we can help you estimate it for any property.",
      },
    ],
  },

  {
    slug: "getting-a-mortgage-in-las-vegas",
    title: "Getting a Mortgage in Las Vegas: Financing Your Home",
    category: "Buying",
    featured: false,
    seoTitle: "Getting a Mortgage in Las Vegas: Home Financing Guide",
    seoDescription:
      "A guide to financing a home in Las Vegas — loan types, pre-approval, down payments, rates, and how to choose the right lender for your purchase.",
    h1: "Getting a Mortgage in Las Vegas",
    eyebrow: "Buyer Guide",
    intro:
      "Financing is the foundation of your purchase. Here's a plain-English guide to getting a mortgage in Las Vegas.",
    readMinutes: 7,
    sections: [
      {
        heading: "Start With Pre-Approval",
        body: [
          "Pre-approval is the first real step. A lender reviews your income, assets, debts, and credit, then issues a letter stating how much you can borrow. It defines your budget and, in a competitive market, signals to sellers that you're a serious buyer.",
        ],
      },
      {
        heading: "Common Loan Types",
        body: ["Most Las Vegas buyers use one of these programs:"],
        bullets: [
          "Conventional — flexible terms, often as little as 3–5% down for qualified buyers.",
          "FHA — lower credit and down-payment thresholds (commonly 3.5% down).",
          "VA — zero down and no PMI for eligible veterans and military.",
          "Jumbo — for luxury purchases above conforming loan limits, with stricter qualifying.",
        ],
      },
      {
        heading: "Choosing a Lender",
        body: [
          "Rates and fees vary between lenders, so it pays to compare. A responsive, local lender who closes on time is worth a lot in a competitive deal. We're happy to recommend trusted local lenders who know the Las Vegas market.",
        ],
      },
    ],
    faqs: [
      {
        q: "What credit score do I need for a mortgage in Las Vegas?",
        a: "It depends on the loan program — FHA loans can allow lower scores than conventional loans, and each lender sets its own overlays. A lender can review your credit and outline options.",
      },
      {
        q: "How much down payment do I need?",
        a: "It varies: conventional loans can start around 3–5%, FHA around 3.5%, and VA can be zero down for eligible buyers. Luxury and jumbo purchases typically require more.",
      },
      {
        q: "Should I get pre-approved before house hunting?",
        a: "Yes. Pre-approval defines your budget, surfaces any issues early, and makes your offers far stronger in a competitive market.",
      },
    ],
  },

  {
    slug: "understanding-hoas-las-vegas",
    title: "Understanding HOAs in Las Vegas Communities",
    category: "Buying",
    featured: false,
    seoTitle: "Understanding HOAs in Las Vegas: A Buyer's Guide",
    seoDescription:
      "What Las Vegas buyers should know about HOAs — what dues cover, guard-gated communities, CC&Rs, and how to factor HOA fees into your budget.",
    h1: "Understanding HOAs in Las Vegas Communities",
    eyebrow: "Buyer Guide",
    intro:
      "Many of the valley's best neighborhoods are governed by HOAs. Here's what that means for you as a buyer.",
    readMinutes: 6,
    sections: [
      {
        heading: "What an HOA Does",
        body: [
          "A homeowners association maintains shared amenities and common areas and enforces community standards through its CC&Rs (covenants, conditions & restrictions). In Las Vegas, HOAs are what keep master-planned and guard-gated communities looking sharp and functioning smoothly — from landscaping and parks to security and clubhouses.",
        ],
      },
      {
        heading: "Budgeting for HOA Dues",
        body: [
          "HOA dues are a real part of your monthly cost, and they vary widely — modest in some master plans, higher in luxury guard-gated communities with extensive amenities. Always factor dues into your affordability math, and review what they cover so you understand the value you're getting.",
        ],
      },
      {
        heading: "Review the CC&Rs Before You Buy",
        body: [
          "During escrow you'll receive the HOA's governing documents and resale package. Read them — they cover rules on rentals, exterior changes, parking, and more. Your agent will help you review them so there are no surprises after closing.",
        ],
      },
    ],
    faqs: [
      {
        q: "How much are HOA fees in Las Vegas?",
        a: "They vary widely by community and amenities — from modest monthly dues in some master plans to higher fees in luxury guard-gated communities. Always confirm the current dues for any specific home.",
      },
      {
        q: "What do HOA dues cover?",
        a: "Typically common-area maintenance, landscaping, amenities (pools, parks, clubhouses), and in guard-gated communities, security. The specifics are spelled out in the community's governing documents.",
      },
      {
        q: "Can I review HOA rules before buying?",
        a: "Yes. During escrow you receive the CC&Rs and resale package. Reviewing them is an important step, and your agent will help you understand the rules before you close.",
      },
    ],
  },

  {
    slug: "schools-las-vegas-henderson",
    title: "Schools in Las Vegas & Henderson: What Buyers Should Know",
    category: "Relocation",
    featured: false,
    seoTitle: "Schools in Las Vegas & Henderson: A Buyer's Guide",
    seoDescription:
      "How schools work in Las Vegas and Henderson — the Clark County School District, magnet and charter options, private schools, and how to verify attendance zones.",
    h1: "Schools in Las Vegas & Henderson",
    eyebrow: "Relocation Guide",
    intro:
      "School options matter to many buyers. Here's how the system works and how to verify the right information for any home.",
    readMinutes: 6,
    sections: [
      {
        heading: "The Clark County School District",
        body: [
          "Most of the Las Vegas Valley — including Henderson — is served by the Clark County School District (CCSD), one of the largest districts in the country. Public school assignment is generally based on your home's address, so attendance zones are tied to specific neighborhoods.",
        ],
      },
      {
        heading: "Magnet, Charter, and Private Options",
        body: [
          "Beyond zoned public schools, the area offers magnet programs, public charter schools, and a range of private and parochial schools. Availability and admission vary, so if a specific program matters to you, research its enrollment process early.",
        ],
      },
      {
        heading: "Always Verify Attendance Zones",
        body: [
          "School boundaries can and do change. Before buying based on a specific school, confirm the current attendance zone directly with CCSD and the school for the exact address — don't rely on third-party listings. We can help you locate the current zoning information for any home you're considering.",
        ],
      },
    ],
    faqs: [
      {
        q: "What school district is Las Vegas in?",
        a: "Most of the Las Vegas Valley, including Henderson, is served by the Clark County School District (CCSD). Public school assignment is generally based on your home's address.",
      },
      {
        q: "How do I find out which school a home is zoned for?",
        a: "Verify the current attendance zone directly with CCSD and the specific school using the property's exact address, since boundaries can change. We're glad to help you confirm zoning for any home.",
      },
      {
        q: "Are there charter and private schools in Las Vegas?",
        a: "Yes. In addition to zoned public schools, the area has magnet programs, public charter schools, and private and parochial options, each with its own enrollment process.",
      },
    ],
  },
];

export function getGuide(slug: string): Guide | undefined {
  return guides.find((g) => g.slug === slug);
}

export const featuredGuides = guides.filter((g) => g.featured);
