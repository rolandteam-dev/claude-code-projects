"use client";

import Image from "next/image";
import { useState } from "react";
import { usePortal } from "@/lib/portal/store";
import { trackPortal } from "@/lib/portal/track";
import { homeownerBrand } from "@/lib/homeowners/brand";
import { Card, fieldClass, labelClass } from "./ui";

/**
 * Direct line to the team, with the message routed into the CRM as portal
 * activity rather than an anonymous contact-form submission.
 */
export function AgentCard() {
  const { state } = usePortal();
  const [sent, setSent] = useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const message = String(fd.get("message") ?? "").trim();
    if (!message) return;
    trackPortal("portal.message", message.slice(0, 400), { always: true });
    setSent(true);
  }

  return (
    <Card>
      <div className="flex items-center gap-4">
        {homeownerBrand.founderPhoto ? (
          <Image
            src={homeownerBrand.founderPhoto}
            alt={homeownerBrand.founder}
            width={60}
            height={60}
            className="h-[60px] w-[60px] rounded-full object-cover"
          />
        ) : (
          <div className="flex h-[60px] w-[60px] items-center justify-center rounded-full bg-[var(--color-graphite)] font-serif text-[1.3rem] text-[var(--color-gold-3)]">
            MR
          </div>
        )}
        <div>
          <div className="font-sans text-[1rem] font-semibold text-[var(--color-ink)]">{homeownerBrand.founder}</div>
          <div className="font-sans text-[0.8rem] text-[var(--color-muted)]">{homeownerBrand.name}</div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <a href={`tel:${homeownerBrand.phone}`} className="btn btn-ghost !px-5 !py-2.5">
          {homeownerBrand.phone}
        </a>
        <a href={`mailto:${homeownerBrand.email}`} className="btn btn-ghost !px-5 !py-2.5">
          Email
        </a>
      </div>

      {sent ? (
        <div className="mt-5 rounded-md bg-[var(--color-sand)] px-4 py-3 font-sans text-[0.86rem] text-[var(--color-ink-soft)]">
          Message sent{state.profile?.firstName ? `, ${state.profile.firstName}` : ""}. We&apos;ll come back to you
          shortly — call {homeownerBrand.phone} if it&apos;s urgent.
        </div>
      ) : (
        <form className="mt-5" onSubmit={onSubmit}>
          <label className="block">
            <span className={labelClass}>Ask a question</span>
            <textarea
              className={`${fieldClass} mt-1 text-[0.9rem]`}
              name="message"
              rows={3}
              placeholder="What should I expect for closing costs on the Henderson house?"
              required
            />
          </label>
          <button type="submit" className="btn mt-3 w-full !py-3">
            Send to my agent
          </button>
        </form>
      )}
    </Card>
  );
}
