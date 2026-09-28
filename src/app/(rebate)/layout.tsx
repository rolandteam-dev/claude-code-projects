import type { Metadata } from "next";
import { rebateContact, rebateOffer } from "@/content/newConstructionRebate";
import { FollowUpBossPixel } from "@/components/FollowUpBossPixel";

/**
 * Chrome for rebate.therolandteam.com: none, on purpose. Like the guide page,
 * this is a single-offer landing page linked from YouTube, so it carries its
 * own slim top bar and footer and none of the marketing navigation. It keeps
 * the Follow Up Boss pixel so database contacts who click through are tied
 * to their CRM record.
 *
 * Same display serif as the guide page, loaded the same way (a stylesheet
 * link, not next/font) so the build never depends on reaching Google Fonts.
 */
const title = `Buying new construction in Las Vegas? Get ${rebateOffer.pricePercent}% back at closing.`;
const description = `The builder pays our commission whether you bring an agent or not. Register with The Roland Team before your first visit and we credit you ${rebateOffer.pricePercent}% of the base price at closing, up to ${rebateOffer.commissionCapPercent}% of what the builder pays us.`;

export const metadata: Metadata = {
  metadataBase: new URL(rebateContact.origin),
  title: {
    default: `${title} | The Roland Team`,
    template: "%s | The Roland Team",
  },
  description,
  applicationName: "The Roland Team",
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: "The Roland Team",
    title,
    description,
    url: rebateContact.origin,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function RebateLayout({ children }: Readonly<{ children: React.ReactNode }>) {
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
