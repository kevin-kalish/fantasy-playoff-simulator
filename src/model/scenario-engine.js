import {simulateLeague} from '../simulator.js';
import {requireSimulationTrust} from './simulation-trust-gate.js';

const clone=x=>structuredClone(x);
function byId(results){return Object.fromEntries(results.map(r=>[r.id,r]));}
export function compareSimulationInputs(baselineInput,scenarioInput,{teamId=null,trust=null}={}){
 const trustResult=requireSimulationTrust(baselineInput,trust||{});
 const baseline=simulateLeague(baselineInput),scenario=simulateLeague({...scenarioInput,seed:baselineInput.seed,simulations:baselineInput.simulations});
 const a=byId(baseline),b=byId(scenario);
 const deltas=baseline.map(row=>({id:row.id,name:row.name,playoffProbability:b[row.id].playoffProbability,playoffProbabilityDelta:b[row.id].playoffProbability-row.playoffProbability,championshipProbability:b[row.id].championshipProbability,championshipProbabilityDelta:b[row.id].championshipProbability-row.championshipProbability,averageWins:b[row.id].averageWins,averageWinsDelta:b[row.id].averageWins-row.averageWins}));
 return {teamId,simulations:baselineInput.simulations,seed:baselineInput.seed,trust:trustResult,baseline,scenario,deltas,focus:teamId?deltas.find(x=>x.id===teamId)||null:null};
}
export function applyLineupScenario(input,{teamId,week,removePlayerId=null,addPlayer}){
 const next=clone(input),team=next.teams.find(t=>t.id===teamId);if(!team)throw new Error(`Unknown team ${teamId}`);
 const lineup=team.weeklyLineups?.[week];if(!lineup)throw new Error(`No lineup for team ${teamId} week ${week}`);
 let index=removePlayerId?lineup.findIndex(p=>p.id===removePlayerId):-1;
 if(index<0&&addPlayer?.position)index=lineup.findIndex(p=>p.position===addPlayer.position);
 if(index<0)throw new Error(`No replaceable lineup player for team ${teamId} week ${week}`);
 lineup[index]={...addPlayer};return next;
}
export function applyRosterProjectionScenario(input,{teamId,playerId,weeks=null,projectionDelta=0,projectionMultiplier=1}){
 const next=clone(input),team=next.teams.find(t=>t.id===teamId);if(!team)throw new Error(`Unknown team ${teamId}`);let changed=0;
 for(const [week,lineup] of Object.entries(team.weeklyLineups||{})){if(weeks&& !weeks.includes(Number(week)))continue;for(const p of lineup)if(p.id===playerId){p.projection=Math.max(0,(p.projection||0)*projectionMultiplier+projectionDelta);changed++;}}
 if(!changed)throw new Error(`Player ${playerId} not found in selected weekly lineups for ${teamId}`);return next;
}
