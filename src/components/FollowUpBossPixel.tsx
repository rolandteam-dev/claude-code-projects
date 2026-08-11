"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";

/**
 * Follow Up Boss (FUB) tracking pixel.
 *
 * When a database contact clicks a link in a FUB email/text and lands here,
 * this pixel ties their site browsing to their FUB contact record — powering
 * the "your lead just viewed X" agent notifications and any activity-based
 * Action Plans / automations.
 *
 * Setup: grab the Pixel ID from Follow Up Boss → Admin → Pixel (Superhuman /
 * website tracking), then set it as an environment variable in Vercel:
 *
 *   NEXT_PUBLIC_FUB_PIXEL_ID=your-pixel-id
 *
 * Until that var is present the component renders nothing, so the site is
 * unaffected in dev/preview. NEXT_PUBLIC_ is required so the value is inlined
 * into the client bundle (the pixel runs in the browser).
 *
 * NOTE: FUB shows an account-specific copy-paste snippet — confirm the loader
 * URL (widgetbe.com/agent) and tracker name (widgetTracker) below match what
 * your account displays. Only the ID normally changes.
 */
const PIXEL_ID = process.env.NEXT_PUBLIC_FUB_PIXEL_ID;

function sendPageview() {
  const w = window as unknown as { widgetTracker?: (...args: unknown[]) => void };
  if (typeof w.widgetTracker === "function") {
    w.widgetTracker("send", "pageview");
  }
}

/**
 * The inline snippet sends the first pageview on load. This tracker fires a
 * pageview on every client-side navigation after that, so SPA route changes
 * are recorded too (Next.js App Router does not reload the page on nav).
 */
function RouteChangeTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isFirstRun = useRef(true);

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false; // initial pageview already sent by the snippet
      return;
    }
    sendPageview();
  }, [pathname, searchParams]);

  return null;
}

export function FollowUpBossPixel() {
  if (!PIXEL_ID) return null;

  return (
    <>
      <Script id="fub-pixel" strategy="afterInteractive">
        {`(function(w,i,d,g,e,t){w[d]=w[d]||[];var s=i.createElement(g);s.async=1;s.src=e;var x=i.getElementsByTagName(g)[0];x.parentNode.insertBefore(s,x);w[t]=w[t]||function(){(w[t].q=w[t].q||[]).push(arguments)}})(window,document,'widgetTrackerData','script','https://widgetbe.com/agent','widgetTracker');widgetTracker('create','${PIXEL_ID}');widgetTracker('send','pageview');`}
      </Script>
      <Suspense fallback={null}>
        <RouteChangeTracker />
      </Suspense>
    </>
  );
}
