/**
 * The two nightly emails, laid out the way Battr lays out its own.
 *
 * Battr sends one message per compliance stage — "🥣 Success - 8 At Risk
 * records processed from ⭐️ Team Leads (Nudges & Sweeps)" and its Neglected
 * twin — each with a six-line summary and one row per lead, linked to the lead
 * in Follow Up Boss. Mike reads those. He did not read our single markdown
 * report the same way, so these copy Battr's headings, summary wording, column
 * order and status phrases as closely as the data allows (templates read off
 * the 26 Sep 2026 emails).
 *
 * Where we differ, it is on purpose and visible:
 *   - A dry run says so in the subject and in a banner. "Note created in FUB"
 *     on a night nothing was written would be a lie in exactly the place a
 *     reader trusts.
 *   - A lead we would have acted on but held tonight names why, instead of
 *     being silently left off the list.
 *
 * Pure functions: rows in, { subject, html, text } out. Nothing here reads
 * Follow Up Boss or sends anything, so every phrase is testable.
 */

export const TEAM_NAME = "The Roland Team";
export const AUDIT_LIST = "⭐️ Team Leads (Nudges & Sweeps)";

// Battr's own status phrases, verbatim.
export const NOTE_CREATED = "Note created in FUB";
export const ALREADY_TAKEN = "Action already taken in previous audit";
export const SWEPT = "Successfully swept to pond";

const CELL = "padding: 8px; border: 1px solid #dee2e6;";
const HEAD = `${CELL} text-align: left;`;

export function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function fubPersonUrl(id, subdomain = process.env.FUB_ACCOUNT_SUBDOMAIN || "therolandteam1") {
  return `https://${subdomain}.followupboss.com/2/people/view/${encodeURIComponent(id)}`;
}

