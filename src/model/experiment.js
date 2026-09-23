import {createSeededRng} from '../random.js';
import {simulatePlayer} from '../simulator.js';
import {MODEL_VARIANTS} from './model-variants.js';
import {evaluatePointForecasts} from '../backtest.js';
function mean(xs){return xs.length?xs.reduce((a,b)=>a+b,0)/xs.length:null}
export function forecastPlayerMean(row,{variant,draws=2000,seed=1}={}){const rng=createSeededRng(seed),v=typeof variant==='string'?MODEL_VARIANTS[variant]:variant;if(!v)throw new Error('model variant required');const sims=Array.from({length:draws},()=>simulatePlayer(row.projection,row.position,rng,row.cv,{weeksAhead:row.weeksAhead||0,variant:v}));return mean(sims)}
export function runHistoricalExperiment(rows,{variants=Object.keys(MODEL_VARIANTS),draws=2000,seed=1000}={}){const output={};for(const id of variants){output[id]=rows.map((r,i)=>({predicted:forecastPlayerMean(r,{variant:id,draws,seed:seed+i}),actual:r.actual,position:r.position,week:r.week,playerId:r.playerId}))}return Object.entries(output).map(([model,data])=>({model,...evaluatePointForecasts(data)})).sort((a,b)=>a.rmse-b.rmse)}
