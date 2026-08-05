const fs=require('fs');
const lines = fs.readFileSync('tmp_players_utf8.ndjson','utf8').split('\n').filter(Boolean);
for (const l of lines) {
  try{
    const o = JSON.parse(l);
    const r = o.record;
    const territories = r.num_of_cities ?? (r.owned_provinces ? r.owned_provinces.length : (r.territories ?? null));
    console.log(`${o.match} -> tag=${r.tag} id=${r.country_id} territories=${territories ?? 'N/A'} pops=${r.total_population ?? 'N/A'} gold=${r.gold ?? 'N/A'} culture=${r.primary_culture ?? 'N/A'} religion=${r.religion ?? 'N/A'} capital=${r.capital ?? 'N/A'}`);
  }catch(e){}
}
