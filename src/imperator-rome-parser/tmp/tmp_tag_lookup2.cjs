const fs = require('fs');
const infile = 'E:/Games/paradox_tools/FCL1-2026-08-02-b.json';
const b = fs.readFileSync(infile);
let txt;
if (b[0] === 0xff && b[1] === 0xfe) txt = b.slice(2).toString('utf16le');
else if (b[0] === 0xfe && b[1] === 0xff) { const swapped = Buffer.from(b); swapped.swap16(); txt = swapped.slice(2).toString('utf16le'); }
else txt = b.toString('utf8');
const obj = JSON.parse(txt);
const wanted = ['MAURETANIA','BAETICA','ITALIA','MACEDONIA','CELTICA','SCANDIA','BRITANNIA','TAURICA','DACIA','ARMENIA'];
const db = obj.country && obj.country.country_database;
if (!db) { console.error('No country_database'); process.exit(1); }
const out = [];
for (const [k, rec] of Object.entries(db)) {
  const fields = [];
  if (rec.tag) fields.push(rec.tag);
  if (rec.historical) fields.push(rec.historical);
  if (rec.country_name) {
    fields.push(String(rec.country_name.name || ''));
    fields.push(String(rec.country_name.adjective || ''));
  }
  if (rec.flag) fields.push(rec.flag);
  const hay = fields.join(' ').toUpperCase();
  for (const need of wanted) {
    if (hay.includes(need)) {
      out.push({ need, key: k, tag: rec.tag, historical: rec.historical, country_name: rec.country_name, flag: rec.flag });
      break;
    }
  }
}
console.log(JSON.stringify(out, null, 2));
