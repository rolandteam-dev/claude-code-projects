"use client";

import { useEffect } from "react";
import { captureIdentity } from "@/lib/buyer/track";

/**
 * Mounted once in the site layout. Picks up the ?c= identity token from an
 * inbound campaign link so the rest of the visit can be attributed to that
 * contact in Follow Up Boss. Renders nothing.
 */
export function BuyerIdentity() {
  useEffect(() => {
    captureIdentity();
  }, []);
  return null;
}
