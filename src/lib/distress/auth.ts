/** Shared auth for Seller Engine routes: ADMIN_TOKEN (?key=) or CRON_SECRET. */
export function distressAuth(req: Request, opts: { allowCron: boolean }): { ok: boolean; admin: boolean } {
  const params = new URL(req.url).searchParams;
  const admin = process.env.ADMIN_TOKEN;
  if (admin && params.get("key") === admin) return { ok: true, admin: true };
  const cron = process.env.CRON_SECRET;
  if (opts.allowCron && cron) {
    if (req.headers.get("authorization") === `Bearer ${cron}`) return { ok: true, admin: false };
    if (params.get("secret") === cron) return { ok: true, admin: false };
  }
  return { ok: false, admin: false };
}
