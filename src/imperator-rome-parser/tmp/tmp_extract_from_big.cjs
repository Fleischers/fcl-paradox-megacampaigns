const fs = require('fs');
const path = require('path');
const infile = 'E:/Games/paradox_tools/FCL1-2026-08-02-b.json';
const outdir = path.join(__dirname, 'tmp');
if (!fs.existsSync(outdir)) fs.mkdirSync(outdir);
console.log('Reading', infile);
const b = fs.readFileSync(infile);
let txt;
if (b.length >= 2 && b[0] === 0xff && b[1] === 0xfe) {
  txt = b.slice(2).toString('utf16le');
} else if (b.length >= 2 && b[0] === 0xfe && b[1] === 0xff) {
  // UTF-16 BE
  const swapped = Buffer.from(b);
  swapped.swap16();
  txt = swapped.slice(2).toString('utf16le');
} else {
  txt = b.toString('utf8');
}
console.log('Decoded length', txt.length);
let obj;
try {
  obj = JSON.parse(txt);
} catch (e) {
  console.error('JSON.parse failed:', e.message);
  process.exit(1);
}
console.log('Parsed top-level keys:', Object.keys(obj).slice(0,80));

function buildCountryMap(saveData) {
  let mgr = saveData.country || saveData.countries;
  if (mgr && typeof mgr === 'object' && !Array.isArray(mgr)) return mgr;
  if (Array.isArray(mgr)) {
    const map = {};
    for (const item of mgr) {
      const key = item?.tag ?? (item?.country_id ? String(item.country_id) : JSON.stringify(item).slice(0,12));
      map[key] = item;
    }
    return map;
  }
  for (const [k,v] of Object.entries(saveData)) {
    if (!v) continue;
    if (typeof v === 'object' && !Array.isArray(v)) {
      const keys = Object.keys(v);
      if (keys.length>0) {
        const sample = v[keys[0]];
        if (sample && typeof sample === 'object' && (sample.tag || sample.primary_culture || sample.religion || sample.owned_provinces)) return v;
      }
    }
    if (Array.isArray(v) && v.length>0 && typeof v[0] === 'object' && (v[0].tag || v[0].country_id)) {
      const map = {};
      for (const item of v) {
        const key = item?.tag ?? (item?.country_id ? String(item.country_id) : JSON.stringify(item).slice(0,12));
        map[key] = item;
      }
      return map;
    }
  }
  return {};
}

// First try buildCountryMap
let countryMap = buildCountryMap(obj);
// If buildCountryMap found nothing, try converting country_database
if ((!countryMap || Object.keys(countryMap).length === 0) && obj.country && obj.country.country_database) {
  const db = obj.country.country_database;
  const map = {};
  for (const k of Object.keys(db)) {
    const entry = db[k];
    for (const ekey of Object.keys(entry)) {
      const rec = entry[ekey];
      if (rec && rec.tag) map[rec.tag] = rec;
      else if (rec && rec.country_id) map[String(rec.country_id)] = rec;
    }
  }
  countryMap = map;
}
console.log('Countries found:', Object.keys(countryMap).length);

const players = ['MAURETANIA','BAETICA','ITALIA','MACEDONIA','CELTICA','SCANDIA','BRITANNIA','TAURICA','DACIA','ARMENIA'];
const playersLower = players.map(x=>x.toLowerCase());
const outPath = path.join(outdir, 'players_from_big.ndjson');
fs.writeFileSync(outPath, '', 'utf8');
const summary = [];
for (const [id, c] of Object.entries(countryMap)) {
  const hay = JSON.stringify(c).toLowerCase();
  for (let i=0;i<playersLower.length;i++) {
    const token = playersLower[i];
    if (hay.indexOf(token) !== -1) {
      const rec = { match: players[i], key: id, tag: c.tag, country_id: c.country_id, total_population: c.total_population, gold: c.currency_data?.gold ?? c.gold ?? null, territories: c.num_of_cities ?? (c.owned_provinces ? c.owned_provinces.length : null), primary_culture: c.primary_culture ?? null, religion: c.religion ?? null };
      fs.appendFileSync(outPath, JSON.stringify({match: players[i], record: c}) + '\n', 'utf8');
      summary.push(rec);
      break;
    }
  }
}
const sumPath = path.join(outdir, 'players_summary.json');
fs.writeFileSync(sumPath, JSON.stringify(summary, null, 2), 'utf8');
console.log('Matches written:', summary.length, '->', outPath);

// Move existing tmp files into tmp directory
const existing = ['tmp_countries.ndjson','tmp_players_utf8.ndjson','tmp_players_out.txt','tmp_extract_players.cjs','tmp_summarize_matches.cjs'];
for (const f of existing) {
  const src = path.join(__dirname, f);
  const dst = path.join(outdir, f);
  try {
    if (fs.existsSync(src)) {
      fs.renameSync(src, dst);
      console.log('Moved', f, '-> tmp/');
    }
  } catch (e) {
    console.error('Move failed for', f, e.message);
  }
}
console.log('Done. Summary at', sumPath);
