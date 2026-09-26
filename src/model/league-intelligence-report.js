import {simulateLeague} from '../simulator.js';
import {buildWeeklyGMRecommendations} from './gm-recommendation-engine.js';
import {buildWeeklyMatchupIntelligence} from './weekly-matchup-intelligence.js';
import {buildPlayoffLeverageIntelligence} from './playoff-leverage.js';
import {requireSimulationTrust} from './simulation-trust-gate.js';

const num=x=>Number.isFinite(Number(x))?Number(x):0;
function currentSeed(input,teamId){return [...input.teams].sort((a,b)=>num(b.wins)-num(a.wins)||num(b.points)-num(a.points)||String(a.name).localeCompare(String(b.name))).findIndex(t=>String(t.id)===String(teamId))+1;}
function rosterSummary(team,week){const lineup=team.weeklyLineups?.[week]||team.lineup||[];return {playerCount:(team.roster||lineup).length,starters:lineup.map(p=>({id:p.id??p.playerId,name:p.name??p.playerName,position:p.position??p.pos,slot:p.lineupSlot??p.slot??null,projection:num(p.projection??p.projectedPoints)}))};}
function seedDistribution(result){return (result.seedProbability||[]).map((probability,i)=>({seed:i+1,probability})).filter(x=>x.probability>0);}

export function buildLeagueIntelligenceReport(input,{teamId,week,projectionRows=[],waivers=null,trades=[],startSit=true,limit=10,validation={},trust={}}={}){
 const gate=requireSimulationTrust(input,trust);
 const team=input.teams.find(t=>String(t.id)===String(teamId));if(!team)throw new Error(`Unknown team: ${teamId}`);
 const seedNow=currentSeed(input,teamId),results=simulateLeague(input),outlook=results.find(r=>String(r.id)===String(teamId));
 const matchup=buildWeeklyMatchupIntelligence(input,{teamId,week,trust});
 const leverage=buildPlayoffLeverageIntelligence({outlook,matchup,currentSeed:seedNow,playoffSpots:input.playoffSpots,week,playoffWeeks:input.playoffWeeks||[]});
 const gm=buildWeeklyGMRecommendations(input,{teamId,week,projectionRows,waivers,trades,startSit,limit,validation,leverage},{throwOnInvalid:true,trust});
 return {
  schemaVersion:4,
  generatedAt:new Date().toISOString(),
  team:{id:team.id,name:team.name,record:{wins:num(team.wins),losses:num(team.losses),ties:num(team.ties)},points:num(team.points),currentSeed:seedNow},
  league:{teamCount:input.teams.length,playoffSpots:input.playoffSpots,playoffWeeks:[...(input.playoffWeeks||[])],reseed:Boolean(input.reseed),tiebreaker:input.tiebreaker},
  outlook:{playoffProbability:outlook.playoffProbability,championshipProbability:outlook.championshipProbability,averageWins:outlook.averageWins,seedDistribution:seedDistribution(outlook),simulations:outlook.simulations,seed:outlook.seed,modelVariant:outlook.modelVariant},
  matchup,
  leverage,
  recommendations:{actionCount:gm.actionCount,strategy:gm.strategy,validation:gm.validation,items:gm.recommendations},
  roster:rosterSummary(team,week),
  trust:{trusted:gate.trusted,auditPassed:gate.auditPassed,projectionCoverage:input.metadata?.projectionCoverage??null,source:input.metadata?.source??null}
 };
}
