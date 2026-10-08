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

export function buildWeeklyMatchupIntelligence(input,{teamId,week,simulations=null,seed=null,trust={},impactSimulations=null,baselineResults=null}={}){
 const gate=requireSimulationTrust(input,trust),found=matchupFor(input,teamId,week);if(!found)return null;
 const team=input.teams.find(t=>String(t.id)===String(teamId)),opponent=input.teams.find(t=>String(t.id)===String(found.opponentId));if(!team||!opponent)throw new Error('Weekly matchup references an unknown team.');
 const n=Math.max(1,Number(simulations||Math.min(input.simulations||5000,10000))),rng=createSeededRng(Number(seed??input.seed)),variant=getModelVariant(input.modelVariant||'correlated'),nflGameIndex=buildNFLGameIndex(input.nflGames||[]);let wins=0,ties=0,teamScore=0,opponentScore=0;
 for(let i=0;i<n;i++){const correlationContext=variant.correlation?createCorrelationContext(rng):null,opts={firstWeek:Number(week),nflGameIndex,correlationContext,variant,calibration:input.calibration||null},a=simulateTeamScore(team,Number(week),rng,opts),b=simulateTeamScore(opponent,Number(week),rng,opts);teamScore+=a;opponentScore+=b;if(a>b)wins++;else if(a===b)ties++;}
 const impactN=Math.max(1,Number(impactSimulations??Math.min(input.simulations||5000,5000)));
 const impactInput={...input,simulations:impactN};
 const baseline=focus(baselineResults??simulateLeague(impactInput),teamId),win=focus(simulateLeague({...forceWinner(input,week,found.pair,team.id),simulations:impactN}),teamId),loss=focus(simulateLeague({...forceWinner(input,week,found.pair,opponent.id),simulations:impactN}),teamId);
 return {week:Number(week),teamId:team.id,opponentId:opponent.id,opponentName:opponent.name,projected:{team:sumProjection(team,week),opponent:sumProjection(opponent,week),margin:sumProjection(team,week)-sumProjection(opponent,week)},simulated:{teamMean:teamScore/n,opponentMean:opponentScore/n,winProbability:(wins+ties*.5)/n,simulations:n,seed:Number(seed??input.seed)},impact:{baseline:{playoffProbability:baseline.playoffProbability,championshipProbability:baseline.championshipProbability,averageWins:baseline.averageWins},win:{playoffProbability:win.playoffProbability,championshipProbability:win.championshipProbability,averageWins:win.averageWins,delta:delta(baseline,win)},loss:{playoffProbability:loss.playoffProbability,championshipProbability:loss.championshipProbability,averageWins:loss.averageWins,delta:delta(baseline,loss)},simulations:impactN},trust:gate};
}

/** Lightweight schedule forecasts; no conditional playoff-impact simulations. */
export function forecastRemainingMatchups(input,{teamId,week,simulations=1000}={}){
 const team=input.teams.find(t=>String(t.id)===String(teamId));
 if(!team)throw new Error('Unknown forecast team');
 const n=Math.max(1,Math.min(5000,Math.floor(Number(simulations)||1000)));
 const direct=new Set(input.metadata?.directProjectionWeeks??[]);
 const variant=getModelVariant(input.modelVariant||'correlated');
 const nflGameIndex=buildNFLGameIndex(input.nflGames||[]);
 return (input.schedule??[]).filter(row=>Number(row.week)>=Number(week))
  .sort((a,b)=>Number(a.week)-Number(b.week)).flatMap(row=>(row.matchups??[])
   .filter(pair=>Array.isArray(pair)&&pair.length===2&&pair.some(id=>String(id)===String(teamId)))
   .map(pair=>{
    const opponentId=String(pair[0])===String(teamId)?String(pair[1]):String(pair[0]);
    const opponent=input.teams.find(t=>String(t.id)===opponentId);
    if(!opponent)throw new Error('Unknown forecast opponent');
    const targetWeek=Number(row.week);
    const rng=createSeededRng(Number(input.seed??1)+targetWeek*1009);
    let wins=0,ties=0;
    for(let i=0;i<n;i++){
     const correlationContext=variant.correlation?createCorrelationContext(rng):null;
     const opts={firstWeek:targetWeek,nflGameIndex,correlationContext,variant,calibration:input.calibration||null};
     const a=simulateTeamScore(team,targetWeek,rng,opts),b=simulateTeamScore(opponent,targetWeek,rng,opts);
     if(a>b)wins++;else if(a===b)ties++;
    }
    return {week:targetWeek,opponentId,opponentName:String(opponent.name),
     winProbability:(wins+ties*.5)/n,simulations:n,
     projectionSource:direct.has(targetWeek)?'direct':'derived'};
   }));
}

/** Conditional qualification impact of each future scheduled result.
 * Uses common seeded simulations for baseline, forced win and forced loss.
 * Scores are scenario estimates; do not interpret as causal guarantees.
 */
export function rankRemainingMatchupImpact(input,{teamId,week,simulations=500,baselineResults=null}={}){
 const n=Math.max(1,Math.min(2000,Math.floor(Number(simulations)||500)));
 const baseline=focus(baselineResults??simulateLeague({...input,simulations:n}),teamId);
 if(!baseline)throw new Error('Missing baseline team');
 const forecasts=forecastRemainingMatchups(input,{teamId,week,simulations:Math.min(n,1000)});
 const impacts=forecasts.map(game=>{
  const row=(input.schedule??[]).find(entry=>Number(entry.week)===game.week);
  const pair=row?.matchups?.find(ids=>ids.some(id=>String(id)===String(teamId))&&ids.some(id=>String(id)===game.opponentId));
  if(!pair)throw new Error('Missing schedule pair');
  const win=focus(simulateLeague({...forceWinner(input,game.week,pair,teamId),simulations:n}),teamId);
  const loss=focus(simulateLeague({...forceWinner(input,game.week,pair,game.opponentId),simulations:n}),teamId);
  return {...game,playoffImpact:{
   ifWin:win.playoffProbability,ifLoss:loss.playoffProbability,
   swing:win.playoffProbability-loss.playoffProbability,
   simulations:n
  }};
 });
 return impacts.sort((a,b)=>b.playoffImpact.swing-a.playoffImpact.swing||a.week-b.week);
}
