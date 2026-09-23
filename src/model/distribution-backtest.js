import {createSeededRng,deriveSeed} from '../random.js';
import {simulatePlayer} from '../simulator.js';
import {getModelVariant} from './model-variants.js';
import {playProbability} from './availability.js';
import {summarizeBacktest,calibrationPenalty} from '../backtest.js';
const mean=xs=>xs.length?xs.reduce((a,b)=>a+b,0)/xs.length:null;
function quantile(sorted,q){if(!sorted.length)return null;const p=(sorted.length-1)*q,lo=Math.floor(p),hi=Math.ceil(p);return sorted[lo]+(sorted[hi]-sorted[lo])*(p-lo)}
export function simulateHistoricalDistribution(row,{variant='volatility',draws=2000,seed=1}={}){const v=typeof variant==='string'?getModelVariant(variant):variant,rng=createSeededRng(seed),sims=[];for(let i=0;i<draws;i++){if(v.availability&&rng()>playProbability(row)){sims.push(0);continue}sims.push(simulatePlayer(row.projection,row.position,rng,row.cv,{weeksAhead:row.weeksAhead||0,variant:v}))}return sims.sort((a,b)=>a-b)}
export function evaluateDistributionRow(row,options={}){const sims=simulateHistoricalDistribution(row,options),actual=row.actual;return{...row,simulatedMean:mean(sims),p10:quantile(sims,.10),p25:quantile(sims,.25),p50:quantile(sims,.50),p75:quantile(sims,.75),p90:quantile(sims,.90),absoluteError:Math.abs(mean(sims)-actual),squaredError:(mean(sims)-actual)**2,covered50:actual>=quantile(sims,.25)&&actual<=quantile(sims,.75),covered80:actual>=quantile(sims,.10)&&actual<=quantile(sims,.90),belowP10:actual<quantile(sims,.10),aboveP90:actual>quantile(sims,.90)}}
export function runDistributionBacktest(rows,{variants=['volatility','availability'],draws=2000,seed=1000}={}){return variants.map(id=>{const evaluated=rows.map((r,i)=>evaluateDistributionRow(r,{variant:id,draws,seed:deriveSeed(seed,id,r.season,r.week,r.playerId||i)})),summary=summarizeBacktest(evaluated).find(x=>x.position==='ALL');return{model:id,...summary,calibrationPenalty:calibrationPenalty(summary)}}).sort((a,b)=>a.calibrationPenalty-b.calibrationPenalty)}
