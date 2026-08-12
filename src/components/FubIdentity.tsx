"use client";

import { useEffect } from "react";
import { captureEmailFromUrl, checkReengagement } from "@/lib/fubClient";

/**
* Mounted once in the root layout. On app load it picks up an `?e=` identity
* token from an inbound marketing link, then -- for an identified visitor --
* checks whether they're returning after 30+ days away and merges the
* lux_reengaged tag if so. Renders nothing.
*/
export function FubIdentity() {
  useEffect(() => {
    captureEmailFromUrl();
    checkReengagement();
  }, []);

return null;
}
