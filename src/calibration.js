const DEFAULT_CV={QB:.27,RB:.40,WR:.47,TE:.48,K:.45,DEF:.50};

function mean(xs){return xs.length?xs.reduce((a,b)=>a+b,0)/xs.length:0;}
function sd(xs){if(xs.length<2)return null; const m=mean(xs); return Math.sqrt(xs.reduce((s,x)=>s+(x-m)**2,0)/(xs.length-1));}

export function historicalCV(games, {maxGames=12,minGames=4}={}) {
  const vals=games.slice(-maxGames).map(g=>g.points).filter(Number.isFinite);
  if(vals.length<minGames) return null;
  const m=mean(vals), s=sd(vals);
  return m>1 && s!=null ? s/m : null;
}

export function blendedCV({position, priorGames=[], positionCV, shrinkGames=8}) {
  const fallback=positionCV?.[position] ?? DEFAULT_CV[position] ?? .42;
  const player=historicalCV(priorGames);
  if(player==null) return fallback;
  // Empirical-Bayes-style shrinkage: sparse player histories stay close to the
  // position prior; player-specific behavior receives more weight over time.
  const n=Math.min(priorGames.length,12), w=n/(n+shrinkGames);
  return Math.max(.12,Math.min(1.10,w*player+(1-w)*fallback));
}

export function buildRollingFeatures(records) {
  // Critical backtest rule: a Week N forecast may use only games before Week N.
  const ordered=[...records].sort((a,b)=>a.season-b.season || a.week-b.week);
  const history=new Map();
  return ordered.map(r=>{
    const prior=[...(history.get(r.playerId)||[])];
    const row={...r, priorGames:prior};
    if(Number.isFinite(r.actualPoints)) {
      prior.push({season:r.season,week:r.week,points:r.actualPoints});
      history.set(r.playerId,prior);
    }
    return row;
  });
}

export function positionCVFromHistory(records,{minProjection=4}={}) {
  const by={};
  for(const r of records) {
    if(!Number.isFinite(r.actualPoints) || r.actualPoints<0) continue;
    (by[r.position] ||= []).push(r.actualPoints);
  }
  const out={};
  for(const [pos,vals] of Object.entries(by)) {
    const m=mean(vals), s=sd(vals);
    if(m>=minProjection && s!=null) out[pos]=s/m;
  }
  return out;
}
