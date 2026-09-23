const clean=v=>String(v??'').trim();
const nameKey=v=>clean(v).toLowerCase().replace(/[^a-z0-9]/g,'');
export function buildPlayerIdMap(rows=[]){
 const indexes={gsis:new Map(),fantasypros:new Map(),yahoo:new Map(),espn:new Map(),nameTeam:new Map()};
 for(const r of rows){const canonical=clean(r.gsis_id||r.player_id||r.gsis||r.nflverse_id);if(!canonical)continue;const ids={gsis:r.gsis_id||r.gsis||canonical,fantasypros:r.fantasypros_id||r.fpid,yahoo:r.yahoo_id||r.yahooid,espn:r.espn_id||r.espnid};for(const [k,v] of Object.entries(ids))if(clean(v))indexes[k].set(clean(v),canonical);if(r.name&&r.team)indexes.nameTeam.set(`${nameKey(r.name)}|${clean(r.team).toUpperCase()}`,canonical)}
 return {resolve({gsisId,fantasyProsId,yahooId,espnId,name,team}={}){const candidates=[['gsis',gsisId],['fantasypros',fantasyProsId],['yahoo',yahooId],['espn',espnId]];for(const [k,v] of candidates)if(clean(v)&&indexes[k].has(clean(v)))return{playerId:indexes[k].get(clean(v)),matchedBy:k};if(name&&team){const k=`${nameKey(name)}|${clean(team).toUpperCase()}`;if(indexes.nameTeam.has(k))return{playerId:indexes.nameTeam.get(k),matchedBy:'nameTeam'}}return null},indexes};
}
