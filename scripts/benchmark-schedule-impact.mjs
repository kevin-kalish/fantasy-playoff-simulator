import {performance} from 'node:perf_hooks';
import {forecastRemainingMatchups,rankRemainingMatchupImpact} from '../src/model/weekly-matchup-intelligence.js';

const teamCount=10,firstWeek=8,lastWeek=14,focusTeam='T8',simulations=Number(process.argv[2]??200);
if(!Number.isInteger(simulations)||simulations<1||simulations>2000)throw new Error('Simulations must be an integer from 1 to 2000');
const teams=Array.from({length:teamCount},(_,i)=>{
 const id='T'+i,weeklyLineups={};
 for(let week=firstWeek;week<=lastWeek+2;week++)weeklyLineups[week]=[
  {id:id+'-QB',name:id+' QB',position:'QB',projection:17+(i%3)*.35,nflTeam:'BUF'},
  {id:id+'-RB',name:id+' RB',position:'RB',projection:13+(i%4)*.25,nflTeam:'NE'},
  {id:id+'-WR',name:id+' WR',position:'WR',projection:12+(i%5)*.2,nflTeam:'KC'}
 ];
 return {id,name:'Synthetic '+id,wins:i>=8?3:4,losses:i>=8?4:3,points:700+i*15,weeklyLineups};
});
const schedule=Array.from({length:lastWeek-firstWeek+1},(_,j)=>{
 const ids=teams.map(t=>t.id),matchups=[];
 const rotation=[ids[0],...ids.slice(1+j),...ids.slice(1,1+j)];
 for(let i=0;i<teamCount/2;i++)matchups.push([rotation[i],rotation[teamCount-1-i]]);
 return {week:firstWeek+j,matchups};
});
const input={teams,schedule,playoffSpots:8,playoffWeeks:[15,16,17],simulations,seed:2026,modelVariant:'correlated',tiebreaker:'points',metadata:{directProjectionWeeks:[8],longRangeProjectionWeeks:[9,10,11,12,13,14]}};
const measure=fn=>{const start=performance.now(),result=fn();return {ms:Math.round(performance.now()-start),result};};
const forecasts=measure(()=>forecastRemainingMatchups(input,{teamId:focusTeam,week:firstWeek,simulations}));
const impact=measure(()=>rankRemainingMatchupImpact(input,{teamId:focusTeam,week:firstWeek,simulations}));
const replicateSeeds=[2027,2028,2029];
const stability=measure(()=>replicateSeeds.map(seed=>rankRemainingMatchupImpact(input,{teamId:focusTeam,week:firstWeek,simulations,seed})));
const byWeek=new Map(impact.result.map(g=>[g.week,g.playoffImpact.swing]));
const titleByWeek=new Map(impact.result.map(g=>[g.week,g.playoffImpact.championshipSwing]));
const ranges=impact.result.map(g=>{const values=[byWeek.get(g.week),...stability.result.map(run=>run.find(x=>x.week===g.week).playoffImpact.swing)];return {week:g.week,minSwing:Math.min(...values),maxSwing:Math.max(...values),range:Math.max(...values)-Math.min(...values)};});
const championshipRanges=impact.result.map(g=>{const values=[titleByWeek.get(g.week),...stability.result.map(run=>run.find(x=>x.week===g.week).playoffImpact.championshipSwing)];return {week:g.week,minSwing:Math.min(...values),maxSwing:Math.max(...values),range:Math.max(...values)-Math.min(...values)};});
const championshipTopWeek=impact.result.reduce((best,g)=>g.playoffImpact.championshipSwing>best.playoffImpact.championshipSwing?g:best).week;
const championshipTopAgreement=1+stability.result.filter(run=>run.reduce((best,g)=>g.playoffImpact.championshipSwing>best.playoffImpact.championshipSwing?g:best).week===championshipTopWeek).length;
const topWeekAgreement=stability.result.filter(run=>run[0].week===impact.result[0].week).length;
const nonZeroSwings=impact.result.filter(g=>Math.abs(g.playoffImpact.swing)>1e-9).length;
const informative=nonZeroSwings>0;
if(!informative)throw new Error('Benchmark invalid: no nonzero playoff swings; check fixture and model variant.');

if(impact.result.length!==7||impact.result.some(g=>!Number.isFinite(g.playoffImpact.swing)))throw new Error('Invalid impact output');
console.log(JSON.stringify({benchmark:'synthetic-10-team',simulations,matchups:impact.result.length,focusTeam,nonZeroSwings,informative,forecastMs:forecasts.ms,impactMs:impact.ms,rankedWeeks:impact.result.map(g=>g.week),stability:{replications:4,additionalMs:stability.ms,topWeekAgreement:informative?topWeekAgreement+1:null,topWeekTotal:4,largestSwingRange:Math.max(...ranges.map(x=>x.range)),byWeek:ranges},championshipStability:{replications:4,topWeek:championshipTopWeek,topWeekAgreement:championshipTopAgreement,topWeekTotal:4,largestSwingRange:Math.max(...championshipRanges.map(x=>x.range)),byWeek:championshipRanges}},null,2));
