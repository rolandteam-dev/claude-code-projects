/**
 * The last look before a lead leaves its agent.
 *
 * The audit reads its evidence once, at the start of a run, and a run takes
 * minutes. In that gap an agent can text, call or be reassigned the lead, and a
 * sweep decided on the stale picture takes the lead off the person who just
 * worked it. So immediately before each write the lead is read again, and the
 * sweep goes ahead only if nothing at all has changed.
 *
 * Fail closed: any lead that cannot be re-read, or shows ANY activity in the
 * window (outbound or inbound), is held. The cost of a wrong hold is one more
 * night in the agent's queue; the cost of a wrong sweep is a lead.
 */
export async function lastSecondRecheck(fub, lead, sinceIso) {
  try {
    const person = await fub.person(lead.id);
    const ownerNow = person?.assignedUserId ?? null;
    if (ownerNow !== (lead.ownerId ?? null)) {
      return { ok: false, reason: "owner changed since the audit read it" };
    }
    const [texts, calls] = await Promise.all([fub.textsForPerson(lead.id, sinceIso), fub.callsForPerson(lead.id, sinceIso)]);
    if (texts.length) return { ok: false, reason: `text on the thread inside the window (${texts.length}) — re-read just before sweeping` };
    if (calls.length) return { ok: false, reason: `call inside the window (${calls.length}) — re-read just before sweeping` };
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: `could not re-check before sweeping (${err.message})` };
  }
}
