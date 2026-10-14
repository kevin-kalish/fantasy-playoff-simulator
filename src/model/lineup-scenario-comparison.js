import {simulateLeague} from '../simulator.js';
import {assessSimulationReadiness} from './simulation-readiness.js';

// Explicit what-if: submitted Yahoo starters versus a fully optimized roster.
// This is diagnostic only; it does not certify the submitted lineup as complete.
export function compareLineupScenarios(submitted,optimized,{teamId,week,minimumProjectionMatchRate=.9,simulations=1000}={}){
 const a=assessSimulationReadiness(submitted,{minimumProjectionMatchRate});
 const b=assessSimulationReadiness(optimized,{minimumProjectionMatchRate});
 const incomplete=a.incompleteLineups.filter(x=>Number(x.week)===Number(week));
 if(!incomplete.length)return {status:'skipped',reason:'No incomplete submitted lineup in requested week'};
 if(!b.ready)return {status:'skipped',reason:'Optimized hypothetical did not pass readiness',errors:b.errors};
 if(a.errors.some(x=>!x.includes('optimized team-week lineup(s) are incomplete')))return {status:'skipped',reason:'Submitted scenario has unrelated readiness failures',errors:a.errors};
 const inputA={...submitted.input,simulations},inputB={...optimized.input,simulations};
 if(inputA.seed!==inputB.seed||inputA.modelVariant!==inputB.modelVariant)throw new Error('Scenarios must use identical seed and model variant');
 const resultA=simulateLeague(inputA),resultB=simulateLeague(inputB);
 const lookup=rows=>new Map(rows.map(x=>[String(x.id),x]));
 const before=lookup(resultA),after=lookup(resultB);
 const teams=incomplete.map(({teamId:id,teamName,emptySlots})=>{
  const x=before.get(String(id)),y=after.get(String(id));
  if(!x||!y)throw new Error('Simulation results missing affected team');
  const submittedLineup=submitted.league.teams.find(t=>String(t.id)===String(id))?.weeklyLineups?.[week]??[];
  const optimizedLineup=optimized.league.teams.find(t=>String(t.id)===String(id))?.weeklyLineups?.[week]??[];
  const selected=new Set(submittedLineup.map(p=>String(p.id??p.playerId)));
  const additions=optimizedLineup.filter(p=>!selected.has(String(p.id??p.playerId))).map(p=>({name:p.name,position:p.position,slot:p.lineupSlot,projection:p.projection,projectionStatus:p.projectionStatus}));
  return {teamId:id,teamName,emptySubmittedSlots:emptySlots,submitted:{playoffProbability:x.playoffProbability,championshipProbability:x.championshipProbability,averageWins:x.averageWins},hypothetical:{playoffProbability:y.playoffProbability,championshipProbability:y.championshipProbability,averageWins:y.averageWins},delta:{playoffProbability:y.playoffProbability-x.playoffProbability,championshipProbability:y.championshipProbability-x.championshipProbability,averageWins:y.averageWins-x.averageWins},hypotheticalAdditions:additions};
 });
 return {status:'compared',week,focusTeamId:teamId,simulations,seed:inputA.seed,modelVariant:inputA.modelVariant,scenario:'optimized-hypothetical (not actual Yahoo lineup)',teams,disclaimer:'Both simulations are counterfactual forecasts, not observed outcomes. Optimized lineup may replace multiple starters. Same seed does not guarantee player-level common random numbers.'};
}
