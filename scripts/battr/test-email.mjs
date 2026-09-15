#!/usr/bin/env node
/**
 * Prove the email setup works, without waiting for a 7 PM run.
 *
 *   RESEND_API_KEY=... BATTR_TEST_EMAIL_TO=you@example.com node scripts/battr/test-email.mjs
 *
 * Sends two messages through the exact code path the audit uses:
 *
 *   1. a sample agent digest — what an agent will get
 *   2. a sample nightly report — what Mike will get
 *
 * Both are clearly marked as tests and built from invented leads, never from
 * the live database. Nothing is read from Follow Up Boss and no FUB key is
 * needed: this checks Resend, and only Resend.
 *
 * It also prints the configuration it is about to use, because the usual first
 * failure is not the code — it is an unverified sending domain or a from
 * address on the wrong one.
 */
import { sendMail, mailConfigured, fromAddress } from "./email.mjs";
import { renderDigestText, renderDigestHtml, digestSubject, ADMIN_MESSAGE } from "./alerts.mjs";

/** Invented leads. Nothing here touches the real database. */
const SAMPLE_DIGEST = {
  agentId: 0,
  agent: "Sample Agent",
  sweepDays: 13,
  unanswered: [
    { id: 1, name: "TEST — Dana Whitfield", waitingDays: 6, source: "Zillow Flex" },
  ],
  neglected: [
    { id: 2, name: "TEST — Marcus Ellery", daysSinceTouch: 15, source: "Ylopo Search" },
    { id: 3, name: "TEST — Priya Raman", daysSinceTouch: 14, source: "Realtor.com" },
  ],
  atRisk: [
    { id: 4, name: "TEST — Ben Ortiz", daysSinceTouch: 11, source: "Google LSA" },
  ],
  swept: [
    { id: 5, name: "TEST — Gone Already", daysSinceTouch: 16, source: "Facebook Ads" },
  ],
};

const SAMPLE_REPORT = `# Battr audit — TEST MESSAGE

This is a test of the email setup. No audit was run and no lead in this message
is real.

## Summary

- At Risk: **12** (4 new notes, 8 already flagged)
- Neglected: **6** (5 swept, 1 held back)
- Excluded: 41,203

## Agent scoreboard (worst first)

| Agent | Assigned | At risk | Neglected | Swept today |
| --- | ---: | ---: | ---: | ---: |
| Sample Agent | 84 | 7 | 3 | 3 |
| Another Agent | 61 | 5 | 3 | 2 |

## Inbound, never answered (1)

These leads called or texted us and nobody has called or texted back since.

| Lead | Owner | Days since they reached out | Source |
| --- | --- | ---: | --- |
| TEST — Dana Whitfield | Sample Agent | 6 | Zillow Flex |

---

If this arrived, Resend is configured correctly and the nightly report will
reach you the same way.`;

async function main() {
  const to = process.env.BATTR_TEST_EMAIL_TO || process.env.BATTR_REPORT_TO;

  console.log("Email configuration");
  console.log("-".repeat(64));
  console.log(`RESEND_API_KEY      ${mailConfigured() ? "present" : "*** NOT SET ***"}`);
  console.log(`from                ${fromAddress()}`);
  console.log(`BATTR_REPORT_TO     ${process.env.BATTR_REPORT_TO || "(not set — the nightly report will not be emailed)"}`);
  console.log(`sending this test to ${to || "(nowhere — set BATTR_TEST_EMAIL_TO)"}`);
  console.log("");

  if (!mailConfigured()) {
    throw new Error("RESEND_API_KEY is not set on the repository. Add it under Settings → Secrets and variables → Actions → Secrets.");
  }
  if (!to) {
    throw new Error("No recipient. Set BATTR_TEST_EMAIL_TO (or BATTR_REPORT_TO) and run again.");
  }

  console.log("1/2  sending the sample AGENT digest — this is what an agent receives...");
  await sendMail({
    to,
    subject: `[TEST] ${digestSubject(SAMPLE_DIGEST)}`,
    text: `THIS IS A TEST. No lead below is real.\n\n${renderDigestText(SAMPLE_DIGEST)}`,
    html: `<p style="background:#fff4d6;padding:8px 12px;border-radius:4px"><strong>This is a test.</strong> No lead below is real.</p>${renderDigestHtml(SAMPLE_DIGEST)}`,
  });
  console.log("     sent.");

  console.log("2/2  sending the sample NIGHTLY REPORT — this is what Mike receives...");
  await sendMail({ to, subject: "[TEST] Battr audit — nightly report", text: SAMPLE_REPORT });
  console.log("     sent.");

  console.log(`\nBoth messages went to ${to}. If they arrive, the setup is done.`);
  console.log(`They are addressed from ${fromAddress()} — check the spam folder before assuming a failure.\n`);
  console.log(`Admin line the agent digest leads with: "${ADMIN_MESSAGE}"`);
}

main().catch((err) => {
  console.error(`\nTest email failed: ${err.message}\n`);
  process.exit(1);
});
