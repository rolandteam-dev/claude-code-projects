import type { Metadata } from "next";
import { PortalShell } from "@/components/portal/PortalShell";
import { VendorDirectory } from "@/components/portal/VendorDirectory";

// A private workspace, not a landing page — keep it out of the index.
export const metadata: Metadata = {
  title: "My Pros",
  description: "The lenders, inspectors and pros we trust with our clients.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <PortalShell>
      <VendorDirectory />
    </PortalShell>
  );
}
