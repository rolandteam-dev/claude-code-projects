import { NextResponse } from "next/server";
import { sendFubLead } from "@/lib/fub";
import { sendRebateEmail } from "@/lib/rebate/email";
import {
  priceRangeOptions,
  rebateOffer,
  rebateSourceForChannel,
  timelineOptions,
} from "@/content/newConstructionRebate";

export const runtime = "nodejs";

/**
 * New-construction rebate intake (rebate.therolandteam.com). Two things
 * happen, each best-effort and independently env-gated:
 *   1. Drop the lead into Follow Up Boss with the CHANNEL as its Source
 *      (YouTube unless the link carried ?s=), the "New Construction Rebate"
 *      tag, and a note with the timeline, price range, and which video or
 *      campaign the link came from.
 *   2. Email a confirmation with the terms link and the booking link.
 * Returns ok as long as the request was well-formed; the page then shows the
 * thank-you screen. A CRM or email failure is reported in the response, never
 * to the visitor.
 */
type Input = {
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  timeline?: string;
  priceRange?: string;
  consent?: boolean;
  company?: string; // honeypot
  channel?: string; // ?s=
  video?: string; // ?v=  YouTube video id
  ref?: string; // ?ref=
  page?: string; // full URL the form was on
};

const clean = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const VIDEO_ID = /^[A-Za-z0-9_-]{6,20}$/;

/** Only a value from the dropdown lands in the note; anything else is dropped. */
const pick = (v: string, options: string[]) => (options.includes(v) ? v : "");

export async function POST(req: Request) {
  let d: Input;
  try {
    d = (await req.json()) as Input;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }

  // Bots fill the hidden field; people never see it. Pretend it worked.
  if (clean(d.company, 200)) return NextResponse.json({ ok: true, crm: false, email: false });

  let firstName = clean(d.firstName, 80);
  let lastName = clean(d.lastName, 80);
  if (!firstName) {
    const words = clean(d.name, 160).split(/\s+/).filter(Boolean);
    firstName = words[0] ?? "";
    lastName = lastName || words.slice(1).join(" ");
  }
  const email = clean(d.email, 200).toLowerCase();
  const phone = clean(d.phone, 40);
  const timeline = pick(clean(d.timeline, 40), timelineOptions);
  const priceRange = pick(clean(d.priceRange, 40), priceRangeOptions);

  if (!firstName) return NextResponse.json({ ok: false, error: "A name is required." }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ ok: false, error: "A valid email is required." }, { status: 400 });
  }
  if (phone.replace(/\D/g, "").length < 10) {
    return NextResponse.json({ ok: false, error: "A phone number is required." }, { status: 400 });
  }
  if (d.consent !== true) {
    return NextResponse.json({ ok: false, error: "Consent is required." }, { status: 400 });
  }

  const source = rebateSourceForChannel(clean(d.channel, 40));
  const video = clean(d.video, 20);
  const ref = clean(d.ref, 120);
  const page = clean(d.page, 300);

  const note = [
    `Requested the ${rebateOffer.programName} (${rebateOffer.pricePercent}% of base price, capped at ${rebateOffer.commissionCapPercent}% of builder commission).`,
    "NEXT STEP: call to book the consult and get the buyer agreement signed BEFORE they visit a builder.",
    timeline ? `Timeline: ${timeline}` : "",
    priceRange ? `Price range: ${priceRange}` : "",
    `Channel: ${source}`,
    video && VIDEO_ID.test(video) ? `From video: https://youtu.be/${video}` : "",
    ref ? `Ref: ${ref}` : "",
    page ? `Page: ${page}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const crm = await sendFubLead({
    firstName,
    lastName: lastName || undefined,
    email,
    phone,
    type: "Registration",
    source,
    tags: [rebateOffer.fubTag, "New Construction", "Buyer Lead", source],
    message: note,
  });

  const mail = await sendRebateEmail({ email, firstName });

  return NextResponse.json({
    ok: true,
    crm: crm.sent,
    email: mail.sent,
    ...(crm.sent ? {} : { crmReason: crm.reason }),
    ...(mail.sent ? {} : { emailReason: mail.reason }),
  });
}
