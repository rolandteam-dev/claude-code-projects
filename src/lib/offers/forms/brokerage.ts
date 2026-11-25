/**
 * Offer Machine — the brokerage's own details that go on the forms: broker of record, each agent's
 * license number, the licensees listed on every Supplemental form.
 *
 * This is NOT in the repo (it is public, and license numbers/addresses don't belong in it). It is one
 * JSON file in the private Blob store (config/brokerage.json), uploaded through
 * /api/admin/offers-forms?name=brokerage. Shape below; unknown agents simply get blank licence fields,
 * which the packet reports as "still to do".
 */
export interface Broker {
  name: string;
  license: string;
  company: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  email: string;
}

export interface Agent {
  name: string;
  license: string;
  /** Phone shown on the BBRA / RPA; falls back to officePhone. */
  phone?: string;
  /** The agent's own e-mail, printed first on the BBRA. */
  email?: string;
  /** Other spellings the bot may see ("Mike", "Michael Roland"). */
  aliases?: string[];
}

export interface BrokerageConfig {
  broker: Broker;
  agents: Agent[];
  /** Licensees listed on every Supplemental form (e.g. the transaction coordinator). */
  additionalLicensees: { name: string; license: string }[];
  /** Phone for the BBRA's designated licensee when the agent has none. */
  officePhone: string;
  /** E-mails copied after the agent's own on the BBRA (e.g. the transaction coordinator). */
  contactEmails: string[];
}

const str = (v: unknown, max = 120): string => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** Validates and cleans an uploaded config; throws a readable error when it is unusable. */
export function parseBrokerage(raw: unknown): BrokerageConfig {
  const o = (raw ?? {}) as Record<string, unknown>;
  const b = (o.broker ?? {}) as Record<string, unknown>;
  const broker: Broker = {
    name: str(b.name),
    license: str(b.license, 40),
    company: str(b.company),
    address: str(b.address),
    city: str(b.city, 60),
    state: str(b.state, 4),
    zip: str(b.zip, 10),
    phone: str(b.phone, 30),
    email: str(b.email),
  };
  if (!broker.name || !broker.company) throw new Error("broker.name and broker.company are required");
  const agents = (Array.isArray(o.agents) ? o.agents : [])
    .map((a: Record<string, unknown>) => ({
      name: str(a?.name),
      license: str(a?.license, 40),
      ...(str(a?.phone, 30) ? { phone: str(a?.phone, 30) } : {}),
      ...(str(a?.email) ? { email: str(a?.email) } : {}),
      ...(Array.isArray(a?.aliases) ? { aliases: a.aliases.map((x) => str(x)).filter(Boolean).slice(0, 6) } : {}),
    }))
    .filter((a) => a.name)
    .slice(0, 200);
  const additionalLicensees = (Array.isArray(o.additionalLicensees) ? o.additionalLicensees : [])
    .map((a: Record<string, unknown>) => ({ name: str(a?.name), license: str(a?.license, 40) }))
    .filter((a) => a.name)
    .slice(0, 12);
  const contactEmails = (Array.isArray(o.contactEmails) ? o.contactEmails : []).map((e) => str(e)).filter(Boolean).slice(0, 4);
  return { broker, agents, additionalLicensees, officePhone: str(o.officePhone, 30), contactEmails };
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z\s]/g, "").replace(/\s+/g, " ").trim();

/** The roster entry for a typed agent name (exact, alias, or unique first+last match), or undefined. */
export function findAgent(cfg: BrokerageConfig, name: string | undefined): Agent | undefined {
  if (!name) return undefined;
  const want = norm(name);
  const hit = cfg.agents.find((a) => norm(a.name) === want || (a.aliases ?? []).some((x) => norm(x) === want));
  if (hit) return hit;
  const first = want.split(" ")[0];
  const last = want.split(" ").slice(-1)[0];
  const loose = cfg.agents.filter((a) => {
    const n = norm(a.name).split(" ");
    return n[0] === first && n[n.length - 1] === last;
  });
  return loose.length === 1 ? loose[0] : undefined;
}
