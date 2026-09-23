// Correlated outcome model. Coefficients are conservative development priors.
export const DEFAULT_CORRELATION={gameEnvironment:.12,teamOffense:.18,qbPassCatcher:.16,opponentEnvironment:.08,futureWeekUncertaintyPerWeek:.025,maxFutureUncertainty:.18};
export function normal(rng=Math.random){let u=0,v=0;while(!u)u=rng();while(!v)v=rng();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v)}
export function createGameFactors(rng=Math.random){return{game:normal(rng),home:normal(rng),away:normal(rng),homePassing:normal(rng),awayPassing:normal(rng)}}
export function createCorrelationContext(rng=Math.random){
 const games=new Map();
 return {forGame(gameId){if(!games.has(gameId))games.set(gameId,createGameFactors(rng));return games.get(gameId)},size(){return games.size}};
}
export function correlatedMeanMultiplier({position,side='home',factors,config=DEFAULT_CORRELATION}){if(!factors)return 1;const team=factors[side]||0,pass=['QB','WR','TE'].includes(position)?factors[`${side}Passing`]||0:0;return Math.max(.55,Math.min(1.55,1+config.gameEnvironment*factors.game+config.teamOffense*team+config.qbPassCatcher*pass))}
