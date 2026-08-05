const fs = require('fs');
const path = require('path');
const infile = 'E:/Games/paradox_tools/FCL1-2026-08-02-b.json';
const outdir = path.join(__dirname, 'tmp');
if (!fs.existsSync(outdir)) fs.mkdirSync(outdir);
const b = fs.readFileSync(infile);
let txt;
if (b.length >= 2 && b[0] === 0xff && b[1] === 0xfe) {
  txt = b.slice(2).toString('utf16le');
} else if (b.length >= 2 && b[0] === 0xfe && b[1] === 0xff) {
  const swapped = Buffer.from(b);
  swapped.swap16();
  txt = swapped.slice(2).toString('utf16le');
} else {
  txt = b.toString('utf8');
}
const obj = JSON.parse(txt);
const db = obj.country && obj.country.country_database;
if (!db) {
  console.error('No country_database in save JSON');
  process.exit(1);
}
const tag = 'ICE';
const records = [];
for (const [k, rec] of Object.entries(db)) {
  if (rec && rec.tag === tag) {
    records.push({ key: k, record: rec });
  }
}
const outPath = path.join(outdir, 'ICE_records.json');
fs.writeFileSync(outPath, JSON.stringify(records, null, 2), 'utf8');
console.log('Wrote', outPath, 'records found', records.length);
