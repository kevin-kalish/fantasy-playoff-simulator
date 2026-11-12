// Explicit, bounded diagnostic horizon beyond routine weekly projections.
// Never changes the simulation's requested weeks or trusted readiness.
export function futureReplacementProjectionWeeks({currentWeek,loadedWeeks=[],gapWeeks=[],playoffWeeks=[],maxExtraWeeks=2}={}){
 const current=Number(currentWeek),limit=Number(maxExtraWeeks);
 if(!Number.isInteger(current)||!Number.isInteger(limit)||limit<0||limit>4)return [];
 const existing=new Set(loadedWeeks.map(Number));
 const lastRegular=playoffWeeks.length?Math.min(...playoffWeeks.map(Number))-1:18;
 return [...new Set(gapWeeks.map(Number))].filter(w=>Number.isInteger(w)&&w>current&&w<=lastRegular&&!existing.has(w)).sort((a,b)=>a-b).slice(0,limit);
}

export function candidateTargetedProjectionWeeks({currentWeek,loadedWeeks=[],gapWeeks=[],playoffWeeks=[],maxWeeks=1}={}){
 const current=Number(currentWeek),limit=Number(maxWeeks);
 if(!Number.isInteger(current)||!Number.isInteger(limit)||limit<0||limit>2)return [];
 const loaded=new Set(loadedWeeks.map(Number));
 const lastRegular=playoffWeeks.length?Math.min(...playoffWeeks.map(Number))-1:18;
 return [...new Set(gapWeeks.map(Number))].filter(w=>Number.isInteger(w)&&w>current&&w<=lastRegular&&loaded.has(w)).sort((a,b)=>a-b).slice(0,limit);
}
