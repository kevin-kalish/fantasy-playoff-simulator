// Derive coverage expectations from a Yahoo-reconciled snapshot, not from provider output.
const allowed=new Set(['QB','RB','WR','TE','K','DST']);
const pos=value=>{const p=String(value??'').toUpperCase().replace(/[^A-Z]/g,'');return p==='DEF'||p==='D'?'DST':p;};
const clean=value=>String(value??'').trim();
export function expectedProjectionPlayersFromSnapshot(snapshot){
 const teams=snapshot?.teams;
 if(!Array.isArray(teams)||!teams.length)throw new Error('Yahoo snapshot has no teams');
 const expected=[],errors=[],seen=new Set();
 for(const team of teams){
  if(!Array.isArray(team.roster)){errors.push('missing-roster:'+clean(team.id));continue;}
  for(const player of team.roster){
   const name=clean(player?.name??player?.playerName);
   const position=pos(player?.position??player?.pos);
   const nflTeam=clean(player?.nflTeam??player?.team??player?.proTeam).toUpperCase();
   const yahooId=clean(player?.id??player?.playerId);
   if(/^EMPTY(?:-|\\s|$)/i.test(name)||/^EMPTY(?:-|\\s|$)/i.test(yahooId))continue;
   if(!allowed.has(position)){errors.push('unsupported-position:'+clean(team.id)+':'+yahooId);continue;}
   if(!name||!nflTeam||!yahooId){errors.push('incomplete-identity:'+clean(team.id)+':'+yahooId);continue;}
   if(seen.has(yahooId)){errors.push('duplicate-yahoo-player:'+yahooId);continue;}
   seen.add(yahooId);
   // Intentionally omit playerId: Yahoo and provider IDs are different namespaces.
   expected.push({name,position,nflTeam,yahooPlayerId:yahooId,teamId:clean(team.id)});
  }
 }
 return {expectedPlayers:expected,errors,ready:errors.length===0&&expected.length>0,teamCount:teams.length};
}
