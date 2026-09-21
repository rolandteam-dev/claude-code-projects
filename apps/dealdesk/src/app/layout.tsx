import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { env } from "@/lib/env";
import "./globals.css";

export const metadata: Metadata = {
  title: "DealDesk — contract to close, without the chasing",
  description:
    "Collect status from lenders, escrow and the other agent, and keep every client updated automatically.",
  // Internal tooling: never index, in any environment.
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tree = (
    <html lang="en">
      <body>{children}</body>
    </html>
  );

  // Importing ClerkProvider is harmless; *rendering* it without keys throws.
  // So it is mounted only when configured, which is what lets the app run
  // locally against the dev auth bypass with no Clerk account.
  return env.clerk.configured() ? <ClerkProvider>{tree}</ClerkProvider> : tree;
}
