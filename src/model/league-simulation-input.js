import {validateLeagueSnapshot} from '../data/league-snapshot.js';
import {calibrationFromReport,calibrationReady} from './calibration-loader.js';

function projectionIdentity(p,teamId,index){return String(p?.id||p?.playerId||p?.player_id||`${p?.name||p?.playerName||'player'}|${p?.position||p?.pos||''}|${p?.nflTeam||p?.team||''}|${teamId}|${index}`)}
function rawProjectionCoverage(snapshot){
 let total=0,projected=0;
 for(const team of snapshot?.teams||[]){
  const seen=new Set();
  const groups=[team.lineup||team.starters||[],...Object.values(team.weeklyLineups||{})];
  for(const players of groups)for(const [index,p] of players.entries()){
   const key=projectionIdentity(p,team.id||team.teamId||team.team_id,index);
   if(seen.has(key))continue;seen.add(key);total++;
   const value=p?.projection??p?.projectedPoints??p?.projected_points;
   if(value!==null&&value!==undefined&&value!==''&&Number.isFinite(Number(value)))projected++;
  }
 }
 return {total,projected,matchRate:total?projected/total:0};
}

export function buildLeagueSimulationInput(snapshot,{calibrationReport=null,simulations=50000,seed=20260923,modelVariant='correlated',minimumProjectionMatchRate=.9}={}){
 const projectionCoverage=rawProjectionCoverage(snapshot);
 const validation=validateLeagueSnapshot(snapshot);
 if(!validation.valid)throw new Error(`League snapshot validation failed:\n- ${validation.errors.join('\n- ')}`);
 const league=validation.league;
 if(projectionCoverage.matchRate<minimumProjectionMatchRate)throw new Error(`Projection coverage ${(projectionCoverage.matchRate*100).toFixed(1)}% is below required ${(minimumProjectionMatchRate*100).toFixed(1)}%.`);
 const calibration=calibrationReport?calibrationFromReport(calibrationReport):null;
 if(calibrationReport&&!calibrationReady(calibration))throw new Error('Calibration report is missing projection buckets or bias parameters.');
 return {
  teams:league.teams,
  schedule:league.schedule,
  nflGames:league.nflGames||[],
  playoffSpots:league.playoffSpots,
  playoffWeeks:league.playoffWeeks,
  reseed:league.reseed,
  tiebreaker:league.tiebreaker||'points',
  simulations:Number(simulations),seed:Number(seed),modelVariant,calibration,
  metadata:{source:league.source,projectionCoverage,calibrationSource:calibration?.source??null}
 };
}
