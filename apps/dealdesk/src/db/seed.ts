/**
 * Seeds a realistic local dataset:
 *   - The Roland Team (tenant #1) with three deals at different stages
 *   - A second tenant, so tenant isolation is observable rather than assumed
 *
 * Runs over the OWNER connection deliberately: seeding crosses tenants, which
 * is exactly what RLS forbids for the runtime role.
 *
 * Idempotent — it clears the tables it owns before inserting.
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config();

import { randomBytes, createHash } from "node:crypto";
import { sql } from "drizzle-orm";
import { getAdminDb } from ".";
import * as s from "./schema";
import { addDays, today, type IsoDate } from "@/lib/dates";
import { computeDeadlines, NVAR_RPA_RULES } from "@/lib/deadlines";
import {
  PURCHASE_TEMPLATE_NAME,
  PURCHASE_TEMPLATE_STEPS,
} from "@/lib/milestones/template";
import type { MilestoneKey } from "./schema/milestones";
import type { DealDateKey } from "./schema/deals";

const db = getAdminDb();

/** Per-deal milestone state: how far along the transaction actually is. */
type StageMap = Partial<
  Record<MilestoneKey, "done" | "in_progress" | "blocked" | "pending" | "na">
>;

function clientToken() {
  const raw = randomBytes(32).toString("base64url");
  return {
    raw,
    hash: createHash("sha256").update(raw).digest("hex"),
    prefix: raw.slice(0, 8),
  };
}

async function clearAll() {
  // Truncate in one statement so FK order does not matter.
  await db.execute(sql`
    truncate table
      audit_events, client_link_views, client_links, deal_risk_flags,
      notifications, notification_rules, update_proposals, status_requests,
      sms_messages, email_attachments, email_messages,
      extraction_reviews, extractions, documents,
      deal_milestones, deal_dates, deal_parties, deals,
      milestone_template_steps, milestone_templates, risk_rules,
      consent_records, contacts, team_members, users, teams,
      external_refs, webhook_deliveries, jobs
    restart identity cascade
  `);
}

async function seedSystemCatalog() {
  const [template] = await db
    .insert(s.milestoneTemplates)
    .values({
      teamId: null, // system-owned, readable by every tenant
      name: PURCHASE_TEMPLATE_NAME,
      side: "buy",
      jurisdiction: "NV",
      version: 1,
      isDefault: true,
    })
    .returning();

  const steps = await db
    .insert(s.milestoneTemplateSteps)
    .values(
      PURCHASE_TEMPLATE_STEPS.map((step) => ({
        templateId: template.id,
        key: step.key,
        label: step.label,
        sortOrder: step.sortOrder,
        category: step.category,
        offsetDays: step.offsetDays ?? null,
        offsetBasis: step.offsetBasis,
        offsetDateKey: step.offsetDateKey ?? null,
        isDeadline: step.isDeadline,
        clientVisible: step.clientVisible,
        clientLabel: step.clientLabel,
        helpText: step.helpText ?? null,
      })),
    )
    .returning();

  await db.insert(s.riskRules).values([
    {
      teamId: null,
      key: "appraisal_not_ordered",
      label: "Appraisal not ordered close to the appraisal deadline",
      severity: "critical",
      params: { daysBefore: 7 },
    },
    {
      teamId: null,
      key: "loan_contingency_no_approval",
      label: "Loan contingency approaching without conditional approval",
      severity: "critical",
      params: { daysBefore: 7 },
    },
    {
      teamId: null,
      key: "emd_not_received",
      label: "Earnest money not confirmed after the EMD deadline",
      severity: "warn",
      params: { daysAfter: 1 },
    },
    {
      teamId: null,
      key: "stalled_no_activity",
      label: "No activity on the deal for several days",
      severity: "warn",
      params: { days: 5 },
    },
  ]);

  const stepIdByKey = new Map(steps.map((st) => [st.key as MilestoneKey, st.id]));
  return { templateId: template.id, stepIdByKey };
}

type DealSpec = {
  address: string;
  city: string;
  postalCode: string;
  priceCents: number;
  emdCents: number;
  acceptanceDaysAgo: number;
  escrowDays: number;
  mlsNumber: string;
  escrowNumber: string;
  stages: StageMap;
  client: { first: string; last: string; email: string; phone: string };
  lender: { first: string; last: string; company: string; email: string; phone: string };
  escrowOfficer: { first: string; last: string; company: string; email: string; phone: string };
  listingAgent: { first: string; last: string; company: string; email: string; phone: string };
};

