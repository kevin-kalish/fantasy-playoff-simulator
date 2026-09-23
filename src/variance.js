const POSITION_PRIOR = { QB:0.27, RB:0.40, WR:0.47, TE:0.48, K:0.45, DEF:0.50 };

function mean(xs){ return xs.reduce((a,b)=>a+b,0)/xs.length; }
function sd(xs){ if(xs.length<2)return 0; const m=mean(xs); return Math.sqrt(xs.reduce((s,x)=>s+(x-m)**2,0)/(xs.length-1)); }

// Shrink noisy player-specific volatility toward a position prior.
// Historical scores should be calculated under THIS league's scoring rules.
export function estimateVolatility({position, historicalScores=[], priorWeight=5}) {
  const prior=POSITION_PRIOR[position] ?? 0.42;
  const scores=historicalScores.filter(Number.isFinite);
  if(scores.length<2) return prior;
  const m=Math.max(mean(scores),1);
  const observed=Math.min(sd(scores)/m,1.25);
  return (prior*priorWeight + observed*scores.length)/(priorWeight+scores.length);
}

export function positionPrior(position){ return POSITION_PRIOR[position] ?? 0.42; }
