const fs = require('fs');
const path = 'E:/Games/paradox_tools/FCL1-2026-08-02-b.json';
const buf = fs.readFileSync(path);
console.log('bytes:', buf.slice(0, 32).toString('hex'));
const text = buf.toString('utf16le');
console.log('prefix:', text.slice(0, 320).replace(/\r/g, '\\r').replace(/\n/g, '\\n'));
let obj;
try {
  obj = JSON.parse(text);
} catch (e) {
  console.error('parse failed', e.message);
  process.exit(1);
}
const keys = Object.keys(obj).slice(0, 80);
console.log('top keys:', keys);
const candidates = ['country', 'countries', 'countrydata', 'countriesdata', 'countries_info'];
for (const key of candidates) {
  if (key in obj) {
    console.log('found key', key);
    console.log('sample ids', Object.keys(obj[key]).slice(0, 20));
    console.log('sample 0', JSON.stringify(obj[key][Object.keys(obj[key])[0]], null, 2).slice(0, 1200));
    break;
  }
}
if (!keys.includes('country') && !keys.includes('countries')) {
  console.log('no usual country key found');
}
