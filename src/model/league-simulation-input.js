import {validateLeagueSnapshot} from '../data/league-snapshot.js';
import {calibrationFromReport,calibrationReady} from './calibration-loader.js';

function playerProjectionCount(league){
 let total=0,projected=0;
 for(const team of league.teams||[]){
  const seen=new Set();
  const groups=[team.lineup||[],...Object.values(team.weeklyLineups||{})];
  for(const players of groups)for(const p of players){
   const key=String(p.id||`${p.name}|${p.position}|${p.nflTeam}`);
   if(seen.has(key))continue;seen.add(key);total++;
   if(Number.isFinite(Number(p.projection)))projected++;
  }
 }
 return {total,projected,matchRate:total?projected/total:0};
}

export function buildLeagueSimulationInput(snapshot,{calibrationReport=null,simulations=50000,seed=20260923,modelVariant='correlated',minimumProjectionMatchRate=.9}={}){
 const validation=validateLeagueSnapshot(snapshot);
 if(!validation.valid)throw new Error(`League snapshot validation failed:\n- ${validation.errors.join('\n- ')}`);
 const league=validation.league,projectionCoverage=playerProjectionCount(league);
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
