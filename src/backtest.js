import { simulatePlayer } from './simulator.js';

function quantile(values, q) {
  if (!values.length) return null;
  const a=[...values].sort((x,y)=>x-y);
  const pos=(a.length-1)*q, lo=Math.floor(pos), hi=Math.ceil(pos);
  return a[lo] + (a[hi]-a[lo])*(pos-lo);
}

function mean(xs){ return xs.length ? xs.reduce((a,b)=>a+b,0)/xs.length : null; }

export function evaluateForecast({projection, position, actual, draws=5000, rng=Math.random}) {
  const sims=Array.from({length:draws},()=>simulatePlayer(projection, position, rng));
  const p10=quantile(sims,.10), p25=quantile(sims,.25), p50=quantile(sims,.50), p75=quantile(sims,.75), p90=quantile(sims,.90);
  return {
    projection, actual, position,
    simulatedMean: mean(sims), p10,p25,p50,p75,p90,
    absoluteError: Math.abs(projection-actual),
    squaredError: (projection-actual)**2,
    covered50: actual>=p25 && actual<=p75,
    covered80: actual>=p10 && actual<=p90,
    belowP10: actual<p10,
    aboveP90: actual>p90
  };
}

export function summarizeBacktest(rows) {
  const groups={ALL:rows};
  for(const r of rows) (groups[r.position] ||= []).push(r);
  return Object.entries(groups).map(([position,g])=>({
    position,
    n:g.length,
    mae:mean(g.map(x=>x.absoluteError)),
    rmse:Math.sqrt(mean(g.map(x=>x.squaredError))),
    coverage50:mean(g.map(x=>x.covered50?1:0)),
    coverage80:mean(g.map(x=>x.covered80?1:0)),
    lowTailRate:mean(g.map(x=>x.belowP10?1:0)),
    highTailRate:mean(g.map(x=>x.aboveP90?1:0))
  }));
}

// Expected calibration targets: coverage50 ~= .50, coverage80 ~= .80,
// low/high tail rates ~= .10. Deviations tell us whether distributions
// are too narrow/wide or asymmetric.
export function calibrationPenalty(summary) {
  return Math.abs(summary.coverage50-.50) + Math.abs(summary.coverage80-.80) +
    Math.abs(summary.lowTailRate-.10) + Math.abs(summary.highTailRate-.10);
}
