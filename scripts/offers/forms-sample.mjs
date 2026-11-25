// Fills the Duties Owed, Supplemental and BBRA blanks with SAMPLE data (no real client) for visual checking.
// Usage: node --experimental-strip-types --no-warnings --import ./scripts/distress/register.mjs scripts/offers/forms-sample.mjs <dir with duties-open.pdf supp-open.pdf bbra-open.pdf> <outdir>
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fillDuties, fillSupplemental } from "../../src/lib/offers/forms/duties.ts";
import { fillBbra } from "../../src/lib/offers/forms/bbra.ts";

const [dir, out] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const read = (n) => new Uint8Array(readFileSync(`${dir}/${n}`));
const broker = { name: "Sample Broker", license: "B.0000001", company: "Sample Realty", address: "100 Example Rd #300", city: "Las Vegas", state: "NV", zip: "89101", phone: "(702) 555-0100", email: "broker@example.com" };
const input = {
  agent: { name: "Sample Agent", license: "S.0000002", phone: "(702) 555-0199" },
  buyers: ["Alex Sample", "Jordan Sample"],
  broker,
  additionalLicensees: [{ name: "Casey Coordinator", license: "S.0000003" }],
};
writeFileSync(`${out}/duties.pdf`, (await fillDuties(read("duties-open.pdf"), input)).pdf);
writeFileSync(`${out}/supp.pdf`, (await fillSupplemental(read("supp-open.pdf"), input)).pdf);
const b = await fillBbra(read("bbra-open.pdf"), { ...input, contactEmails: ["agent@example.com", "tc@example.com"], today: "2026-11-24" });
writeFileSync(`${out}/bbra.pdf`, b.pdf);
console.log(JSON.stringify(b.stillToDo, null, 1));
