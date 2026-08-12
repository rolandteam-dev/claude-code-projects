#!/usr/bin/env node
/**
 * Roland Luxury — blog auto-drafting engine.
 *
 * Give it a topic and it writes a full, SEO-optimized, internally-linked post
 * with a branded cover and drops it into src/content/blog.ts + public/blog/.
 *
 * Modes:
 *   1) Topic (hands-off, uses Claude):
 *        ANTHROPIC_API_KEY=... node scripts/draft-blog-post.mjs \
 *          --topic "How Henderson guard-gated communities compare" \
 *          --category "Buying Guides"
 *
 *   2) From a pre-written JSON file (no API needed):
 *        node scripts/draft-blog-post.mjs --from-json ./post.json
 *
 * Optional: --date YYYY-MM-DD (defaults to today), --dry (print, don't write).
 *
 * The post JSON shape (topic mode produces this automatically):
 *   { title, category, excerpt, seoTitle, seoDescription,
 *     sections: [{ heading, body: [..paragraphs..], bullets?: [..] }] }
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const BLOG_FILE = join(ROOT, "src/content/blog.ts");
const COVER_DIR = join(ROOT, "public/blog");

const CATEGORIES = ["New Construction", "Market Updates", "Buying Guides", "Selling Guides"];
const AUTHOR = "Roland Luxury";
const MODEL = process.env.BLOG_MODEL || "claude-sonnet-5";

/** Pages the writer may link to (keeps the internal-link graph accurate). */
const LINKABLE = `INTERNAL PAGES YOU MAY LINK TO (use exact paths, markdown [label](/path)):
- /listings (search all homes), /home-value (free valuation), /market-report
- /las-vegas-luxury-real-estate, /guard-gated-communities-las-vegas
- /golf-communities-las-vegas, /active-adult-communities-las-vegas
- /new-construction, /moving-to-las-vegas, /communities, /contact
- Communities: /communities/ascaya, /communities/macdonald-highlands,
  /communities/the-ridges-summerlin, /communities/summerlin, /communities/seven-hills,
  /communities/lake-las-vegas, /communities/southern-highlands, /communities/anthem
- Guides live at /guides/<slug> (e.g. /guides/buying-a-home-in-las-vegas)`;

// ---------- args ----------
function parseArgs(argv) {
  const a = { dry: false };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    if (k === "--topic") a.topic = argv[++i];
    else if (k === "--category") a.category = argv[++i];
    else if (k === "--from-json") a.fromJson = argv[++i];
    else if (k === "--date") a.date = argv[++i];
    else if (k === "--dry") a.dry = true;
  }
  return a;
}

// ---------- helpers ----------
function slugify(s) {
  return s
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70)
    .replace(/-+$/g, "");
}

function wordCount(post) {
  let words = (post.excerpt || "").split(/\s+/).length;
  for (const s of post.sections || []) {
    for (const p of s.body || []) words += p.split(/\s+/).length;
    for (const b of s.bullets || []) words += b.split(/\s+/).length;
  }
  for (const f of post.faqs || []) {
    words += (f.q || "").split(/\s+/).length + (f.a || "").split(/\s+/).length;
  }
  return words;
}

function readMinutes(post) {
  return Math.max(4, Math.round(wordCount(post) / 200));
}

function xml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Branded, on-brand SVG cover (1200×630) — graphite + gold, category-themed. */
function coverSvg(category) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-label="Roland Luxury — ${xml(category)}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#15171d"/>
      <stop offset="1" stop-color="#0e1014"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <text x="600" y="470" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="560" fill="#d8bd84" opacity="0.05">&#10022;</text>
  <text x="80" y="96" font-family="Arial, Helvetica, sans-serif" font-size="26" letter-spacing="9" fill="#d8bd84">ROLAND LUXURY</text>
  <rect x="82" y="122" width="96" height="2" fill="#9a7b3f"/>
  <text x="80" y="352" font-family="Georgia, 'Times New Roman', serif" font-style="italic" font-size="88" fill="#f6f3ee">${xml(category)}</text>
  <text x="80" y="556" font-family="Arial, Helvetica, sans-serif" font-size="23" letter-spacing="5" fill="#c2a36b">LAS VEGAS &#183; HENDERSON &#183; SUMMERLIN</text>
