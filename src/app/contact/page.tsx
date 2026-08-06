import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbSchema } from "@/lib/schema";
import { LeadForm } from "@/components/LeadForm";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact Roland Luxury",
  description:
    "Get in touch with Roland Luxury for luxury Las Vegas and Henderson real estate — buying, selling, or exploring guard-gated communities.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Contact", path: "/contact" },
        ])}
      />

      <Container size="wide" className="grid gap-12 py-16 md:grid-cols-2">
        <div>
          <div className="eyebrow">Contact</div>
          <h1 className="mt-2 font-serif text-[2.6rem] font-semibold">Let&apos;s find your place in Las Vegas</h1>
          <p className="mt-4 text-[1.1rem] text-[var(--color-ink-soft)]">
            Whether you&apos;re buying, selling, or just exploring, we&apos;d love to help. Send a note and a
            member of Roland Luxury will get back to you personally.
          </p>

          <div className="mt-8 space-y-4">
            <a href={`tel:${site.phone}`} className="flex items-center gap-4 rounded-[12px] border border-[var(--color-line)] bg-[var(--color-sand)] p-5 no-underline">
              <span className="eyebrow">Call</span>
              <span className="font-sans text-[1.15rem] font-semibold text-[var(--color-ink)]">{site.phone}</span>
            </a>
            <a href={`mailto:${site.email}`} className="flex items-center gap-4 rounded-[12px] border border-[var(--color-line)] bg-[var(--color-sand)] p-5 no-underline">
              <span className="eyebrow">Email</span>
              <span className="font-sans text-[1.05rem] font-semibold text-[var(--color-ink)]">{site.email}</span>
            </a>
          </div>
        </div>

        <div className="rounded-[14px] border border-[var(--color-line)] bg-white p-7 shadow-[var(--shadow-soft)]">
          <div className="mb-5 font-sans text-[1.1rem] font-semibold">Send us a message</div>
          <LeadForm type="General Inquiry" tag="Website Contact" source="Contact Page" submitLabel="Send Message" />
        </div>
      </Container>
    </>
  );
}
