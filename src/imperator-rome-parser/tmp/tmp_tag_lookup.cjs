const fs = require('fs');
const infile = 'E:/Games/paradox_tools/FCL1-2026-08-02-b.json';
const b = fs.readFileSync(infile);
let txt;
if (b[0] === 0xff && b[1] === 0xfe) txt = b.slice(2).toString('utf16le');
else if (b[0] === 0xfe && b[1] === 0xff) {
  const swapped = Buffer.from(b);
  swapped.swap16();
  txt = swapped.slice(2).toString('utf16le');
} else {
  txt = b.toString('utf8');
}
const obj = JSON.parse(txt);
const wanted = ['MAURETANIA','BAETICA','ITALIA','MACEDONIA','CELTICA','SCANDIA','BRITANNIA','TAURICA','DACIA','ARMENIA'];
const out = [];
const db = obj.country && obj.country.country_database;
if (!db) { console.error('No country_database'); process.exit(1); }
for (const k of Object.keys(db)) {
  const entry = db[k];
  for (const subkey of Object.keys(entry)) {
    const rec = entry[subkey];
    const fields = [];
    if (rec.historical) fields.push(String(rec.historical));
    if (rec.tag) fields.push(String(rec.tag));
    if (rec.country_name) fields.push(JSON.stringify(rec.country_name));
    if (rec.raw) fields.push(String(rec.raw));
    const hay = fields.join(' ').toLowerCase();
    const matches = wanted.filter(w => hay.includes(w.toLowerCase()));
    if (matches.length) {
      out.push({key:k, subkey, tag: rec.tag, historical: rec.historical, country_name: rec.country_name, matches});
    }
  }
}
console.log(JSON.stringify(out, null, 2));
