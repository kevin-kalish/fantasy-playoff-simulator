// Screening bounds apply to simulation sampling only, not player projection or model error.
// Hoeffding + union bound across baseline and action Bernoulli estimates.
export function assessReplicatedRecommendationSignal(actions) {
 const valid=(actions??[]).filter(a=>Number.isFinite(Number(a?.championshipDelta))&&Number.isInteger(Number(a?.simulations))&&Number(a.simulations)>0);
 if(valid.length<2)return {status:'INSUFFICIENT_REPLICATIONS',replications:valid.length};
 const estimates=valid.map(a=>Number(a.championshipDelta));
 const mean=estimates.reduce((sum,x)=>sum+x,0)/estimates.length;
 const min=Math.min(...estimates),max=Math.max(...estimates);
 const statuses=valid.map(assessRecommendationSignal);
 return {status:statuses.every(s=>s.status==='POSITIVE_SIGNAL')?'CONSISTENT_POSITIVE':statuses.every(s=>s.status==='NEGATIVE_SIGNAL')?'CONSISTENT_NEGATIVE':'MIXED_OR_INCONCLUSIVE',replications:valid.length,mean,min,max,range:max-min,signals:statuses.map(s=>s.status),scope:'Independent-seed sensitivity diagnostic, not a confidence interval or historical calibration'};
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
