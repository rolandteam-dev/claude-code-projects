/**
 * Enqueues two jobs so the runner can be exercised end to end:
 *   - a heartbeat, which should succeed
 *   - a job kind with no registered handler, which should fail and back off
 *
 * Then hit GET /api/cron/jobs and inspect the `jobs` table.
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config();

import { enqueue } from "@/lib/jobs";

async function main() {
  const ok = await enqueue({
    kind: "heartbeat",
    payload: { note: "phase 0 check" },
  });
  const willFail = await enqueue({ kind: "extract_contract", payload: {} });
  console.log(`queued heartbeat        ${ok.id}`);
  console.log(`queued extract_contract ${willFail.id} (no handler yet — expected to fail)`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
