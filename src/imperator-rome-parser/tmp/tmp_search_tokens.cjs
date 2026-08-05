const fs = require('fs');
const infile = 'E:/Games/paradox_tools/FCL1-2026-08-02-b.json';
const b = fs.readFileSync(infile);
let txt;
if (b[0] === 0xff && b[1] === 0xfe) txt = b.slice(2).toString('utf16le');
else if (b[0] === 0xfe && b[1] === 0xff) { const swapped = Buffer.from(b); swapped.swap16(); txt = swapped.slice(2).toString('utf16le'); }
else txt = b.toString('utf8');
const tokens = ['MAURETANIA','BAETICA','ITALIA','MACEDONIA','CELTICA','SCANDIA','BRITANNIA','TAURICA','DACIA','ARMENIA'];
for (const token of tokens) {
  const count = (txt.match(new RegExp(token, 'g')) || []).length;
  console.log(token, count);
}
