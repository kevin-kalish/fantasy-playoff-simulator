// Correlated outcome model. Coefficients are deliberately conservative defaults
// until historical backtesting can calibrate them.
export const DEFAULT_CORRELATION = {
  gameEnvironment: 0.12,
  teamOffense: 0.18,
  qbPassCatcher: 0.16,
  opponentEnvironment: 0.08,
  futureWeekUncertaintyPerWeek: 0.025,
  maxFutureUncertainty: 0.18
};

export function normal(rng=Math.random){
  let u=0,v=0; while(!u)u=rng(); while(!v)v=rng();
  return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);
}

export function createGameFactors(rng=Math.random){
  return { game:normal(rng), home:normal(rng), away:normal(rng), passing:normal(rng) };
}

export function correlatedMeanMultiplier({position,side='home',factors,config=DEFAULT_CORRELATION,weeksAhead=0}){
  if(!factors) return 1;
  const team=factors[side]||0;
  const pass=['QB','WR','TE'].includes(position) ? factors.passing : 0;
  const raw=config.gameEnvironment*factors.game + config.teamOffense*team + config.qbPassCatcher*pass;
  const horizon=Math.min(config.maxFutureUncertainty,weeksAhead*config.futureWeekUncertaintyPerWeek);
  return Math.max(0.55,1 + raw + horizon*normal(()=>0.5));
}
