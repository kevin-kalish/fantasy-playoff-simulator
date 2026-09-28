import {normalizeLeagueSnapshot,validateLeagueSnapshot} from './league-snapshot.js';

const canon=s=>String(s??'').replace(/[’‘]/g,"'").trim().toLowerCase();

export function findConfiguredTeam(snapshot,config){
 const aliases=(config.teamAliases?.length?config.teamAliases:[config.teamName]).map(canon);
 return (snapshot.teams??[]).find(t=>aliases.includes(canon(t.name)))??null;
}

export function applyFightinKaliConfig(input,config){
 const league=normalizeLeagueSnapshot(input);
 const team=findConfiguredTeam(league,config);
 if(!team) throw new Error(`Configured team '${config.teamName}' was not found in the snapshot.`);
 return normalizeLeagueSnapshot({
  ...league,
  source:{...league.source,season:config.season,leagueId:league.source?.leagueId||config.leagueId},
  currentWeek:league.currentWeek??league.source?.currentWeek,
  playoffSpots:config.playoffs.spots,
  playoffWeeks:config.playoffs.weeks,
  reseed:config.playoffs.reseed,
  playoffTiebreaker:config.playoffs.tieBreaker,
  lineupSlots:league.lineupSlots,
  simulations:league.simulations??config.defaults?.simulations,
  seed:league.seed??config.defaults?.seed
 });
}

export function prepareFightinKaliSnapshot(input,config){
 const league=applyFightinKaliConfig(input,config);
 const validation=validateLeagueSnapshot(league);
 const team=findConfiguredTeam(league,config);
 const scheduledWeeks=(league.schedule??[]).map(x=>x.week).filter(Number.isFinite).sort((a,b)=>a-b);
 const currentWeek=league.currentWeek??league.source?.currentWeek??scheduledWeeks[0]??null;
 const remainingWeeks=scheduledWeeks.filter(week=>currentWeek==null||week>=currentWeek);
 return {
  league,
  team,
  validation,
  state:{
   season:config.season,
   currentWeek,
   remainingRegularSeasonWeeks:remainingWeeks,
   playoffWeeks:[...config.playoffs.weeks],
   sourceProvider:league.source?.provider||'manual',
   ready:validation.valid
  }
 };
}
