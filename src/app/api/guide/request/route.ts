import { NextResponse } from "next/server";
import { sendFubLead } from "@/lib/fub";
import { sendGuideEmail } from "@/lib/guides/email";
import { sourceForChannel } from "@/content/relocationGuides";

export const runtime = "nodejs";

/**
 * Guide request intake (guide.therolandteam.com). Two things happen, each
 * best-effort and independently env-gated so one missing key never blocks
 * the guides:
 *   1. Drop the lead into Follow Up Boss with the CHANNEL as its Source
 *      (YouTube unless the link carried ?s=), a "Relocation Guide" tag, and a
 *      note saying which video or campaign the link came from.
 *   2. Email the guide links so they can be found again later.
 * Returns ok as long as the request was well-formed; the page then opens both
 * guides. A CRM or email failure is reported in the response, never to the
 * visitor.
 */
type Input = {
  firstName?: string;
  email?: string;
  phone?: string;
  consent?: boolean;
  company?: string; // honeypot
  channel?: string; // ?s=
  video?: string; // ?v=  YouTube video id
  ref?: string; // ?ref=
  page?: string; // full URL the form was on
};

const clean = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const VIDEO_ID = /^[A-Za-z0-9_-]{6,20}$/;

export async function POST(req: Request) {
  let d: Input;
  try {
    d = (await req.json()) as Input;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }

  // Bots fill the hidden field; people never see it. Pretend it worked.
  if (clean(d.company, 200)) return NextResponse.json({ ok: true, crm: false, email: false });

  const firstName = clean(d.firstName, 80);
  const email = clean(d.email, 200).toLowerCase();
  const phone = clean(d.phone, 40);
  if (!firstName) return NextResponse.json({ ok: false, error: "A first name is required." }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ ok: false, error: "A valid email is required." }, { status: 400 });
  }
  if (d.consent !== true) {
    return NextResponse.json({ ok: false, error: "Consent is required." }, { status: 400 });
  }

  const source = sourceForChannel(clean(d.channel, 40));
  const video = clean(d.video, 20);
  const ref = clean(d.ref, 120);
  const page = clean(d.page, 300);

  const note = [
    "Requested the free relocation guides (Las Vegas Relocation Starter Kit + The Locals' Las Vegas).",
    `Channel: ${source}`,
    video && VIDEO_ID.test(video) ? `From video: https://youtu.be/${video}` : "",
    ref ? `Ref: ${ref}` : "",
    page ? `Page: ${page}` : "",
    phone ? "" : "No phone given.",
  ]
    .filter(Boolean)
    .join("\n");

  const crm = await sendFubLead({
    firstName,
    email,
    phone: phone || undefined,
    type: "Registration",
    source,
    tags: ["Relocation Guide", source],
    message: note,
  });

  const mail = await sendGuideEmail({ email, firstName });

  return NextResponse.json({
    ok: true,
    crm: crm.sent,
    email: mail.sent,
    ...(crm.sent ? {} : { crmReason: crm.reason }),
    ...(mail.sent ? {} : { emailReason: mail.reason }),
  });
}