</svg>
`;
}

function writeCover(slug, category, dry) {
  const rel = `/blog/${slug}.svg`;
  if (!dry) {
    mkdirSync(COVER_DIR, { recursive: true });
    writeFileSync(join(COVER_DIR, `${slug}.svg`), coverSvg(category), "utf8");
  }
  return rel;
}

// ---------- validation ----------
function existingSlugs() {
  const src = readFileSync(BLOG_FILE, "utf8");
  return new Set([...src.matchAll(/slug:\s*"([^"]+)"/g)].map((m) => m[1]));
}

function validate(post, slug) {
  const errs = [];
  if (!post.title) errs.push("missing title");
  if (!CATEGORIES.includes(post.category)) errs.push(`category must be one of ${CATEGORIES.join(", ")}`);
  if (!post.excerpt) errs.push("missing excerpt");
  if (!post.seoTitle) errs.push("missing seoTitle");
  else if (post.seoTitle.length > 65) errs.push(`seoTitle too long (${post.seoTitle.length} > 65)`);
  if (!post.seoDescription) errs.push("missing seoDescription");
  else if (post.seoDescription.length > 158) errs.push(`seoDescription too long (${post.seoDescription.length} > 158)`);
  if (!Array.isArray(post.sections) || post.sections.length < 5) errs.push("need at least 5 sections (long-form)");
  for (const [i, s] of (post.sections || []).entries()) {
    if (!s.heading) errs.push(`section ${i} missing heading`);
    if (!Array.isArray(s.body) || s.body.length === 0) errs.push(`section ${i} missing body`);
  }
  if (post.faqs !== undefined) {
    if (!Array.isArray(post.faqs)) errs.push("faqs must be an array");
    else for (const [i, f] of post.faqs.entries()) {
      if (!f || !f.q || !f.a) errs.push(`faq ${i} needs both q and a`);
    }
  }
  if (existingSlugs().has(slug)) errs.push(`slug "${slug}" already exists`);
  if (errs.length) throw new Error("Post failed validation:\n - " + errs.join("\n - "));
}

// ---------- TS serialization ----------
function toTs(v, indent) {
  const pad = "  ".repeat(indent);
  const padIn = "  ".repeat(indent + 1);
  if (Array.isArray(v)) {
    if (v.length === 0) return "[]";
    return "[\n" + v.map((x) => padIn + toTs(x, indent + 1)).join(",\n") + "\n" + pad + "]";
  }
  if (v && typeof v === "object") {
    const keys = Object.keys(v).filter((k) => v[k] !== undefined);
    return "{\n" + keys.map((k) => padIn + k + ": " + toTs(v[k], indent + 1)).join(",\n") + "\n" + pad + "}";
  }
  if (typeof v === "string") return JSON.stringify(v);
  return String(v);
}

function insertPost(ordered, dry) {
  const literal = "\n  " + toTs(ordered, 1) + ",";
  const src = readFileSync(BLOG_FILE, "utf8");
  const marker = "export const blogPosts: BlogPost[] = [";
  const idx = src.indexOf(marker);
  if (idx === -1) throw new Error("Could not find blogPosts array in blog.ts");
  const at = idx + marker.length;
  const next = src.slice(0, at) + literal + src.slice(at);
  if (!dry) writeFileSync(BLOG_FILE, next, "utf8");
}

// ---------- Claude generation (topic mode) ----------
async function generateViaApi(topic, category) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY not set — required for --topic mode. Use --from-json instead, or set the key.");

  const system = `You are the content writer for Roland Luxury, the luxury division of The Roland Team | LPT Realty — a Top 1% Las Vegas real estate team (Las Vegas & Henderson, NV). Write a single, genuinely useful, SEO-optimized blog post.

