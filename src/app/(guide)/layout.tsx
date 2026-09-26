import type { Metadata } from "next";
import { guideContact } from "@/content/relocationGuides";
import { FollowUpBossPixel } from "@/components/FollowUpBossPixel";

/**
 * Chrome for guide.therolandteam.com: none, on purpose. The guide page is a
 * single-offer landing page linked from YouTube, so it carries its own slim
 * top bar and footer and none of the marketing navigation. It does keep the
 * Follow Up Boss pixel so database contacts who click through are tied to
 * their CRM record.
 *
 * The display serif (Cormorant Garamond) is loaded here rather than through
 * next/font so the build never depends on reaching Google Fonts; the rest of
 * the site falls back to Georgia and is unaffected.
 */
export const metadata: Metadata = {
  metadataBase: new URL(guideContact.origin),
  title: {
    default: "Moving to Las Vegas? Start here. | The Roland Team",
    template: "%s | The Roland Team",
  },
  description:
    "Two free guides from The Roland Team: what moving to Las Vegas actually costs, the deadlines that catch people, and the city you'll live in once the boxes are unpacked. No Strip recommendations.",
  applicationName: "The Roland Team",
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: "The Roland Team",
    title: "Moving to Las Vegas? Start here.",
    description:
      "Two free guides: what the move actually costs, the deadlines that catch people, and the city you'll live in once the boxes are unpacked.",
    url: guideContact.origin,
  },
  twitter: {
    card: "summary_large_image",
    title: "Moving to Las Vegas? Start here.",
    description: "Two free guides from The Roland Team, written for people making the move.",
  },
};

export default function GuideLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      {/* eslint-disable-next-line @next/next/no-page-custom-font -- App Router layout; the rule assumes pages/_document */}
      <link
        rel="stylesheet"
        precedence="default"
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&display=swap"
      />
      <main className="flex flex-1 flex-col bg-white font-sans text-ink antialiased">{children}</main>
      <FollowUpBossPixel />
    </>
  );
}
