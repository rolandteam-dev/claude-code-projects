import type { Metadata } from "next";
import { PortalShell } from "@/components/portal/PortalShell";
import { BudgetPlanner } from "@/components/portal/BudgetPlanner";

// A private workspace, not a landing page — keep it out of the index.
export const metadata: Metadata = {
  title: "My Numbers",
  description: "Your payment, cash to close and affordability estimates.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <PortalShell>
      <BudgetPlanner />
    </PortalShell>
  );
}
