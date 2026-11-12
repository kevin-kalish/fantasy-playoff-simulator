// Read-only projection source coverage; counts do not establish provider freshness or identity.
const POSITIONS=['QB','RB','WR','TE','K','DEF'];
const norm=x=>({'DST':'DEF','D/ST':'DEF'}[String(x??'').trim().toUpperCase()]??String(x??'').trim().toUpperCase());
export function auditWeeklyPositionCoverage(rows,{season,weeks=[],weekResults=[]}={}){
 const requested=[...new Set(weeks.map(Number).filter(Number.isInteger))].sort((a,b)=>a-b);
 return requested.flatMap(week=>POSITIONS.map(position=>{
  const matching=(Array.isArray(rows)?rows:[]).filter(r=>Number(r.season)===Number(season)&&Number(r.week)===week&&norm(r.position)===position&&r.projection!=null&&r.projection!==''&&Number.isFinite(Number(r.projection)));
  const source=weekResults.find(x=>Number(x.week)===week);
  return {week,position,rows:matching.length,uniquePlayerIds:new Set(matching.map(r=>String(r.playerId??'')).filter(Boolean)).size,provider:source?.provider??'unknown',observedAt:source?.observedAt??null,sourceProvenanceVerified:false};
 }));
}
