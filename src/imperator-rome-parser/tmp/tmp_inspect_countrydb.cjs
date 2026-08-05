const fs = require('fs');
const infile = 'E:/Games/paradox_tools/FCL1-2026-08-02-b.json';
const b = fs.readFileSync(infile);
let txt;
if (b[0] === 0xff && b[1] === 0xfe) txt = b.slice(2).toString('utf16le');
else if (b[0] === 0xfe && b[1] === 0xff) { const swapped = Buffer.from(b); swapped.swap16(); txt = swapped.slice(2).toString('utf16le'); }
else txt = b.toString('utf8');
const obj = JSON.parse(txt);
const db = obj.country && obj.country.country_database;
console.log('country_database exists:', !!db);
console.log('country_database length', Object.keys(db).length);
const keys = Object.keys(db).slice(0, 10);
for (const k of keys) {
  const entry = db[k];
  console.log('DB key', k, 'type', typeof entry, 'keys', Object.keys(entry).slice(0,10));
  const firstSub = entry[Object.keys(entry)[0]];
  console.log('  sub entry type', typeof firstSub); 
  if (firstSub && typeof firstSub === 'object') {
    console.log('  sample fields', Object.keys(firstSub).slice(0,30));
    if (firstSub.raw) console.log('  raw prefix', String(firstSub.raw).slice(0,200));
  }
}
