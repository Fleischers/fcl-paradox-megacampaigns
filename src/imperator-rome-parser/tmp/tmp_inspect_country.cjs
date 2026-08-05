const fs = require('fs');
const infile = 'E:/Games/paradox_tools/FCL1-2026-08-02-b.json';
const b = fs.readFileSync(infile);
let txt;
if (b[0]===0xff && b[1]===0xfe) txt = b.slice(2).toString('utf16le'); else txt = b.toString('utf8');
const obj = JSON.parse(txt);
console.log('obj.country keys:', Object.keys(obj.country).slice(0,50));
console.log('country type of first key:', typeof obj.country[Object.keys(obj.country)[0]]);
console.log('sample keys of first entry:', Object.keys(obj.country[Object.keys(obj.country)[0]]).slice(0,50));
