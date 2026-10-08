// Screening bounds apply to simulation sampling only, not player projection or model error.
// Hoeffding + union bound across baseline and action Bernoulli estimates.
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
