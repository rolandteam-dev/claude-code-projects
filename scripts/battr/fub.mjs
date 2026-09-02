/**
 * Minimal Follow Up Boss API client for the Battr audit.
 *
 * Auth matches the site's lead intake (src/app/api/lead/route.ts): HTTP Basic
 * with the API key as the username and an empty password.
 *
 * Written defensively on purpose. FUB names its collection keys inconsistently
 * ("people", "textmessages", "smartlists"), so `collection()` finds the array
 * rather than trusting a guessed key, and pagination follows FUB's `nextLink`
 * cursor — offset paging is rejected past the first page.
 */

/** Overridable so the self-test can point the real client at a local fixture server. */
const BASE = process.env.FUB_API_BASE || "https://api.followupboss.com/v1";
const SYSTEM = "TheRolandTeamBattr";

/** FUB allows bursts but throttles hard; this keeps us well under the ceiling. */
const PAGE_SIZE = 100;
const MAX_RETRIES = 5;
/**
 * Guard against a server that always hands back a cursor. Sized well past the
 * real database; hitting it is treated as an error, never a silent stop.
 */
const MAX_PAGES = 5000;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Pull the array out of a FUB response without depending on the key's name. */
function collection(payload) {
  if (Array.isArray(payload)) return payload;
  for (const [key, value] of Object.entries(payload ?? {})) {
    if (key !== "_metadata" && Array.isArray(value)) return value;
  }
  return [];
}

export class FubClient {
  constructor(apiKey, { dry = true, log = console.error } = {}) {
    if (!apiKey) throw new Error("FUB_API_KEY is required.");
    this.auth = `Basic ${Buffer.from(`${apiKey}:`).toString("base64")}`;
    this.dry = dry;
    this.log = log;
    this.reads = 0;
    this.writes = 0;
  }

  /**
   * `target` is either a path ("/people") or an absolute URL — FUB's pagination
   * cursor comes back as a full nextLink, and it is followed verbatim.
   */
  async request(method, target, { query, body } = {}) {
    const url = new URL(target.startsWith("http") ? target : `${BASE}${target}`);
    for (const [k, v] of Object.entries(query ?? {})) {
      if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
    }

    const isWrite = method !== "GET";
    if (isWrite && this.dry) {
      this.log(`  [dry] ${method} ${url.pathname}${url.search} ${body ? JSON.stringify(body).slice(0, 160) : ""}`);
      return { dry: true };
    }

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      const res = await fetch(url, {
        method,
        headers: {
          Authorization: this.auth,
          "Content-Type": "application/json",
          "X-System": SYSTEM,
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      // Throttled or a transient server error — back off and retry.
      if (res.status === 429 || res.status >= 500) {
        if (attempt === MAX_RETRIES) {
          throw new Error(`FUB ${method} ${target} failed after ${MAX_RETRIES} retries (${res.status})`);
        }
        const retryAfter = Number(res.headers.get("Retry-After"));
        const waitMs = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 2 ** attempt * 500;
        this.log(`  ${res.status} from ${target}, retrying in ${Math.round(waitMs / 1000)}s`);
        await sleep(waitMs);
        continue;
      }

      if (!res.ok) {
        const detail = (await res.text()).slice(0, 300);
        throw new Error(`FUB ${method} ${target} → ${res.status}: ${detail}`);
      }

      if (isWrite) this.writes++;
      else this.reads++;
      return res.status === 204 ? {} : res.json();
    }
  }

  /**
   * Walk every page of a collection endpoint and return the flattened rows.
   *
   * Follows FUB's `_metadata.nextLink` cursor. Offset paging is NOT used: FUB
   * rejects it past the first page with
   * `400 Deep pagination disabled, use 'nextLink' url`.
   */
  async paginate(path, query = {}, { max = Infinity } = {}) {
    const rows = [];
    let cursor = null;
    let reportedTotal = null;
    let exhausted = false;

    for (let page = 0; page < MAX_PAGES; page++) {
      const payload = cursor
        ? await this.request("GET", cursor)
        : await this.request("GET", path, { query: { ...query, limit: PAGE_SIZE } });

      if (reportedTotal === null && Number.isFinite(payload?._metadata?.total)) {
        reportedTotal = payload._metadata.total;
      }

      rows.push(...collection(payload));
      if (rows.length >= max) return rows.slice(0, max);

      const next = payload?._metadata?.nextLink ?? payload?._metadata?.next;
      if (!next || typeof next !== "string") {
        exhausted = true;
        break;
      }
      cursor = next;
    }

    // Silent truncation is the dangerous failure here: a short read looks like a
    // small database, and an audit over a fraction of the leads still produces a
    // confident-looking report. Refuse instead.
    if (!exhausted) {
      throw new Error(
        `FUB GET ${path} hit the ${MAX_PAGES}-page cap at ${rows.length} rows without exhausting the collection. ` +
          `Raise MAX_PAGES or narrow the query — do not trust a truncated audit.`
      );
    }
    if (Number.isFinite(reportedTotal) && rows.length < reportedTotal) {
      this.log(`  WARNING: ${path} returned ${rows.length} of ${reportedTotal} reported rows`);
    }

    return rows;
  }

  // ------------------------------------------------------------------- reads

  users() {
    return this.paginate("/users");
  }

  ponds() {
    return this.paginate("/ponds");
  }

  smartLists() {
    return this.paginate("/smartLists");
  }

  stages() {
    return this.paginate("/stages");
  }

  customFields() {
    return this.paginate("/customFields");
  }

  /**
   * The audit population. `smartListId` reproduces Battr's audit list exactly
   * when available; without it we fall back to every non-trashed person and let
   * the exclusion rules do the filtering.
   */
  people({ smartListId } = {}) {
    return this.paginate("/people", {
      smartListId,
      includeTrash: false,
      sort: "id",
    });
  }

  /**
   * Communication activity since `sinceIso`, pulled in bulk rather than per
   * lead. Three endpoints, one pass each — this is what keeps an ~880-lead
   * audit inside a few dozen API calls instead of a few thousand.
   */
  async activity(sinceIso) {
    // Calls and texts only. Email is excluded by policy, not by limitation:
    // mass email in FUB is a single click, so counting it would let one blast
    // mark an entire database as worked. (FUB also refuses to serve /v1/emails
    // in bulk, so the two reasons happen to agree.)
    const [calls, texts] = await Promise.all([
      this.paginate("/calls", { createdAfter: sinceIso }),
      this.paginate("/textMessages", { createdAfter: sinceIso }),
    ]);
    return { calls, texts, emails: [] };
  }

  // ------------------------------------------------------------------ writes

  note(personId, body, subject = "Battr audit") {
    return this.request("POST", "/notes", {
      body: { personId, subject, body, isHtml: false },
    });
  }

  /** Reassign a person. Passing a pond clears the individual agent assignment. */
  assign(personId, { userId = null, pondId = null, fields = {} } = {}) {
    return this.request("PUT", `/people/${personId}`, {
      body: { assignedUserId: userId, assignedPondId: pondId, ...fields },
    });
  }

  updateFields(personId, fields) {
    return this.request("PUT", `/people/${personId}`, { body: fields });
  }

  addTag(personId, tags) {
    return this.request("PUT", `/people/${personId}`, { body: { tags } });
  }
}

export { collection };
