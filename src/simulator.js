import { createSeededRng } from './random.js';
import { rankStandings } from './standings.js';
import { simulatePlayoffs } from './playoffs.js';
import { availableThisWeek } from './model/availability.js';
import { createGameFactors, DEFAULT_CORRELATION } from './model/correlation.js';

const VOLATILITY={QB:.27,RB:.40,WR:.47,TE:.48,K:.45,DEF:.50};
function gaussian(rng){let u=0,v=0;while(!u)u=rng();while(!v)v=rng();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v)}
function clamp(x,lo,hi){return Math.max(lo,Math.min(hi,x))}

export function simulatePlayer(projection,position,rng=Math.random,cvOverride=null,{meanMultiplier=1,weeksAhead=0}={}){
  const baseCv=cvOverride??VOLATILITY[position]??.42;
  const horizon=Math.min(.18,Math.max(0,weeksAhead)*DEFAULT_CORRELATION.futureWeekUncertaintyPerWeek);
  const cv=Math.sqrt(baseCv*baseCv+horizon*horizon);
  const mean=Math.max(.05,projection*meanMultiplier);
  const sigma=Math.sqrt(Math.log(1+cv*cv)),mu=Math.log(mean)-sigma*sigma/2;
  return Math.exp(mu+sigma*gaussian(rng));
}

function correlatedMultiplier(player,side,factors){
  const pos=player.position,game=DEFAULT_CORRELATION.gameEnvironment*factors.game,team=DEFAULT_CORRELATION.teamOffense*factors[side];
  const pass=['QB','WR','TE'].includes(pos)?DEFAULT_CORRELATION.qbPassCatcher*factors.passing:0;
  return clamp(1+game+team+pass,.55,1.55);
}

export function simulateTeamScore(team,week,rng,{side='home',factors=null,firstWeek=null}={}){
  const lineup=team.weeklyLineups?.[week]||team.lineup||[],f=factors||createGameFactors(rng),weeksAhead=Math.max(0,week-(firstWeek??week));
  return lineup.reduce((sum,p)=>{
    if(!availableThisWeek(p,week,rng))return sum;
    return sum+simulatePlayer(p.projection||0,p.position,rng,p.cv,{meanMultiplier:correlatedMultiplier(p,side,f),weeksAhead});
  },0);
}

export function simulateLeague({teams,schedule,playoffSpots=8,simulations=100000,seed=20260923,playoffWeeks=[15,16,17],reseed=true,tiebreaker='points'}){
  const rng=createSeededRng(seed),firstWeek=schedule.length?Math.min(...schedule.map(w=>w.week)):null;
  const out=Object.fromEntries(teams.map(t=>[t.id,{playoffs:0,seeds:Array(teams.length).fill(0),wins:0,championships:0}]));
  for(let n=0;n<simulations;n++){
    const state=Object.fromEntries(teams.map(t=>[t.id,{wins:t.wins||0,losses:t.losses||0,ties:t.ties||0,points:t.points||0}]));
    for(const week of schedule){
      const scores={};
      for(const [a,b] of week.matchups){
        const factors=createGameFactors(rng),ta=teams.find(t=>t.id===a),tb=teams.find(t=>t.id===b);
        scores[a]=simulateTeamScore(ta,week.week,rng,{side:'home',factors,firstWeek});scores[b]=simulateTeamScore(tb,week.week,rng,{side:'away',factors,firstWeek});
        state[a].points+=scores[a];state[b].points+=scores[b];
        const forced=week.forcedWinners?.[`${a}:${b}`]||week.forcedWinners?.[`${b}:${a}`];
        if(forced===a||(!forced&&scores[a]>scores[b])){state[a].wins++;state[b].losses++}else if(forced===b||(!forced&&scores[b]>scores[a])){state[b].wins++;state[a].losses++}else{state[a].ties++;state[b].ties++}
      }
    }
    const ranked=rankStandings(teams,state,{tiebreaker});
    ranked.forEach((t,i)=>{out[t.id].seeds[i]++;out[t.id].wins+=state[t.id].wins;if(i<playoffSpots)out[t.id].playoffs++});
    const postseason=simulatePlayoffs({qualifiers:ranked.slice(0,playoffSpots),weeks:playoffWeeks,simulatePlayer,rng,reseed});if(postseason.champion)out[postseason.champion.id].championships++;
  }
  return teams.map(t=>({id:t.id,name:t.name,simulations,seed,playoffProbability:out[t.id].playoffs/simulations,championshipProbability:out[t.id].championships/simulations,averageWins:out[t.id].wins/simulations,seedProbability:out[t.id].seeds.map(x=>x/simulations)}));
}
