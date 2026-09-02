import type { Metadata } from "next";
import { PortalShell } from "@/components/portal/PortalShell";
import { SavedHomes } from "@/components/portal/SavedHomes";

// A private workspace, not a landing page — keep it out of the index.
export const metadata: Metadata = {
  title: "Saved Homes",
  description: "The homes and searches you have saved to your hub.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <PortalShell>
      <SavedHomes />
    </PortalShell>
  );
}