async function seedDeal(args: {
  teamId: string;
  ownerUserId: string;
  templateId: string;
  stepIdByKey: Map<MilestoneKey, string>;
  spec: DealSpec;
}) {
  const { teamId, ownerUserId, stepIdByKey, spec } = args;
  const acceptance = addDays(today(), -spec.acceptanceDaysAgo) as IsoDate;
  const coe = addDays(acceptance, spec.escrowDays) as IsoDate;

  const [deal] = await db
    .insert(s.deals)
    .values({
      teamId,
      ownerUserId,
      side: "buy",
      status: "active",
      addressLine1: spec.address,
      city: spec.city,
      state: "NV",
      postalCode: spec.postalCode,
      county: "Clark",
      mlsNumber: spec.mlsNumber,
      purchasePriceCents: spec.priceCents,
      earnestMoneyCents: spec.emdCents,
      acceptanceDate: acceptance,
      closeOfEscrowDate: coe,
      contractForm: "nvar_rpa",
      escrowNumber: spec.escrowNumber,
      inboxLocalPart: `${spec.address
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")}-${randomBytes(2).toString("hex")}`,
      lastActivityAt: new Date(),
    })
    .returning();

  // --- contract dates -----------------------------------------------------
  // Anchors come off the contract itself; the rest are derived. The distinction
  // is stored, not cosmetic — the UI labels computed dates as computed.
  const dateRows: Array<{
    key: DealDateKey;
    value: IsoDate;
    source: "contract" | "computed";
  }> = [
    { key: "acceptance", value: acceptance, source: "contract" },
    { key: "coe", value: coe, source: "contract" },
    ...computeDeadlines({
      acceptanceDate: acceptance,
      closeOfEscrowDate: coe,
      rules: NVAR_RPA_RULES,
    }).map((d) => ({ key: d.key, value: d.value, source: "computed" as const })),
  ];

  await db.insert(s.dealDates).values(
    dateRows.map((d) => ({
      teamId,
      dealId: deal.id,
      key: d.key,
      value: d.value,
      source: d.source,
      documentId: null,
    })),
  );

  const dateMap = new Map(dateRows.map((d) => [d.key, d]));

  // --- milestones ---------------------------------------------------------
  const milestoneValues = PURCHASE_TEMPLATE_STEPS.map((step) => {
    let dueDate: IsoDate | null = null;
    let dueSource: "contract" | "computed" | null = null;

    if (step.offsetBasis === "acceptance") {
      dueDate = addDays(acceptance, step.offsetDays ?? 0);
      dueSource = "computed";
    } else if (step.offsetBasis === "coe") {
      dueDate = addDays(coe, step.offsetDays ?? 0);
      dueSource = "computed";
    } else if (step.offsetBasis === "date_key" && step.offsetDateKey) {
      const underlying = dateMap.get(step.offsetDateKey);
      dueDate = underlying?.value ?? null;
      dueSource = underlying?.source ?? null;
    }

    const status = spec.stages[step.key] ?? "pending";
    const completedAt =
      status === "done"
        ? new Date(`${dueDate ?? acceptance}T17:00:00Z`)
        : null;

    return {
      teamId,
      dealId: deal.id,
      templateStepId: stepIdByKey.get(step.key) ?? null,
      key: step.key,
      label: step.label,
      sortOrder: step.sortOrder,
      category: step.category,
      status,
      dueDate,
      dueDateSource: dueSource,
      isDeadline: step.isDeadline,
      completedAt,
      completedSource: status === "done" ? ("seed" as const) : null,
      clientVisible: step.clientVisible,
      clientLabel: step.clientLabel,
    };
  });

  await db.insert(s.dealMilestones).values(milestoneValues);

  // --- parties ------------------------------------------------------------
  const contactRows = await db
    .insert(s.contacts)
    .values([
      {
        teamId,
        kind: "client" as const,
        firstName: spec.client.first,
        lastName: spec.client.last,
        email: spec.client.email,
        phoneE164: spec.client.phone,
        timezone: "America/Los_Angeles",
      },
      {
        teamId,
        kind: "lender" as const,
        firstName: spec.lender.first,
        lastName: spec.lender.last,
        company: spec.lender.company,
        email: spec.lender.email,
        phoneE164: spec.lender.phone,
      },
      {
        teamId,
        kind: "escrow" as const,
        firstName: spec.escrowOfficer.first,
        lastName: spec.escrowOfficer.last,
        company: spec.escrowOfficer.company,
        email: spec.escrowOfficer.email,
        phoneE164: spec.escrowOfficer.phone,
      },
      {
        teamId,
        kind: "coagent" as const,
        firstName: spec.listingAgent.first,
        lastName: spec.listingAgent.last,
        company: spec.listingAgent.company,
        email: spec.listingAgent.email,
        phoneE164: spec.listingAgent.phone,
      },
    ])
    .returning();

  const [clientContact, lenderContact, escrowContact, coAgentContact] =
    contactRows;

  await db.insert(s.dealParties).values([
    {
      teamId,
      dealId: deal.id,
      contactId: clientContact.id,
      role: "buyer",
      side: "ours",
      isPrimary: true,
      notifyEmail: true,
      notifySms: true,
    },
    {
      teamId,
      dealId: deal.id,
      contactId: lenderContact.id,
      role: "loan_officer",
      side: "ours",
      notifyEmail: true,
      notifySms: true,
    },
    {
      teamId,
      dealId: deal.id,
      contactId: escrowContact.id,
      role: "escrow_officer",
      side: "ours",
      notifyEmail: true,
      notifySms: true,
    },
    {
      teamId,
      dealId: deal.id,
      contactId: coAgentContact.id,
      role: "listing_agent",
      side: "theirs",
      notifyEmail: true,
    },
  ]);

  // Consent: the client opted in on the web form; third parties were attested
  // to by the agent and have not yet confirmed by reply. Nothing may be texted
  // to a 'pending' number.
  await db.insert(s.consentRecords).values([
    {
      teamId,
      contactId: clientContact.id,
      channel: "sms",
      status: "opted_in",
      method: "web_form",
      proof: { text: "Buyer consented to transaction text updates at signing." },
    },
    {
      teamId,
      contactId: clientContact.id,
      channel: "email",
      status: "opted_in",
      method: "web_form",
    },
    {
      teamId,
      contactId: lenderContact.id,
      channel: "sms",
      status: "pending",
      method: "agent_attested",
      proof: { text: "Agent attested to an existing business relationship." },
    },
    {
      teamId,
      contactId: escrowContact.id,
      channel: "sms",
      status: "pending",
      method: "agent_attested",
      proof: { text: "Agent attested to an existing business relationship." },
    },
  ]);

  // --- client link --------------------------------------------------------
  const token = clientToken();
  await db.insert(s.clientLinks).values({
    teamId,
    dealId: deal.id,
    contactId: clientContact.id,
    tokenHash: token.hash,
    tokenPrefix: token.prefix,
    label: `${spec.client.first} ${spec.client.last}`,
    createdByUserId: ownerUserId,
    expiresAt: addDays(coe, 30) ? new Date(`${addDays(coe, 30)}T00:00:00Z`) : null,
  });

  // --- audit trail --------------------------------------------------------
  await db.insert(s.auditEvents).values([
    {
      teamId,
      dealId: deal.id,
      entityType: "deal",
      entityId: deal.id,
      action: "created",
      actorType: "user",
      actorUserId: ownerUserId,
      source: "seed",
      after: { addressLine1: spec.address, status: "active" },
    },
    ...milestoneValues
      .filter((m) => m.status === "done")
      .map((m) => ({
        teamId,
        dealId: deal.id,
        entityType: "deal_milestone",
        action: "status_changed",
        actorType: "user" as const,
        actorUserId: ownerUserId,
        source: "seed" as const,
        before: { status: "pending" },
        after: { status: "done", key: m.key },
      })),
  ]);

  return { deal, clientToken: token.raw, contacts: contactRows };
}

