import {simulateLeague,simulateTeamScore} from '../simulator.js';
import {createSeededRng} from '../random.js';
import {getModelVariant} from './model-variants.js';
import {buildNFLGameIndex} from './nfl-games.js';
import {createCorrelationContext} from './correlation.js';
import {requireSimulationTrust} from './simulation-trust-gate.js';

const clone=x=>structuredClone(x);
const sumProjection=(team,week)=>(team.weeklyLineups?.[week]||team.lineup||[]).reduce((s,p)=>s+Number(p.projection||0),0);
function matchupFor(input,teamId,week){const row=input.schedule.find(x=>Number(x.week)===Number(week));if(!row)return null;const pair=row.matchups.find(([a,b])=>String(a)===String(teamId)||String(b)===String(teamId));if(!pair)return null;return {row,pair,opponentId:String(pair[0])===String(teamId)?pair[1]:pair[0]};}
function forceWinner(input,week,pair,winner){const next=clone(input),row=next.schedule.find(x=>Number(x.week)===Number(week));row.forcedWinners={...(row.forcedWinners||{}),[`${pair[0]}:${pair[1]}`]:winner};return next;}
function focus(results,teamId){return results.find(r=>String(r.id)===String(teamId));}
function delta(a,b){return {playoffProbability:b.playoffProbability-a.playoffProbability,championshipProbability:b.championshipProbability-a.championshipProbability,averageWins:b.averageWins-a.averageWins};}

export function buildWeeklyMatchupIntelligence(input,{teamId,week,simulations=null,seed=null,trust={}}={}){
 const gate=requireSimulationTrust(input,trust),found=matchupFor(input,teamId,week);if(!found)return null;
 const team=input.teams.find(t=>String(t.id)===String(teamId)),opponent=input.teams.find(t=>String(t.id)===String(found.opponentId));if(!team||!opponent)throw new Error('Weekly matchup references an unknown team.');
 const n=Math.max(1,Number(simulations||Math.min(input.simulations||5000,10000))),rng=createSeededRng(Number(seed??input.seed)),variant=getModelVariant(input.modelVariant||'correlated'),nflGameIndex=buildNFLGameIndex(input.nflGames||[]);let wins=0,ties=0,teamScore=0,opponentScore=0;
 for(let i=0;i<n;i++){const correlationContext=variant.correlation?createCorrelationContext(rng):null,opts={firstWeek:Number(week),nflGameIndex,correlationContext,variant,calibration:input.calibration||null},a=simulateTeamScore(team,Number(week),rng,opts),b=simulateTeamScore(opponent,Number(week),rng,opts);teamScore+=a;opponentScore+=b;if(a>b)wins++;else if(a===b)ties++;}
 const baseline=focus(simulateLeague(input),teamId),win=focus(simulateLeague(forceWinner(input,week,found.pair,team.id)),teamId),loss=focus(simulateLeague(forceWinner(input,week,found.pair,opponent.id)),teamId);
 return {week:Number(week),teamId:team.id,opponentId:opponent.id,opponentName:opponent.name,projected:{team:sumProjection(team,week),opponent:sumProjection(opponent,week),margin:sumProjection(team,week)-sumProjection(opponent,week)},simulated:{teamMean:teamScore/n,opponentMean:opponentScore/n,winProbability:(wins+ties*.5)/n,simulations:n,seed:Number(seed??input.seed)},impact:{baseline:{playoffProbability:baseline.playoffProbability,championshipProbability:baseline.championshipProbability,averageWins:baseline.averageWins},win:{playoffProbability:win.playoffProbability,championshipProbability:win.championshipProbability,averageWins:win.averageWins,delta:delta(baseline,win)},loss:{playoffProbability:loss.playoffProbability,championshipProbability:loss.championshipProbability,averageWins:loss.averageWins,delta:delta(baseline,loss)}},trust:gate};
}
