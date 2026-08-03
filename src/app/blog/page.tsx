import type { Metadata } from "next";
import { Container } from "@/components/Container";

export const metadata: Metadata = {
  title: "Las Vegas Real Estate Blog",
  description:
    "Market updates, neighborhood spotlights, and buyer & seller insights for Las Vegas and Henderson real estate from The Roland Team.",
  alternates: { canonical: "/blog" },
};

export default function BlogIndex() {
  return (
    <Container size="wide" className="py-16">
      <div className="eyebrow">Blog</div>
      <h1 className="mt-2 text-[2.4rem]">Las Vegas real estate insights</h1>
      <p className="mt-4 max-w-[640px] text-[var(--color-ink-soft)]">
        Fresh market updates, neighborhood spotlights, and practical advice for buyers and sellers. New posts
        publish regularly — this feed will fill in as our content engine ships.
      </p>

      <div className="mt-12 rounded-[12px] border border-dashed border-[var(--color-line)] bg-[var(--color-sand)] p-10 text-center">
        <p className="font-sans text-[0.95rem] text-[var(--color-muted)]">
          Blog posts (MDX) will render here. The daily draft pipeline can publish directly into this feed.
        </p>
      </div>
    </Container>
  );
}
