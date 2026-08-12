"use client";

import { useEffect } from "react";
import { captureIdentityFromUrl } from "@/lib/identity";

/**
 * Mounted once in the root layout. Picks up ?e=<email> from marketing links
 * (e.g. property-alert emails) on first load and stores it for the rest of
 * this browser session, so later Follow Up Boss "Viewed Property" /
 * "Saved Property" events can be matched to the contact. Renders nothing;
 * a no-op when the param isn't present.
 */
export function IdentityBoot() {
    useEffect(() => {
          captureIdentityFromUrl();
    }, []);

  return null;
}
