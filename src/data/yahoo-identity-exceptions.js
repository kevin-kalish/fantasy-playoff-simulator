// Explicit, reviewed identity exceptions only. Never infer a player ID from score equality.
export function auditIdentityExceptions(nflRows,yahooRows,{overrides=[]}={}){
 const excluded=yahooRows.filter(r=>String(r.position).toUpperCase()==='DEF');
 const individuals=yahooRows.filter(r=>String(r.position).toUpperCase()!=='DEF');
 const matched=[],rejected=[],seen=new Set();
 for(const o of overrides){
  const k=[o.season,o.week,o.yahooPlayerId].join('|');
  if(seen.has(k)){rejected.push({override:o,reason:'duplicate-override'});continue;}
  seen.add(k);
  const y=individuals.filter(r=>Number(r.season)===Number(o.season)&&Number(r.week)===Number(o.week)&&String(r.playerId)===String(o.yahooPlayerId));
  const n=nflRows.filter(r=>Number(r.season)===Number(o.season)&&Number(r.week)===Number(o.week)&&String(r.playerId)===String(o.nflversePlayerId));
  if(y.length!==1||n.length!==1){rejected.push({override:o,reason:'nonunique-or-missing-player-week'});continue;}
  if(String(y[0].position).toUpperCase()!==String(n[0].position).toUpperCase()){rejected.push({override:o,reason:'position-conflict'});continue;}
  matched.push({season:o.season,week:o.week,yahooPlayerId:o.yahooPlayerId,nflversePlayerId:o.nflversePlayerId,yahooTeam:y[0].nflTeam,nflverseTeam:n[0].nflTeam,yahooScore:y[0].actual,nflverseScore:n[0].actual,scoreDifference:Number(n[0].actual)-Number(y[0].actual),reason:o.reason??'reviewed-identity-exception'});
 }
 return {schemaVersion:1,excludedDefenses:excluded.length,individualRows:individuals.length,reviewedMatches:matched,rejected,notes:'Explicit ID mappings are required for team-change exceptions. Excluded defenses require separate team-defense actuals.'};
}
