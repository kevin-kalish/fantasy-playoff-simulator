import {performance} from 'node:perf_hooks';
import {forecastRemainingMatchups,rankRemainingMatchupImpact} from '../src/model/weekly-matchup-intelligence.js';

const teamCount=10,firstWeek=8,lastWeek=14,simulations=Number(process.argv[2]??200);
if(!Number.isInteger(simulations)||simulations<1||simulations>2000)throw new Error('Simulations must be an integer from 1 to 2000');
const teams=Array.from({length:teamCount},(_,i)=>{
 const id='T'+i,weeklyLineups={};
 for(let week=firstWeek;week<=lastWeek+2;week++)weeklyLineups[week]=[
  {id:id+'-QB',name:id+' QB',position:'QB',projection:17+i*.4,nflTeam:'BUF'},
  {id:id+'-RB',name:id+' RB',position:'RB',projection:13+i*.2,nflTeam:'NE'},
  {id:id+'-WR',name:id+' WR',position:'WR',projection:12+i*.3,nflTeam:'KC'}
 ];
 return {id,name:'Synthetic '+id,wins:4+(i%3),losses:3-(i%3),points:700+i*15,weeklyLineups};
});
const schedule=Array.from({length:lastWeek-firstWeek+1},(_,j)=>{
 const ids=teams.map(t=>t.id),matchups=[];
 for(let i=0;i<teamCount/2;i++)matchups.push([ids[i],ids[teamCount-1-i]]);
 return {week:firstWeek+j,matchups};
});
const input={teams,schedule,playoffSpots:8,playoffWeeks:[15,16,17],simulations,seed:2026,modelVariant:'baseline',tiebreaker:'points',metadata:{directProjectionWeeks:[8],longRangeProjectionWeeks:[9,10,11,12,13,14]}};
const measure=fn=>{const start=performance.now(),result=fn();return {ms:Math.round(performance.now()-start),result};};
const forecasts=measure(()=>forecastRemainingMatchups(input,{teamId:'T0',week:firstWeek,simulations}));
const impact=measure(()=>rankRemainingMatchupImpact(input,{teamId:'T0',week:firstWeek,simulations}));
if(impact.result.length!==7||impact.result.some(g=>!Number.isFinite(g.playoffImpact.swing)))throw new Error('Invalid impact output');
console.log(JSON.stringify({benchmark:'synthetic-10-team',simulations,matchups:impact.result.length,forecastMs:forecasts.ms,impactMs:impact.ms,rankedWeeks:impact.result.map(g=>g.week)},null,2));