/** "2026-09-21" (or any parseable date) → "9/21/2026", Battr's Neglected-table format. */
export function usDate(value) {
  if (!value) return "None";
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value));
  if (m) return `${Number(m[2])}/${Number(m[3])}/${m[1]}`;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()}/${d.getUTCFullYear()}`;
}

/** "2026-09-21T…" → "2026-09-21", Battr's At Risk-table format. */
export function isoDay(value) {
  if (!value) return "None";
  const m = /^(\d{4}-\d{2}-\d{2})/.exec(String(value));
  return m ? m[1] : String(value);
}

/**
 * One row per at-risk lead, new ones first — the order Battr uses, and the
 * bold rows are the ones that changed tonight.
 *
 * @param {object} p
 * @param {object[]} p.atRisk           every lead classified at risk
 * @param {object[]} p.nudged           leads that got (or in a dry run would have got) a note
 * @param {(id: number) => string|null} p.stampOf  the lead's At Risk Since stamp, if any
 * @param {boolean} p.dry
 * @param {boolean} p.held              nudges did not run tonight at all
 */
export function atRiskRows({ atRisk, nudged, stampOf, dry, held }) {
  const nudgedIds = new Set(nudged.map((l) => l.id));
  const rows = atRisk.map((lead) => {
    const stamp = stampOf(lead.id) || null;
    let action;
    let isNew = false;
    if (stamp) {
      action = ALREADY_TAKEN;
    } else if (nudgedIds.has(lead.id)) {
      isNew = true;
      action = dry ? "Note would be created in FUB (dry run)" : NOTE_CREATED;
    } else if (held) {
      isNew = true;
      action = "Note not created — nudges held tonight (see above)";
    } else {
      isNew = true;
      action = "Note not created — the write failed (see the run log)";
    }
    return {
      name: lead.name,
      owner: lead.owner ?? "",
      source: lead.source ?? "",
      id: lead.id,
      status: "At Risk",
      previousStatus: stamp ? "At Risk" : "compliant",
      atRiskSince: stamp ? isoDay(stamp) : "None",
      action,
      isNew,
    };
  });
  // New first; within each group, oldest stamp first, then worst-neglected.
  return rows.sort(
    (a, b) =>
      Number(b.isNew) - Number(a.isNew) ||
      String(a.atRiskSince).localeCompare(String(b.atRiskSince)) ||
      String(a.owner).localeCompare(String(b.owner))
  );
}

/**
 * One row per neglected lead with where it went — or, when it stayed, why.
 *
 * @param {object} p
 * @param {object[]} p.neglected
 * @param {object[]} p.swept      sweep records ({ personId, pondName, atRiskSince })
 * @param {object[]} p.heldBack   leads with a holdReason
 * @param {(lead: object) => string} p.pondOf   the pond this lead routes to
 * @param {(id: number) => string|null} p.stampOf
 * @param {boolean} p.dry
 * @param {boolean} p.held        sweeps did not run tonight at all
 */
export function neglectedRows({ neglected, swept, heldBack, pondOf, stampOf, dry, held }) {
  const sweptById = new Map(swept.map((s) => [s.personId, s]));
  const heldById = new Map(heldBack.map((h) => [h.id, h]));
  const rows = neglected.map((lead) => {
    const record = sweptById.get(lead.id);
    const hold = heldById.get(lead.id);
    let status;
    let moved = false;
    if (record) {
      moved = true;
      status = dry ? "Would be swept to pond (dry run)" : SWEPT;
    } else if (hold) {
      status = `Not moved — ${hold.holdReason}`;
    } else if (held) {
      status = "Not moved — sweeps held tonight (see above)";
    } else {
      status = "Not moved";
    }
    return {
      name: lead.name,
      owner: lead.owner ?? "",
      source: lead.source ?? "",
      id: lead.id,
      targetType: "Pond",
      targetName: record?.pondName ?? pondOf(lead) ?? "",
      atRiskSince: usDate(record?.atRiskSince ?? stampOf(lead.id)),
      status,
      moved,
    };
  });
  return rows.sort((a, b) => Number(b.moved) - Number(a.moved) || String(a.owner).localeCompare(String(b.owner)));
}

function header({ stage, dry, banner }) {
  const html = [];
  const text = [];
  if (dry) {
    html.push(
      `<p style="padding: 10px 12px; background: #fff3cd; border: 1px solid #ffe69c; border-radius: 4px;">` +
        `<strong>🧪 Dry run — nothing was written to Follow Up Boss.</strong> Every row below shows what the live system would do.</p>`
    );
    text.push("🧪 DRY RUN — NOTHING WAS WRITTEN TO FOLLOW UP BOSS", "");
  }
  if (banner) {
    html.push(
      `<p style="padding: 10px 12px; background: #f8d7da; border: 1px solid #f1aeb5; border-radius: 4px;">` +
        `<strong>Held tonight:</strong> ${escapeHtml(banner)}</p>`
    );
    text.push(`HELD TONIGHT: ${banner}`, "");
  }
  html.push(
    `<h2>✅ Success! We've processed your audit</h2>`,
    `<p><strong>Team Name:</strong> ${escapeHtml(TEAM_NAME)}</p>`,
    `<p><strong>Audit List:</strong> ${escapeHtml(AUDIT_LIST)}</p>`,
    `<p><strong>Compliance Status:</strong> ${escapeHtml(stage)}</p>`,
    `<hr>`
  );
  text.push(
    "✅ SUCCESS! WE'VE PROCESSED YOUR AUDIT",
    "",
    `Team Name: ${TEAM_NAME}`,
    "",
    `Audit List: ${AUDIT_LIST}`,
    "",
    `Compliance Status: ${stage}`,
    "",
    "----------------------------------------",
    ""
  );
  return { html, text };
}

function summary(items) {
  const html = [`<h3>Summary of Records</h3>`, `<ul>`];
  const text = ["SUMMARY OF RECORDS", ""];
  for (const [label, value] of items) {
    html.push(`<li><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}</li>`);
    text.push(` * ${label}: ${value}`);
  }
  html.push(`</ul>`, `<hr>`);
  text.push("", "----------------------------------------", "");
  return { html, text };
}

function table(columns, rows, { bold = () => false, cells, limit }) {
  const shown = rows.slice(0, limit);
  const title = `Records to be Processed (showing first ${shown.length} of ${rows.length})`;
  const html = [
    `<h3>${title}</h3>`,
    `<table style="width: 100%; border-collapse: collapse; margin: 20px 0;">`,
    `<thead><tr style="background-color: #f8f9fa;">`,
    ...columns.map((c) => `<th style="${HEAD}">${escapeHtml(c)}</th>`),
    `</tr></thead>`,
    `<tbody>`,
  ];
  const text = [title.toUpperCase(), "", columns.join(" | ")];
  for (const row of shown) {
    const values = cells(row);
    html.push(`<tr style="${bold(row) ? "font-weight: bold;" : ""}">`);
    values.forEach((v, i) => {
      const inner = columns[i] === "FUB ID"
        ? `<a href="${escapeHtml(fubPersonUrl(row.id))}" target="_blank">${escapeHtml(v)}</a>`
        : escapeHtml(v);
      html.push(`<td style="${CELL}">${inner}</td>`);
    });
    html.push(`</tr>`);
    text.push(values.map((v, i) => (columns[i] === "FUB ID" ? `${v} ${fubPersonUrl(row.id)}` : v)).join(" | "));
  }
  html.push(`</tbody>`, `</table>`);
  return { html, text };
}

