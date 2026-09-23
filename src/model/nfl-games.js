// NFL-game identity layer. Correlation is keyed to real NFL games, never fantasy matchups.
export function gameKey(week,teamA,teamB){return `${Number(week)}:${[teamA,teamB].map(String).sort().join('-')}`}
export function buildNFLGameIndex(games=[]){
  const byWeekTeam=new Map();
  for(const g of games){const week=Number(g.week),home=String(g.homeTeam),away=String(g.awayTeam),key=g.id||gameKey(week,home,away),entry={...g,id:key,week,homeTeam:home,awayTeam:away};byWeekTeam.set(`${week}:${home}`,entry);byWeekTeam.set(`${week}:${away}`,entry)}
  return {get(week,nflTeam){return byWeekTeam.get(`${Number(week)}:${String(nflTeam)}`)||null}};
}
export function playerGameContext(player,week,index){
  if(!player?.nflTeam||!index)return null;const game=index.get(week,player.nflTeam);if(!game)return null;
  const side=String(player.nflTeam)===game.homeTeam?'home':'away';
  return {gameId:game.id,side,nflTeam:String(player.nflTeam),opponent:side==='home'?game.awayTeam:game.homeTeam};
}
export function validateNFLGames(games=[]){
  const errors=[],seen=new Set();
  for(const g of games){if(!Number.isFinite(Number(g.week)))errors.push('game week is required');if(!g.homeTeam||!g.awayTeam)errors.push('homeTeam and awayTeam are required');const key=gameKey(g.week,g.homeTeam,g.awayTeam);if(seen.has(key))errors.push(`duplicate game ${key}`);seen.add(key)}
  return {valid:errors.length===0,errors};
}
