import type { Metadata } from "next";
import { PortalShell } from "@/components/portal/PortalShell";
import { JourneyBoard } from "@/components/portal/JourneyBoard";

// A private workspace, not a landing page — keep it out of the index.
export const metadata: Metadata = {
  title: "My Journey",
  description: "Your step-by-step plan, stage by stage.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <PortalShell>
      <JourneyBoard />
    </PortalShell>
  );
}
