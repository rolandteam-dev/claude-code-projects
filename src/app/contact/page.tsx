import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact The Roland Team",
  description:
    "Get in touch with The Roland Team for luxury Las Vegas and Henderson real estate — buying, selling, or exploring guard-gated communities.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <Container size="narrow" className="py-16">
      <div className="eyebrow">Contact</div>
      <h1 className="mt-2 text-[2.3rem]">Let&apos;s find your place in Las Vegas</h1>
      <p className="mt-4 text-[1.1rem] text-[var(--color-ink-soft)]">
        Whether you&apos;re buying, selling, or just exploring, we&apos;d love to help. Reach out and a member
        of The Roland Team will get back to you personally.
      </p>

      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        <a href={`tel:${site.phone}`} className="rounded-[12px] border border-[var(--color-line)] bg-[var(--color-sand)] p-7 no-underline">
          <div className="eyebrow">Call</div>
          <div className="mt-2 font-sans text-[1.3rem] font-semibold text-[var(--color-ink)]">{site.phone}</div>
        </a>
        <a href={`mailto:${site.email}`} className="rounded-[12px] border border-[var(--color-line)] bg-[var(--color-sand)] p-7 no-underline">
          <div className="eyebrow">Email</div>
          <div className="mt-2 font-sans text-[1.15rem] font-semibold text-[var(--color-ink)]">{site.email}</div>
        </a>
      </div>

      <p className="mt-10 text-[0.85rem] text-[var(--color-muted)]">
        A full contact form with lead routing will be wired in once the CRM/IDX integration is selected.
      </p>
    </Container>
  );
}