function wrap(parts, footer) {
  const html = [
    `<div style="font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; font-size: 14px; color: #212529; max-width: 1100px;">`,
    ...parts.flatMap((p) => p.html),
    footer ? `<p style="color: #6c757d; font-size: 12px;">${escapeHtml(footer)}</p>` : "",
    `</div>`,
  ].join("\n");
  const text = [...parts.flatMap((p) => p.text), "", footer ?? ""].join("\n").trim() + "\n";
  return { html, text };
}

function subjectFor({ count, stage, dry }) {
  return `${dry ? "🧪 Dry run - " : "🥣 Success - "}${count} ${stage} records processed from ${AUDIT_LIST}`;
}

/**
 * @param {object} p
 * @param {number} p.audited
 * @param {object[]} p.rows          from atRiskRows
 * @param {{bucket: number, group: number}} p.excluded
 * @param {boolean} p.dry
 * @param {string} [p.heldReason]    why nudges did not run tonight
 * @param {string} [p.footer]
 * @param {number} [p.limit]
 */
export function renderAtRiskEmail({ audited, rows, excluded, dry, heldReason = "", footer = "", limit = 250 }) {
  const already = rows.filter((r) => r.action === ALREADY_TAKEN).length;
  const created = rows.filter((r) => r.action === NOTE_CREATED || /would be created/.test(r.action)).length;
  const newCount = rows.filter((r) => r.isNew).length;
  const parts = [
    header({ stage: "At Risk", dry, banner: heldReason }),
    summary([
      ["Total records in audit", audited],
      ["At Risk records", rows.length],
      ["Already processed in previous audit", already],
      [dry ? "New notes that would be created" : "New notes created", created],
      ...(created < newCount ? [["New notes held back", newCount - created]] : []),
      ["Excluded due to lead bucket", excluded.bucket],
      ["Excluded due to agent group", excluded.group],
    ]),
    table(
      ["Name", "Owner", "Source", "FUB ID", "Status", "Previous Status", "At Risk Since", "Action Status"],
      rows,
      {
        limit,
        bold: (r) => r.isNew,
        cells: (r) => [r.name, r.owner, r.source, r.id, r.status, r.previousStatus, r.atRiskSince, r.action],
      }
    ),
  ];
  return { subject: subjectFor({ count: newCount, stage: "At Risk", dry }), ...wrap(parts, footer) };
}

/**
 * @param {object} p
 * @param {number} p.audited
 * @param {object[]} p.rows          from neglectedRows
 * @param {{bucket: number, group: number}} p.excluded
 * @param {boolean} p.dry
 * @param {string} [p.heldReason]    why sweeps did not run tonight
 * @param {string} [p.footer]
 * @param {number} [p.limit]
 */
export function renderNeglectedEmail({ audited, rows, excluded, dry, heldReason = "", footer = "", limit = 250 }) {
  const moved = rows.filter((r) => r.moved).length;
  const parts = [
    header({ stage: "Neglected", dry, banner: heldReason }),
    summary([
      ["Total records in audit", audited],
      ["Neglected records", rows.length],
      [dry ? "Records that would be moved" : "Records moved", moved],
      ["Records not moved", rows.length - moved],
      ["Excluded due to lead bucket", excluded.bucket],
      ["Excluded due to agent group", excluded.group],
    ]),
    table(
      ["Name", "Owner", "Source", "FUB ID", "Assignment Target Type", "Assignment Target Name", "At Risk Since", "Status"],
      rows,
      {
        limit,
        bold: (r) => r.moved,
        cells: (r) => [r.name, r.owner, r.source, r.id, r.targetType, r.targetName, r.atRiskSince, r.status],
      }
    ),
  ];
  return { subject: subjectFor({ count: rows.length, stage: "Neglected", dry }), ...wrap(parts, footer) };
}

/**
 * Battr's two exclusion lines, counted from the audit list's own exclusions:
 * a source Battr's lead-bucket filter drops, and an agent its group filter drops.
 */
export function exclusionCounts(results) {
  let bucket = 0;
  let group = 0;
  for (const r of results) {
    if (r.status !== "excluded") continue;
    const reason = String(r.reason ?? "");
    if (/source/i.test(reason)) bucket++;
    else if (/agent|paused/i.test(reason)) group++;
  }
  return { bucket, group };
}
