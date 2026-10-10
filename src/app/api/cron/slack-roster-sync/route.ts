import { NextResponse } from "next/server";
import { syncRoster, type SlackMember } from "@/lib/team/roster";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Monthly Slack roster sync. Reads the workspace member list from Slack and
 * upserts it into the team_members table, so the Referral Watch's former-
 * teammate list stays current as people join (Active) and leave (Deactivated) —
 * no manual CSV re-upload.
 *
 * Needs SLACK_BOT_TOKEN (a bot token with the `users:read` scope). The run
 * no-ops if it isn't set. `&dryRun=1` fetches + reports counts without writing.
 *
 * Auth: CRON_SECRET (Vercel Cron / `?secret=`) or ADMIN_TOKEN (`?key=`).
 */
function auth(req: Request): boolean {
  const params = new URL(req.url).searchParams;
  const cron = process.env.CRON_SECRET;
  const admin = process.env.ADMIN_TOKEN;
  if (admin && params.get("key") === admin) return true;
  if (cron) {
    if (req.headers.get("authorization") === `Bearer ${cron}`) return true;
    if (params.get("secret") === cron) return true;
  }
  return false;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
async function fetchSlackMembers(token: string): Promise<SlackMember[]> {
  const out: SlackMember[] = [];
  let cursor = "";
  for (let page = 0; page < 20; page++) {
    const u = new URL("https://slack.com/api/users.list");
    u.searchParams.set("limit", "200");
    if (cursor) u.searchParams.set("cursor", cursor);
    const res = await fetch(u.toString(), { headers: { Authorization: `Bearer ${token}` } });
    const data: any = await res.json();
    if (!data?.ok) throw new Error(String(data?.error ?? `slack ${res.status}`));
    for (const m of data.members ?? []) {
      const name = String(
        m.profile?.real_name_normalized || m.profile?.real_name || m.real_name || m.name || "",
      ).trim();
      out.push({
        id: String(m.id),
        name,
        status: m.deleted ? "Deactivated" : "Active",
        isBot: !!m.is_bot || m.id === "USLACKBOT",
      });
    }
    cursor = data.response_metadata?.next_cursor || "";
    if (!cursor) break;
  }
  return out;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export async function GET(req: Request) {
  if (!auth(req)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) {
    return NextResponse.json({ ok: true, skipped: "SLACK_BOT_TOKEN not set" });
  }

  const dryRun = new URL(req.url).searchParams.get("dryRun") === "1";

  let members: SlackMember[];
  try {
    members = await fetchSlackMembers(token);
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 502 });
  }

  const counts = {
    total: members.length,
    deactivated: members.filter((m) => m.status === "Deactivated" && !m.isBot).length,
    active: members.filter((m) => m.status === "Active" && !m.isBot).length,
    bots: members.filter((m) => m.isBot).length,
  };

  if (!dryRun) await syncRoster(members);

  return NextResponse.json({ ok: true, mode: dryRun ? "dry-run" : "synced", ...counts });
}
