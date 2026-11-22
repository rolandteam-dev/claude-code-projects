/**
 * Offer Machine — who is who, straight from Slack. No roster file to maintain and
 * nothing committed to this public repo: the speaker's name and the list of team
 * names both come from the workspace itself (scope: users:read).
 */
import { slackGet } from "./slack";

const TTL_MS = 10 * 60 * 1000;

const nameCache = new Map<string, { name: string; at: number }>();

/** The Slack user's real name, or null if Slack can't say. */
export async function slackUserName(userId: string): Promise<string | null> {
  const hit = nameCache.get(userId);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.name;
  const res = await slackGet("users.info", { user: userId });
  if (!res.ok) return null;
  const user = (res.user ?? {}) as { real_name?: string; profile?: { real_name_normalized?: string; real_name?: string } };
  const name = (user.profile?.real_name_normalized || user.profile?.real_name || user.real_name || "").trim();
  if (!name) return null;
  nameCache.set(userId, { name, at: Date.now() });
  return name;
}

let members: { names: string[]; at: number } | null = null;

/** Active, non-bot workspace members' names, for matching a typed agent name. Empty if Slack can't say. */
export async function teamMemberNames(): Promise<string[]> {
  if (members && Date.now() - members.at < TTL_MS) return members.names;
  const names: string[] = [];
  let cursor = "";
  for (let page = 0; page < 5; page++) {
    const res = await slackGet("users.list", { limit: "200", ...(cursor ? { cursor } : {}) });
    if (!res.ok) return members?.names ?? [];
    for (const m of (res.members ?? []) as Array<{
      deleted?: boolean;
      is_bot?: boolean;
      id?: string;
      real_name?: string;
      profile?: { real_name_normalized?: string; real_name?: string };
    }>) {
      if (m.deleted || m.is_bot || m.id === "USLACKBOT") continue;
      const n = (m.profile?.real_name_normalized || m.profile?.real_name || m.real_name || "").trim();
      if (n) names.push(n);
    }
    cursor = ((res.response_metadata ?? {}) as { next_cursor?: string }).next_cursor || "";
    if (!cursor) break;
  }
  members = { names, at: Date.now() };
  return names;
}
