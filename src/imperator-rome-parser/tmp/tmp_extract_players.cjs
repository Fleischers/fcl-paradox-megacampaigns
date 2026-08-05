const fs = require('fs');
const readline = require('readline');
const path = 'tmp_countries.ndjson';
const want = ['MAURETANIA','BAETICA','ITALIA','MACEDONIA','CELTICA','SCANDIA','BRITANNIA','TAURICA','DACIA','ARMENIA'];
const wantLower = want.map(x=>x.toLowerCase());
(
async function(){
  const outPath = 'tmp_players_utf8.ndjson';
  try{ fs.unlinkSync(outPath); } catch(_){}
  const rl = readline.createInterface({ input: fs.createReadStream(path), crlfDelay: Infinity });
  let lineNo=0;
  for await (const line of rl) {
    lineNo++;
    if (!line) continue;
    try{
      const obj = JSON.parse(line);
      const raw = (obj.raw||'').toLowerCase();
      const countryNameFields = [];
      if (obj.country_name) countryNameFields.push(JSON.stringify(obj.country_name).toLowerCase());
      if (obj.historical) countryNameFields.push(String(obj.historical).toLowerCase());
      if (obj.tag) countryNameFields.push(String(obj.tag).toLowerCase());
      const hay = (countryNameFields.join(' ') + ' ' + raw);
      for (const w of wantLower) {
        if (hay.indexOf(w) !== -1) {
          fs.appendFileSync(outPath, JSON.stringify({match:w.toUpperCase(), record: obj}) + '\n', {encoding:'utf8'});
          break;
        }
      }
    } catch(e) {
      // ignore parse errors
    }
  }
})();
