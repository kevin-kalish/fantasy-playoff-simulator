import { createSeededRng } from './random.js';
import { rankStandings } from './standings.js';
import { simulatePlayoffs } from './playoffs.js';

const VOLATILITY = { QB:0.27, RB:0.40, WR:0.47, TE:0.48, K:0.45, DEF:0.50 };

function gaussian(rng) {
  let u=0,v=0; while(!u)u=rng(); while(!v)v=rng();
  return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);
}

export function simulatePlayer(projection, position, rng=Math.random, cvOverride=null) {
  const cv=cvOverride ?? VOLATILITY[position] ?? 0.42;
  const sigma=Math.sqrt(Math.log(1+cv*cv));
  const mu=Math.log(Math.max(projection,0.05))-sigma*sigma/2;
  return Math.exp(mu+sigma*gaussian(rng));
}

export function simulateLeague({teams, schedule, playoffSpots=8, simulations=100000, seed=20260923, playoffWeeks=[15,16,17], reseed=true, tiebreaker='points'}) {
  const rng=createSeededRng(seed);
  const out=Object.fromEntries(teams.map(t=>[t.id,{playoffs:0,seeds:Array(teams.length).fill(0),wins:0,championships:0}]));

  for(let n=0;n<simulations;n++) {
    const state=Object.fromEntries(teams.map(t=>[t.id,{wins:t.wins||0,losses:t.losses||0,ties:t.ties||0,points:t.points||0}]));
    for(const week of schedule) {
      const scores={};
      for(const t of teams) {
        const lineup=t.weeklyLineups?.[week.week] || t.lineup || [];
        scores[t.id]=lineup.reduce((sum,p)=>sum+simulatePlayer(p.projection||0,p.position,rng,p.cv),0);
        state[t.id].points += scores[t.id];
      }
      for(const [a,b] of week.matchups) {
        const forced=week.forcedWinners?.[`${a}:${b}`] || week.forcedWinners?.[`${b}:${a}`];
        if(forced===a || (!forced && scores[a]>scores[b])) { state[a].wins++; state[b].losses++; }
        else if(forced===b || (!forced && scores[b]>scores[a])) { state[b].wins++; state[a].losses++; }
        else { state[a].ties++; state[b].ties++; }
      }
    }

    const ranked=rankStandings(teams,state,{tiebreaker});
    ranked.forEach((t,i)=>{ out[t.id].seeds[i]++; out[t.id].wins += state[t.id].wins; if(i<playoffSpots) out[t.id].playoffs++; });

    const qualifiers=ranked.slice(0,playoffSpots);
    const postseason=simulatePlayoffs({qualifiers,weeks:playoffWeeks,simulatePlayer,rng,reseed});
    if(postseason.champion) out[postseason.champion.id].championships++;
  }

  return teams.map(t=>({
    id:t.id,
    name:t.name,
    simulations,
    seed,
    playoffProbability:out[t.id].playoffs/simulations,
    championshipProbability:out[t.id].championships/simulations,
    averageWins:out[t.id].wins/simulations,
    seedProbability:out[t.id].seeds.map(x=>x/simulations)
  }));
}
