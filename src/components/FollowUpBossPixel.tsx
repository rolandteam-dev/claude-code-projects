"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";

/**
 * Follow Up Boss (FUB) tracking pixel — the official "Widget Tracker" snippet.
 *
 * When a database contact clicks a link in a FUB email/text and lands here,
 * this pixel ties their site browsing to their FUB contact record — powering
 * the "your lead just viewed X" agent notifications and any activity-based
 * Action Plans / automations.
 *
 * The Pixel ID is a public, client-side value (it ships in the page HTML), so
 * it is safe to keep in the repo. It defaults to The Roland Team's live pixel
 * and can be overridden per environment (e.g. staging) with:
 *
 *   NEXT_PUBLIC_FUB_PIXEL_ID=WT-XXXXXXXX
 *
 * Source of truth for the snippet: Follow Up Boss → Admin → Pixel.
 */
const DEFAULT_PIXEL_ID = "WT-HKVXTYFU";
const PIXEL_ID = process.env.NEXT_PUBLIC_FUB_PIXEL_ID ?? DEFAULT_PIXEL_ID;

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
      {/* Official Follow Up Boss "Widget Tracker" snippet (Admin → Pixel). */}
      <Script id="fub-pixel" strategy="afterInteractive">
        {`(function(w,i,d,g,e,t){w["WidgetTrackerObject"]=g;(w[g]=w[g]||function(){(w[g].q=w[g].q||[]).push(arguments);}),(w[g].ds=1*new Date());(e="script"),(t=d.createElement(e)),(e=d.getElementsByTagName(e)[0]);t.async=1;t.src=i;e.parentNode.insertBefore(t,e);})(window,"https://widgetbe.com/agent",document,"widgetTracker");window.widgetTracker("create","${PIXEL_ID}");window.widgetTracker("send","pageview");`}
      </Script>
      <Suspense fallback={null}>
        <RouteChangeTracker />
      </Suspense>
    </>
  );
}
