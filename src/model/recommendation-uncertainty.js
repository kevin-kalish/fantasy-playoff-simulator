// Screening bounds apply to simulation sampling only, not player projection or model error.
// Hoeffding + union bound across baseline and action Bernoulli estimates.
export function assessReplicatedRecommendationSignal(actions) {
 const valid=(actions??[]).filter(a=>Number.isFinite(Number(a?.championshipDelta))&&Number.isInteger(Number(a?.simulations))&&Number(a.simulations)>0);
 const estimates=valid.map(a=>Number(a.championshipDelta));
 const positiveRuns=estimates.filter(x=>x>0).length,negativeRuns=estimates.filter(x=>x<0).length,zeroRuns=estimates.length-positiveRuns-negativeRuns;
 const direction=valid.length<2?'INSUFFICIENT_DATA':positiveRuns===valid.length?'ALL_POSITIVE':negativeRuns===valid.length?'ALL_NEGATIVE':zeroRuns===valid.length?'ALL_ZERO':'MIXED';
 if(valid.length<2)return {status:'INSUFFICIENT_REPLICATIONS',replications:valid.length,direction,positiveRuns,negativeRuns,zeroRuns,statisticalStrength:'INSUFFICIENT_REPLICATIONS',projectionConfidence:'NOT_ASSESSED',scope:'Independent-seed sensitivity diagnostic; no historical or projection calibration'};
 const mean=estimates.reduce((sum,x)=>sum+x,0)/estimates.length;
 const min=Math.min(...estimates),max=Math.max(...estimates);
 const statuses=valid.map(assessRecommendationSignal),signals=statuses.map(s=>s.status);
 const status=signals.every(s=>s==='POSITIVE_SIGNAL')?'CONSISTENT_POSITIVE':signals.every(s=>s==='NEGATIVE_SIGNAL')?'CONSISTENT_NEGATIVE':'MIXED_OR_INCONCLUSIVE';
 const statisticalStrength=status==='CONSISTENT_POSITIVE'?'POSITIVE_SIGNAL':status==='CONSISTENT_NEGATIVE'?'NEGATIVE_SIGNAL':signals.every(s=>s==='INCONCLUSIVE')?'INCONCLUSIVE':'MIXED_EVIDENCE';
 return {status,direction,positiveRuns,negativeRuns,zeroRuns,statisticalStrength,projectionConfidence:'NOT_ASSESSED',replications:valid.length,mean,min,max,range:max-min,signals,scope:'Independent-seed sensitivity diagnostic, not a confidence interval or historical calibration'};
}

export function assessRecommendationSignal(action) {
 const n = Number(action?.simulations);
 const delta = Number(action?.championshipDelta);
 if (!Number.isInteger(n) || n < 1 || !Number.isFinite(delta)) return {status:'UNAVAILABLE',reason:'No valid confirmation sample'};
 const errorBound = 2 * Math.sqrt(Math.log(80) / (2 * n));
 return {
  status: delta > errorBound ? 'POSITIVE_SIGNAL' : delta < -errorBound ? 'NEGATIVE_SIGNAL' : 'INCONCLUSIVE',
  championshipDelta: delta,
  errorBound,
  simulations:n,
  confidenceLevel:.95,
  scope:'Monte Carlo sampling only; not projection or model uncertainty'
 };
}