async function main() {
  console.log("Clearing existing data…");
  await clearAll();

  console.log("Seeding system catalog (template + risk rules)…");
  const { templateId, stepIdByKey } = await seedSystemCatalog();

  // ---------------------------------------------------------------- tenant 1
  const [rolandTeam] = await db
    .insert(s.teams)
    .values({
      name: "The Roland Team",
      slug: "roland-team",
      timezone: "America/Los_Angeles",
      plan: "pilot",
    })
    .returning();

  const teamUsers = await db
    .insert(s.users)
    .values([
      { email: "mike@therolandteam.com", name: "Mike Roland", phoneE164: "+17025550101" },
      { email: "dana@therolandteam.com", name: "Dana Whitfield", phoneE164: "+17025550102" },
      { email: "resty@therolandteam.com", name: "Resty Alvarez", phoneE164: "+17025550103" },
    ])
    .returning();

  const [mike, dana, resty] = teamUsers;

  await db.insert(s.teamMembers).values([
    { teamId: rolandTeam.id, userId: mike.id, role: "owner" },
    { teamId: rolandTeam.id, userId: dana.id, role: "agent" },
    { teamId: rolandTeam.id, userId: resty.id, role: "tc" },
  ]);

  await db.insert(s.notificationRules).values([
    {
      teamId: rolandTeam.id,
      eventKey: "milestone.changed",
      channel: "email",
      audience: "client",
      mode: "auto",
    },
    {
      teamId: rolandTeam.id,
      eventKey: "milestone.changed",
      channel: "sms",
      audience: "client",
      mode: "approve_first",
    },
  ]);

  const specs: DealSpec[] = [
    {
      // Stage 1: just under contract, earnest money in, nothing at risk yet.
      address: "1042 Quiet Harbor Ct",
      city: "Henderson",
      postalCode: "89052",
      priceCents: 68_500_000,
      emdCents: 1_000_000,
      acceptanceDaysAgo: 6,
      escrowDays: 30,
      mlsNumber: "2604118",
      escrowNumber: "ESC-24-10428",
      stages: { under_contract: "done", emd_received: "done" },
      client: {
        first: "Priya", last: "Raghavan",
        email: "priya.raghavan@example.com", phone: "+17025550311",
      },
      lender: {
        first: "Marcus", last: "Delgado", company: "Silver State Mortgage",
        email: "mdelgado@example.com", phone: "+17025550412",
      },
      escrowOfficer: {
        first: "Tanya", last: "Brooks", company: "Vegas Valley Escrow",
        email: "tbrooks@example.com", phone: "+17025550513",
      },
      listingAgent: {
        first: "Gregory", last: "Nunez", company: "Summit Peak Realty",
        email: "gnunez@example.com", phone: "+17025550614",
      },
    },
    {
      // Stage 2: mid-inspection, appraisal NOT ordered with the deadline close.
      // This is the deal the risk radar should scream about.
      address: "8817 Desert Bloom Ave",
      city: "Las Vegas",
      postalCode: "89178",
      priceCents: 43_200_000,
      emdCents: 500_000,
      acceptanceDaysAgo: 18,
      escrowDays: 30,
      mlsNumber: "2598773",
      escrowNumber: "ESC-24-10371",
      stages: {
        under_contract: "done",
        emd_received: "done",
        inspection_done: "done",
        repair_negotiation_done: "in_progress",
      },
      client: {
        first: "Andre", last: "Whitlock",
        email: "andre.whitlock@example.com", phone: "+17025550322",
      },
      lender: {
        first: "Serena", last: "Okafor", company: "Desert Ridge Lending",
        email: "sokafor@example.com", phone: "+17025550423",
      },
      escrowOfficer: {
        first: "Hal", last: "Petersen", company: "Cornerstone Title of Nevada",
        email: "hpetersen@example.com", phone: "+17025550524",
      },
      listingAgent: {
        first: "Bianca", last: "Ferrell", company: "Redrock Collective",
        email: "bferrell@example.com", phone: "+17025550625",
      },
    },
    {
      // Stage 3: clear to close, days from the finish line.
      address: "2295 Summit Ridge Dr",
      city: "Henderson",
      postalCode: "89012",
      priceCents: 115_000_000,
      emdCents: 2_500_000,
      acceptanceDaysAgo: 27,
      escrowDays: 30,
      mlsNumber: "2591204",
      escrowNumber: "ESC-24-10295",
      stages: {
        under_contract: "done",
        emd_received: "done",
        inspection_done: "done",
        repair_negotiation_done: "done",
        appraisal_ordered: "done",
        appraisal_received: "done",
        conditional_approval: "done",
        clear_to_close: "done",
      },
      client: {
        first: "Eleanor", last: "Vasquez",
        email: "eleanor.vasquez@example.com", phone: "+17025550333",
      },
      lender: {
        first: "Dmitri", last: "Larsen", company: "Anthem Home Loans",
        email: "dlarsen@example.com", phone: "+17025550434",
      },
      escrowOfficer: {
        first: "Rosa", last: "Ibarra", company: "Vegas Valley Escrow",
        email: "ribarra@example.com", phone: "+17025550535",
      },
      listingAgent: {
        first: "Curtis", last: "Mendel", company: "Lakeview Partners",
        email: "cmendel@example.com", phone: "+17025550636",
      },
    },
  ];

  const owners = [mike.id, dana.id, mike.id];
  const seeded = [];
  for (let i = 0; i < specs.length; i += 1) {
    console.log(`Seeding deal: ${specs[i].address}…`);
    seeded.push(
      await seedDeal({
        teamId: rolandTeam.id,
        ownerUserId: owners[i],
        templateId,
        stepIdByKey,
        spec: specs[i],
      }),
    );
  }

  // Risk flags on deal 2, matching what the Phase 6 cron will produce.
  const atRisk = seeded[1].deal;
  await db.insert(s.dealRiskFlags).values([
    {
      teamId: rolandTeam.id,
      dealId: atRisk.id,
      ruleKey: "appraisal_not_ordered",
      severity: "critical",
      message:
        "Appraisal still not ordered with the appraisal deadline 3 days out.",
    },
    {
      teamId: rolandTeam.id,
      dealId: atRisk.id,
      ruleKey: "loan_contingency_no_approval",
      severity: "critical",
      message:
        "Loan contingency expires in 3 days with no conditional approval on file.",
    },
  ]);
  await db
    .update(s.deals)
    .set({ riskScore: 82, riskLevel: "critical" })
    .where(sql`id = ${atRisk.id}`);

  await db
    .update(s.deals)
    .set({ riskScore: 12, riskLevel: "info" })
    .where(sql`id = ${seeded[0].deal.id}`);
  await db
    .update(s.deals)
    .set({ riskScore: 5, riskLevel: "info" })
    .where(sql`id = ${seeded[2].deal.id}`);

  // ---------------------------------------------------------------- tenant 2
  // Exists purely so tenant isolation can be *observed*, not trusted.
  const [otherTeam] = await db
    .insert(s.teams)
    .values({ name: "Sunbelt Realty Group", slug: "sunbelt-realty" })
    .returning();

  const [otherUser] = await db
    .insert(s.users)
    .values({ email: "owner@sunbeltrealty.example", name: "Jordan Pike" })
    .returning();

  await db
    .insert(s.teamMembers)
    .values({ teamId: otherTeam.id, userId: otherUser.id, role: "owner" });

  await seedDeal({
    teamId: otherTeam.id,
    ownerUserId: otherUser.id,
    templateId,
    stepIdByKey,
    spec: {
      address: "551 Palm Grove Ln",
      city: "Las Vegas",
      postalCode: "89107",
      priceCents: 39_900_000,
      emdCents: 400_000,
      acceptanceDaysAgo: 9,
      escrowDays: 30,
      mlsNumber: "2600551",
      escrowNumber: "ESC-24-99001",
      stages: { under_contract: "done" },
      client: {
        first: "Noel", last: "Kimura",
        email: "noel.kimura@example.com", phone: "+17025550999",
      },
      lender: {
        first: "Pat", last: "Rowley", company: "Mojave Funding",
        email: "prowley@example.com", phone: "+17025550998",
      },
      escrowOfficer: {
        first: "Iris", last: "Donnelly", company: "Sunstone Title",
        email: "idonnelly@example.com", phone: "+17025550997",
      },
      listingAgent: {
        first: "Wes", last: "Calderon", company: "Brightline Realty",
        email: "wcalderon@example.com", phone: "+17025550996",
      },
    },
  });

  console.log("\n=== Seed complete ===");
  console.log(`Roland Team id : ${rolandTeam.id}`);
  console.log(`Other team id  : ${otherTeam.id}`);
  console.log("\nClient deal links (Phase 3 renders these; tokens shown once):");
  seeded.forEach((r, i) => {
    console.log(`  ${specs[i].address}`);
    console.log(`    /c/${r.clientToken}`);
  });
  console.log("\nSign in locally as DEV_AUTH_EMAIL=mike@therolandteam.com");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
