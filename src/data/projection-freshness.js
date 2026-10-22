/** Diagnostic-only projection provenance. File timestamps are not provider observation timestamps. */
export function assessProjectionFreshness({weekResults=[],seasonSource=null,now=new Date(),weeklyCacheUpdatedAt=null}={}){
 const at=Date.parse(now);const age=value=>{const t=Date.parse(value??'');return Number.isFinite(t)&&Number.isFinite(at)&&t<=at?Math.round((at-t)/3600000*10)/10:null;};
 const weeks=weekResults.map(w=>{const observedAt=w.observedAt??null;const cache=w.provider==='cache';const hours=age(observedAt);return {week:w.week,provider:w.provider,rows:w.rows,observedAt,ageHours:hours,provenance:observedAt?'provider-observed':cache?'cached-unknown-origin':'unverified',cacheFileUpdatedAt:cache?weeklyCacheUpdatedAt:null,cacheFileAgeHours:cache?age(weeklyCacheUpdatedAt):null,warning:cache&&!observedAt?'Cache file timestamp does not prove projection generation time':null};});
 const baseline=seasonSource?{status:seasonSource.status,generatedAt:seasonSource.generatedAt,ageHours:age(seasonSource.generatedAt),dataThroughWeek:seasonSource.dataThroughWeek,truncated:seasonSource.truncated}:null;
 return {weeks,seasonBaseline:baseline,unknownAgeWeeks:weeks.filter(w=>w.ageHours===null).map(w=>w.week),note:'Diagnostics only; no change to projection values, trust gates, or Monte Carlo probabilities.'};
}
