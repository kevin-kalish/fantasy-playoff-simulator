import {simulateLeague} from '../simulator.js';
import {applyStartSitChoice} from './start-sit-evaluator.js';

const stats=xs=>{const mean=xs.reduce((a,b)=>a+b,0)/xs.length;return {mean,min:Math.min(...xs),max:Math.max(...xs),range:Math.max(...xs)-Math.min(...xs),positiveRuns:xs.filter(x=>x>0).length,negativeRuns:xs.filter(x=>x<0).length};};
export function diagnoseStartSit(input,{teamId,week,startPlayerId,sitPlayerId,projectionRows=[],runs=5,simulations=20000,seedStep=100003}){
 if(!Number.isInteger(runs)||runs<2||runs>20)throw new Error('runs must be 2-20');
 if(!Number.isInteger(simulations)||simulations<100||simulations>1000000)throw new Error('invalid simulations');
 if(!Number.isSafeInteger(input.seed)||!Number.isSafeInteger(seedStep)||seedStep===0)throw new Error('invalid seed');
 const team=input.teams.find(t=>String(t.id)===String(teamId));
 if(!team)throw new Error('unknown team');
 const before=team.weeklyLineups?.[week];
 if(!before)throw new Error('unknown lineup week');
 const old=before.find(p=>String(p.id)===String(sitPlayerId));
 const newPlayer=team.roster?.find(p=>String(p.id)===String(startPlayerId));
 if(!old||!newPlayer)throw new Error('players not found');
 const scenario=applyStartSitChoice(input,{teamId,week,startPlayerId,sitPlayerId,projectionRows});
 const after=scenario.teams.find(t=>String(t.id)===String(teamId)).weeklyLineups[week];
 const newStarter=after.find(p=>String(p.id)===String(startPlayerId));
 const laterWeeks=Object.keys(team.weeklyLineups??{}).filter(w=>Number(w)!==Number(week));
 const futureLineupsUnchanged=laterWeeks.every(w=>JSON.stringify(team.weeklyLineups[w])===JSON.stringify(scenario.teams.find(t=>String(t.id)===String(teamId)).weeklyLineups[w]));
 const rows=[];
 for(let i=0;i<runs;i++){
  const seed=input.seed+i*seedStep;
  if(!Number.isSafeInteger(seed))throw new Error('unsafe seed');
  const base=simulateLeague({...input,seed,simulations}).find(t=>String(t.id)===String(teamId));
  const changed=simulateLeague({...scenario,seed,simulations}).find(t=>String(t.id)===String(teamId));
  rows.push({seed,playoffDelta:changed.playoffProbability-base.playoffProbability,championshipDelta:changed.championshipProbability-base.championshipProbability,winsDelta:changed.averageWins-base.averageWins});
 }
 const pointDelta=Number(newStarter.projection??0)-Number(old.projection??0);
 return {action:{teamId,week,start:newStarter.name,sit:old.name},scope:{changedWeekOnly:true,futureLineupsUnchanged},pointDelta,playoff:stats(rows.map(r=>r.playoffDelta)),championship:stats(rows.map(r=>r.championshipDelta)),wins:stats(rows.map(r=>r.winsDelta)),runs:rows,interpretation:'Same-seed reruns are reproducible, but sequential RNG consumption does not guarantee per-player common random numbers. Seed replication measures stability, not causal certainty.'};
}
