import {calibrationSnapshot} from './empirical-calibration.js';
import {recommendedCorrelationPriors} from './empirical-correlation.js';
import {simulatePlayer} from '../simulator.js';
import {createSeededRng} from '../random.js';
import {summarizeBacktest,calibrationPenalty} from '../backtest.js';

const DEFAULT_CV={QB:.27,RB:.40,WR:.47,TE:.48,K:.45,DEF:.50};
const q=(xs,p)=>{if(!xs.length)return null;const a=[...xs].sort((x,y)=>x-y),x=(a.length-1)*p,l=Math.floor(x),h=Math.ceil(x);return a[l]+(a[h]-a[l])*(x-l)};
const avg=xs=>xs.length?xs.reduce((a,b)=>a+b,0)/xs.length:null;
function before(a,b){return a.season<b.season||(a.season===b.season&&a.week<b.week)}
function forecast(row,cv,bias,rng,draws){const projection=Math.max(0,Number(row.projection)+(bias?.additive||0)),sims=Array.from({length:draws},()=>simulatePlayer(projection,row.position,rng,cv));return{projection:Number(row.projection),adjustedProjection:projection,actual:Number(row.actual??row.actualPoints),position:row.position,p10:q(sims,.1),p25:q(sims,.25),p50:q(sims,.5),p75:q(sims,.75),p90:q(sims,.9)};}
function score(f){return{...f,absoluteError:Math.abs(f.adjustedProjection-f.actual),squaredError:(f.adjustedProjection-f.actual)**2,covered50:f.actual>=f.p25&&f.actual<=f.p75,covered80:f.actual>=f.p10&&f.actual<=f.p90,belowP10:f.actual<f.p10,aboveP90:f.actual>f.p90};}
export function runRollingCalibration(rows,{draws=1500,seed=20260923,minTrainingRows=100,minPositionRows=30}={}){
 const ordered=[...rows].filter(r=>Number.isFinite(Number(r.projection))&&Number.isFinite(Number(r.actual??r.actualPoints))).sort((a,b)=>a.season-b.season||a.week-b.week),rngFixed=createSeededRng(seed),rngEmp=createSeededRng(seed+1),fixed=[],empirical=[],folds=[];
 const periods=[...new Set(ordered.map(r=>`${r.season}:${r.week}`))];
 for(const period of periods){const [season,week]=period.split(':').map(Number),train=ordered.filter(r=>before(r,{season,week})),test=ordered.filter(r=>r.season===season&&r.week===week);if(train.length<minTrainingRows||!test.length)continue;const snap=calibrationSnapshot(train,{minRows:minPositionRows}),corr=recommendedCorrelationPriors(train);for(const r of test){fixed.push(score(forecast(r,DEFAULT_CV[r.position]??.42,null,rngFixed,draws)));empirical.push(score(forecast(r,snap.positionCV[r.position]??DEFAULT_CV[r.position]??.42,snap.bias[r.position],rngEmp,draws)));}folds.push({season,week,trainingRows:train.length,testRows:test.length,positionCV:snap.positionCV,bias:snap.bias,correlation:corr});}
 const fixedSummary=summarizeBacktest(fixed),empiricalSummary=summarizeBacktest(empirical),allFixed=fixedSummary.find(x=>x.position==='ALL'),allEmp=empiricalSummary.find(x=>x.position==='ALL');
 const comparison={fixed:{...allFixed,calibrationPenalty:allFixed?calibrationPenalty(allFixed):null},empirical:{...allEmp,calibrationPenalty:allEmp?calibrationPenalty(allEmp):null}};
 const adopt=!!allFixed&&!!allEmp&&allEmp.rmse<=allFixed.rmse&&comparison.empirical.calibrationPenalty<=comparison.fixed.calibrationPenalty;
 return{rows:ordered.length,folds,comparison,byPosition:{fixed:fixedSummary,empirical:empiricalSummary},recommendation:adopt?'empirical':'fixed',adoptEmpirical:adopt,latestParameters:folds.at(-1)||null};
}
export function summarizeRollingCalibration(result){return{rows:result.rows,folds:result.folds.length,recommendation:result.recommendation,comparison:result.comparison,latestParameters:result.latestParameters&&{season:result.latestParameters.season,week:result.latestParameters.week,positionCV:result.latestParameters.positionCV,bias:result.latestParameters.bias,correlation:result.latestParameters.correlation}};}
