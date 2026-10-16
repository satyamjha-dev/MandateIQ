import { parseCsv } from "./src/lib/csv/parse-csv";
import { normalizeRow } from "./src/lib/csv/normalize-row";

const csv = `Transaction Date,Narration,Debit,Credit
01/09/2026,NETFLIX.COM,499,`;

const parsed = parseCsv(csv);

console.log("Detected format:", parsed.format);

for (const row of parsed.rows) {
  console.log(normalizeRow(row, parsed.format));
}