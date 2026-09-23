import { scoreOffense } from "../scoring.js";

export function historicalFantasyPoints(row) {
  return scoreOffense({
    passYds: row.passingYards,
    passTD: row.passingTDs,
    interceptions: row.interceptions,
    rushYds: row.rushingYards,
    rushTD: row.rushingTDs,
    receptions: row.receptions,
    recYds: row.receivingYards,
    recTD: row.receivingTDs,
    fumblesLost: row.fumblesLost
  });
}

export function mean(xs) { return xs.length ? xs.reduce((a,b)=>a+b,0)/xs.length : 0; }
export function stdev(xs) {
  if (xs.length < 2) return 0;
  const m=mean(xs);
  return Math.sqrt(xs.reduce((s,x)=>s+(x-m)**2,0)/(xs.length-1));
}

export function coefficientOfVariation(points, {minimumMean=3}={}) {
  const usable=points.filter(Number.isFinite);
  const m=mean(usable);
  return m < minimumMean ? null : stdev(usable)/m;
}

export function calibratePlayer(rows, {recentGames=16, minimumGames=6}={}) {
  const games=[...rows]
    .sort((a,b)=>a.season-b.season || a.week-b.week)
    .slice(-recentGames);
  const points=games.map(historicalFantasyPoints);
  if (points.length < minimumGames) return null;
  return { games:points.length, mean:mean(points), stdev:stdev(points), cv:coefficientOfVariation(points) };
}

export function calibratePosition(rows, position) {
  const byPlayer=new Map();
  for (const r of rows.filter(x=>x.position===position)) {
    if (!byPlayer.has(r.playerId)) byPlayer.set(r.playerId,[]);
    byPlayer.get(r.playerId).push(r);
  }
  const cvs=[];
  for (const games of byPlayer.values()) {
    const c=calibratePlayer(games);
    if (c?.cv != null && c.cv < 2.5) cvs.push(c.cv);
  }
  return { position, players:cvs.length, medianCV:quantile(cvs,.5), p25CV:quantile(cvs,.25), p75CV:quantile(cvs,.75) };
}

function quantile(xs,q) {
  if (!xs.length) return null;
  const a=[...xs].sort((x,y)=>x-y), p=(a.length-1)*q, lo=Math.floor(p), hi=Math.ceil(p);
  return a[lo]+(a[hi]-a[lo])*(p-lo);
}
