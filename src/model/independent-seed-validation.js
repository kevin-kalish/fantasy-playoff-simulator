import {simulateLeague} from '../simulator.js';

// Replicate the same frozen simulation input with distinct deterministic seeds.
// This measures Monte Carlo sampling stability, NOT forecast calibration.
export function validateIndependentSeeds(input,{runs=3,simulations=50000,seedStep=100003,focusTeamId=null}={}){
 if(!Number.isInteger(runs)||runs<2||runs>20)throw new Error('runs must be an integer from 2 to 20');
 if(!Number.isInteger(simulations)||simulations<100||simulations>1000000)throw new Error('simulations must be an integer from 100 to 1,000,000');
 if(!Number.isInteger(seedStep)||seedStep===0)throw new Error('seedStep must be a nonzero integer');
 const baseSeed=Number(input.seed);
 if(!Number.isSafeInteger(baseSeed))throw new Error('input seed must be a safe integer');
 const seeds=Array.from({length:runs},(_,i)=>baseSeed+i*seedStep);
 if(!seeds.every(Number.isSafeInteger)||new Set(seeds).size!==runs)throw new Error('independent seeds must be distinct safe integers');
 const results=seeds.map(seed=>simulateLeague({...input,seed,simulations}));
 const ids=input.teams.map(t=>String(t.id));
 if(focusTeamId!=null&&!ids.includes(String(focusTeamId)))throw new Error('Unknown focusTeamId');
 const summarize=values=>{
  const mean=values.reduce((s,v)=>s+v,0)/values.length;
  const min=Math.min(...values),max=Math.max(...values);
  const standardDeviation=Math.sqrt(values.reduce((s,v)=>s+(v-mean)**2,0)/(values.length-1));
  return {mean,min,max,range:max-min,standardDeviation};
 };
 const teams=ids.filter(id=>focusTeamId==null||id===String(focusTeamId)).map(id=>{
  const values=results.map((r,i)=>{const team=r.find(t=>String(t.id)===id);if(!team)throw new Error('Missing team from seed run');return {seed:seeds[i],playoffProbability:team.playoffProbability,championshipProbability:team.championshipProbability,averageWins:team.averageWins};});
  const playoff=summarize(values.map(v=>v.playoffProbability)),championship=summarize(values.map(v=>v.championshipProbability)),wins=summarize(values.map(v=>v.averageWins));
  // Approximate 95% two-sided sampling tolerance for differences between two
  // independent binomial runs, using worst-case p=.5 and a 3-sigma margin.
  const conservativeTolerance=3*Math.sqrt(.5/simulations);
  return {id,name:input.teams.find(t=>String(t.id)===id)?.name??id,playoff,championship,wins,runs:values,stability:{samplingTolerance:conservativeTolerance,playoffWithinTolerance:playoff.range<=conservativeTolerance,championshipWithinTolerance:championship.range<=conservativeTolerance}};
 });
 return {schemaVersion:1,method:'independent-seed-replication',scope:'Monte Carlo sampling consistency only; not historical calibration, injury reliability, or forecast accuracy',simulationsPerRun:simulations,runCount:runs,seeds,teams};
}