Return ONLY valid minified-or-pretty JSON (no markdown fences, no commentary) with EXACTLY these keys:
{
  "title": string,               // compelling, specific, ~50-70 chars
  "category": one of ${JSON.stringify(CATEGORIES)},
  "excerpt": string,             // 1-2 sentence hook, <= 200 chars
  "seoTitle": string,            // <= 60 chars, keyword-forward
  "seoDescription": string,      // <= 155 chars, benefit + keyword
  "sections": [ { "heading": string, "body": [string, ...], "bullets": [string, ...] (optional) }, ... ],
  "faqs": [ { "q": string, "a": string }, ... ]
}

REQUIREMENTS:
- LONG-FORM and comprehensive: 8-14 sections, ~1800-3000 words total (a 12-18 minute read), written for a real Las Vegas buyer/seller. Depth and genuine usefulness matter more than length — every section must earn its place.
- Each section should have 2-4 substantial paragraphs; use "bullets" where a list genuinely helps (steps, checklists, pros/cons, what-to-look-for). Not every section needs bullets.
- Open with a strong, specific intro section that frames the reader's real question, and close with a section that tells them the clear next step.
- Include a "faqs" array of 5-8 real questions a Las Vegas buyer/seller would ask on this topic, each with a thorough 2-4 sentence answer.
- Weave in 4-8 relevant INTERNAL links using markdown [label](/path) inside body paragraphs (not headings). Only use paths from the list below.
- Helpful and authoritative; no fluff, no fabricated statistics, no specific active listing prices or inventory counts. Explain mechanisms, trade-offs, and process concretely.
- Fair Housing compliant: describe places by objective features and lifestyle, never by demographics; never steer.
- Keep pricing general/approximate and route readers to contact for current availability.
- American English. Confident, polished, plain language.

${LINKABLE}

Topic to write about: "${topic}"${category ? `\nUse category: ${category}` : ""}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: MODEL, max_tokens: 12000, system, messages: [{ role: "user", content: `Write the long-form post about: ${topic}` }] }),
  });
  if (!res.ok) throw new Error(`Anthropic API error ${res.status}: ${(await res.text()).slice(0, 400)}`);
  const json = await res.json();
  const text = (json.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("Model did not return JSON:\n" + text.slice(0, 400));
  return JSON.parse(text.slice(start, end + 1));
}

// ---------- main ----------
async function main() {
  const args = parseArgs(process.argv.slice(2));
  const date = args.date || new Date().toISOString().slice(0, 10);

  let post;
  if (args.fromJson) {
    post = JSON.parse(readFileSync(args.fromJson, "utf8"));
  } else if (args.topic) {
    console.log(`✍️  Drafting via ${MODEL}: "${args.topic}"…`);
    post = await generateViaApi(args.topic, args.category);
  } else {
    console.error("Usage: --topic \"...\" [--category \"...\"]  OR  --from-json ./post.json  [--date YYYY-MM-DD] [--dry]");
    process.exit(1);
  }

  const slug = slugify(post.slug || post.title);
  validate(post, slug);

  const coverImage = writeCover(slug, post.category, args.dry);
  const ordered = {
    slug,
    title: post.title,
    category: post.category,
    excerpt: post.excerpt,
    date,
    author: post.author || AUTHOR,
    readMinutes: readMinutes(post),
    seoTitle: post.seoTitle,
    seoDescription: post.seoDescription,
    coverImage,
    coverAlt: post.coverAlt || `${post.category} — Roland Luxury Las Vegas real estate`,
    sections: post.sections,
    faqs: post.faqs,
  };

  if (args.dry) {
    console.log(toTs(ordered, 1));
    console.log("\n(dry run — nothing written)");
    return;
  }

  insertPost(ordered, false);
  console.log(`✅ Added post: ${slug}`);
  console.log(`   • ${ordered.readMinutes} min read · ${wordCount(post)} words · ${post.sections.length} sections`);
  console.log(`   • Cover: public${coverImage}`);
  console.log(`   • Live at: /blog/${slug}`);
  console.log(`\nNext: npm run build  (then commit)`);
}

main().catch((e) => {
  console.error("✖", e.message);
  process.exit(1);
});
