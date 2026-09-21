import type { DealDateKey } from "@/db/schema/deals";
import type {
  MilestoneCategory,
  MilestoneKey,
  OffsetBasis,
} from "@/db/schema/milestones";

/**
 * The standard purchase-side milestone template.
 *
 * `key` values are STORAGE KEYS — they key client progress and every audit row.
 * Never rename, renumber or repurpose one; add a new key instead.
 *
 * `clientLabel` is what the buyer reads. Keep it plain English, no jargon and no
 * internal process detail.
 */
export type TemplateStep = {
  key: MilestoneKey;
  label: string;
  clientLabel: string;
  sortOrder: number;
  category: MilestoneCategory;
  isDeadline: boolean;
  clientVisible: boolean;
  offsetBasis: OffsetBasis;
  offsetDays?: number;
  offsetDateKey?: DealDateKey;
  helpText?: string;
};

export const PURCHASE_TEMPLATE_NAME = "Standard purchase (NV)";

export const PURCHASE_TEMPLATE_STEPS: TemplateStep[] = [
  {
    key: "under_contract",
    label: "Under contract",
    clientLabel: "Under contract",
    sortOrder: 1,
    category: "contract",
    isDeadline: false,
    clientVisible: true,
    offsetBasis: "acceptance",
    offsetDays: 0,
    helpText: "Both sides have signed. The clock starts here.",
  },
  {
    key: "emd_received",
    label: "EMD received",
    clientLabel: "Earnest money received",
    sortOrder: 2,
    category: "contract",
    isDeadline: true,
    clientVisible: true,
    offsetBasis: "date_key",
    offsetDateKey: "emd_due",
    helpText: "Escrow has confirmed the earnest money deposit.",
  },
  {
    key: "inspection_done",
    label: "Inspection complete",
    clientLabel: "Home inspection complete",
    sortOrder: 3,
    category: "inspection",
    isDeadline: true,
    clientVisible: true,
    offsetBasis: "date_key",
    offsetDateKey: "due_diligence_end",
  },
  {
    key: "repair_negotiation_done",
    label: "Repair negotiation complete",
    clientLabel: "Repair requests resolved",
    sortOrder: 4,
    category: "inspection",
    isDeadline: true,
    clientVisible: true,
    offsetBasis: "date_key",
    offsetDateKey: "due_diligence_end",
  },
  {
    key: "appraisal_ordered",
    label: "Appraisal ordered",
    clientLabel: "Appraisal ordered",
    sortOrder: 5,
    category: "financing",
    isDeadline: false,
    clientVisible: true,
    offsetBasis: "none",
    helpText: "The lender has ordered the appraisal.",
  },
  {
    key: "appraisal_received",
    label: "Appraisal received",
    clientLabel: "Appraisal complete",
    sortOrder: 6,
    category: "financing",
    isDeadline: true,
    clientVisible: true,
    offsetBasis: "date_key",
    offsetDateKey: "appraisal_deadline",
  },
  {
    key: "conditional_approval",
    label: "Conditional approval",
    clientLabel: "Loan approved, pending final items",
    sortOrder: 7,
    category: "financing",
    isDeadline: true,
    clientVisible: true,
    offsetBasis: "date_key",
    offsetDateKey: "loan_contingency",
  },
  {
    key: "clear_to_close",
    label: "Clear to close",
    clientLabel: "Cleared to close",
    sortOrder: 8,
    category: "financing",
    isDeadline: false,
    clientVisible: true,
    offsetBasis: "none",
    helpText: "The lender has released the file to escrow for closing.",
  },
  {
    key: "docs_signed",
    label: "Docs signed",
    clientLabel: "Closing documents signed",
    sortOrder: 9,
    category: "closing",
    isDeadline: false,
    clientVisible: true,
    offsetBasis: "coe",
    offsetDays: -1,
  },
  {
    key: "funded_recorded",
    label: "Funded & recorded",
    clientLabel: "Funded and recorded",
    sortOrder: 10,
    category: "closing",
    isDeadline: false,
    clientVisible: true,
    offsetBasis: "coe",
    offsetDays: 0,
  },
  {
    key: "closed",
    label: "Closed",
    clientLabel: "Closed — the home is yours",
    sortOrder: 11,
    category: "closing",
    isDeadline: false,
    clientVisible: true,
    offsetBasis: "coe",
    offsetDays: 0,
  },
];

export const MILESTONE_COUNT = PURCHASE_TEMPLATE_STEPS.length;
