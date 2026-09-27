/**
 * The free relocation guides offered from guide.therolandteam.com (the page
 * linked in every YouTube description and pinned comment).
 *
 * Two guides, one form. Part one is the practical move (costs, deadlines,
 * schools, buying from out of state, a 90-day checklist). Part two is the city
 * itself, with no Strip recommendations. Both are also published as web pages
 * on therolandteam.com, so "Read online" points there and "Download PDF"
 * points at the PDF.
 *
 * PDFs: currently the shared Google Drive files (anyone with the link can
 * read). To self-host, drop the files in /public/guides/ and change the two
 * pdfUrl values to "/guides/<file>.pdf" — nothing else references them.
 */

export type RelocationGuide = {
  slug: "starter-kit" | "locals";
  part: "Part one" | "Part two";
  title: string;
  /** One line under the title, on covers and cards. */
  tagline: string;
  /** Slightly longer line on the thank-you cards and in the email. */
  blurb: string;
  readUrl: string;
  pdfUrl: string;
  cover: "dark" | "light";
};

export const relocationGuides: RelocationGuide[] = [
  {
    slug: "starter-kit",
    part: "Part one",
    title: "The Las Vegas Relocation Starter Kit",
    tagline: "What the move costs, the two hard deadlines, schools, and a 90-day checklist.",
    blurb: "Costs, deadlines, schools, buying from out of state, and the 90-day checklist.",
    readUrl: "https://therolandteam.com/las-vegas-relocation-starter-kit",
    pdfUrl: "https://drive.google.com/uc?export=download&id=1h1d2GcPaz-l1EFF5He1CBE052ApQO0VT",
    cover: "dark",
  },
  {
    slug: "locals",
    part: "Part two",
    title: "The Locals' Las Vegas",
    tagline: "Where we actually eat, swim, hike, and take visitors. Not one Strip recommendation.",
    blurb: "Where we actually eat, swim, hike, and take visitors. Not one Strip recommendation.",
    readUrl: "https://therolandteam.com/the-locals-las-vegas-guide",
    pdfUrl: "https://drive.google.com/uc?export=download&id=1doCfoApV2C9kSmkZfYNihQT-fBnPe6-V",
    cover: "light",
  },
];

/** Both guides in one PDF, for people who want a single file. */
export const combinedGuidePdfUrl =
  "https://drive.google.com/uc?export=download&id=1wYl4e51s5EcIipUzm4S3ZEvwZetIH1OP";

/** Contact details shown on the guide pages. One place to change them. */
export const guideContact = {
  phoneDisplay: "(702) 830-7568",
  phoneHref: "tel:+17028307568",
  email: "mike@therolandteam.com",
  bookingUrl: "https://scheduler.zoom.us/mike-roland-l0cm4c/mike-roland-real-estate-consultation",
  privacyUrl: "https://therolandteam.com/privacy-policy",
  legalName: "The Roland Team | LPT Realty",
  address: "5860 S Pecos Rd, Unit 300, Las Vegas, NV 89120",
  /** Where the guide page lives. Canonical URL and the origin used in the email. */
  origin: "https://guide.therolandteam.com",
};

/** The consent line under the form. Matches the wording used on therolandteam.com forms. */
export const consentText =
  "I agree to be contacted by The Roland Team - LPT Realty via call, email, and text for real estate services. To opt out, you can reply 'stop' at any time or reply 'help' for assistance. You can also click the unsubscribe link in the emails. Message and data rates may apply. Message frequency may vary.";

export const starterKitChapters = [
  {
    n: "01",
    title: "Your first 30 days",
    body: "The two hard deadlines (driver's license and registration), utilities, and who to call.",
  },
  {
    n: "02",
    title: "What it really costs to own here",
    body: "Property tax and the 3% cap, the SID/LID line item that is not in the listing, HOAs, and closing costs.",
  },
  {
    n: "03",
    title: "A plain-English map of the valley",
    body: "Which pockets fit which commute, and three things the map does not show you.",
  },
  {
    n: "04",
    title: "Schools, and what changed in 2026",
    body: "What to check before you commit to a zone, and the rule change most people have not heard about.",
  },
  {
    n: "05",
    title: "How to buy from 1,500 miles away",
    body: "Eight to twelve weeks out, the trip, under contract, and two things worth knowing about summer.",
  },
  {
    n: "06",
    title: "Your 90-day checklist",
    body: "Every deadline in order, so nothing gets missed between the offer and the first week in the house.",
  },
];

export const localsSections = [
  { title: "Where we actually eat", body: "Chinatown, the Arts District, and Water Street in Henderson." },
  { title: "The neighborhood casinos", body: "Which ones locals use, and for what." },
  {
    title: "Water in the desert",
    body: "The water parks, the pool you do not have to be a guest for, Lake Mead, and your own pool, honestly assessed.",
  },
  {
    title: "The heat calendar",
    body: "June through August indoors, Red Rock before it fills, and where to drive when it is 110.",
  },
  {
    title: "When your visitors land",
    body: "First-timers, the ones who have “already done Vegas,” kids, and the parents.",
  },
  { title: "Day trips worth the drive", body: "Valley of Fire in winter, and the easy evening that always works." },
];

/** Verified credibility stats (same figures the marketing site uses). */
export const guideStats = [
  { value: "Top 1%", label: "Las Vegas real estate team" },
  { value: "1,000+", label: "homes sold" },
  { value: "800+", label: "five-star reviews" },
  { value: "No. 1", label: "in Henderson, RealTrends 2026" },
];

/**
 * Which channel a visitor came from, by the `s` query parameter on the link
 * (guide.therolandteam.com/?s=ig). The value becomes the lead's Source in
 * Follow Up Boss. No parameter means YouTube, because that is where the page
 * is linked from by default.
 */
export const channelSources: Record<string, string> = {
  yt: "YouTube",
  youtube: "YouTube",
  ig: "Instagram",
  instagram: "Instagram",
  fb: "Facebook",
  facebook: "Facebook",
  tt: "TikTok",
  tiktok: "TikTok",
  x: "X",
  twitter: "X",
  em: "Email",
  email: "Email",
  txt: "Text",
  sms: "Text",
};

export const DEFAULT_CHANNEL_SOURCE = "YouTube";

export function sourceForChannel(channel?: string | null): string {
  const key = (channel ?? "").trim().toLowerCase();
  if (!key) return DEFAULT_CHANNEL_SOURCE;
  return channelSources[key] ?? "Relocation Guide Page";
}
