export function normalizePlayer(p={}){
  return {id:String(p.id||''),name:p.name||'Unknown',position:p.position||null,nflTeam:p.nflTeam||null,status:p.status||'ACTIVE',byeWeek:p.byeWeek??null,providerIds:{...(p.providerIds||{})}};
}
export function normalizeProjection(p={}){
  return {playerId:String(p.playerId||p.id||''),week:Number(p.week||0),mean:Number(p.mean??p.projection??0),cv:p.cv==null?null:Number(p.cv),source:p.source||'unknown',updatedAt:p.updatedAt||null,stats:p.stats||null};
}
export function normalizeFantasyTeam(t={}){
  return {id:String(t.id),name:t.name||String(t.id),wins:Number(t.wins||0),losses:Number(t.losses||0),ties:Number(t.ties||0),points:Number(t.points||0),roster:[...(t.roster||[])],lineup:[...(t.lineup||[])]};
}
export function validateLeague(l){
  const errors=[];
  if(!Array.isArray(l?.teams)||l.teams.length<2)errors.push('league requires at least two teams');
  if(!Array.isArray(l?.schedule))errors.push('league schedule must be an array');
  if(!(l?.playoffSpots>0))errors.push('playoffSpots must be positive');
  return {valid:errors.length===0,errors};
}
