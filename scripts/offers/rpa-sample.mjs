// Fills the blank RPA with a sample offer and writes PDF + page images for checking.
// Usage: node --experimental-strip-types --no-warnings scripts/offers/rpa-sample.mjs <blank.pdf> <outdir>
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fillRpa } from "../../src/lib/offers/rpa/fill.ts";

const [blank, out] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const inputs = {
  address: "272 Helmsdale Dr., Henderson, NV 89014",
  clientName: "Mike Roland and Molly Roland",
  listPrice: 450000,
  offerPrice: 400000,
  financing: "conventional",
  earnestMoney: 4000,
  closeDate: "2026-12-24",
  contingencies: ["inspection", "appraisal", "loan"],
  inspectionDays: 10,
  appraisalDays: 17,
  loanDays: 21,
  downPaymentPercent: 5,
  sellerCredit: 10000,
  homeWarranty: "seller",
  inclusions: ["refrigerator", "washer", "dryer", "window coverings"],
  mlsNumber: "2512345",
  occupy: true,
  buyerNames: ["Mike Roland", "Molly Roland"],
};
const ctx = {
  broker: { name: "Sample Broker", license: "B.0000001", company: "Sample Realty", address: "100 Example Rd #300", city: "Las Vegas", state: "NV", zip: "89101", phone: "(702) 555-0100", email: "broker@example.com" },
  agent: { name: "Sample Agent", license: "S.0000002" },
  phone: "(702) 555-0199",
  emails: ["agent@example.com", "tc@example.com"],
};
const r = await fillRpa(new Uint8Array(readFileSync(blank)), inputs, "2026-11-24", ctx);
writeFileSync(`${out}/rpa-filled.pdf`, r.pdf);
console.log(JSON.stringify({ stillToDo: r.stillToDo, warnings: r.warnings }, null, 1));
