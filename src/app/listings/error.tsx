"use client";

import Link from "next/link";
import { Container } from "@/components/Container";

/**
 * Error boundary for the listings section. If a page throws (e.g. the live
 * feed is unreachable), the user still gets a clean, on-brand recovery screen
 * instead of a blank 500.
 */
export default function ListingsError({ reset }: { error: Error; reset: () => void }) {
  return (
    <Container size="wide" className="py-20 text-center">
      <div className="eyebrow">Homes for Sale</div>
      <h1 className="mt-2 text-[2rem]">We couldn&apos;t load listings just now</h1>
      <p className="mx-auto mt-3 max-w-[520px] text-[var(--color-ink-soft)]">
        Our live MLS feed hiccuped. Please try again in a moment — or reach out and we&apos;ll send you matching
        homes directly.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <button type="button" onClick={() => reset()} className="btn">Try again</button>
        <Link href="/contact" className="btn btn-ghost">Contact the team</Link>
      </div>
    </Container>
  );
}
