import {normPosition as norm,normName as clean,normTeam as team,evidenceNumber as number,unavailableStatus,eligibleForSlot as eligible,matchingProjectionRows} from './future-candidate-evidence.js';
// Read-only, opt-in replacement-level scenario estimates. Not a roster transaction or trusted forecast.
function directProjection(p,rows,week,season){
 const same=matchingProjectionRows(p,rows,week,{season});
 return same.length===1?number(same[0].projection):null;
}
export function estimateFutureReplacementLevels(gaps,candidates,projectionRows,{season,currentWeek,baselines={},minDirectCandidates=5}={}){
 const pool=Array.isArray(candidates)?candidates:[],rows=Array.isArray(projectionRows)?projectionRows:[];
 const usedByWeek=new Map();
 return (gaps??[]).flatMap(gap=>(gap.slots??[]).map(slot=>{
  const week=Number(gap.week),position=norm(slot.slot);
  const result={teamId:gap.teamId??null,teamName:gap.teamName??null,week,slot:slot.slot,points:null,method:'unavailable',provisional:true,replacementAssumed:false,verifiedFutureAvailability:false,verifiedProjection:false};
  if(!Number.isInteger(week)||!Number.isInteger(Number(currentWeek))||week<=Number(currentWeek)||!Number.isInteger(Number(season)))return result;
  const used=usedByWeek.get(week)??new Set();usedByWeek.set(week,used);
  const eligiblePool=pool.filter(p=>!used.has(String(p.id??''))&&p.id!=null&&eligible(p,position)&&number(p.byeWeek)!=null&&Number(p.byeWeek)!==week&&!unavailableStatus(p.status));
  const ranked=eligiblePool.map(p=>({...p,points:directProjection(p,rows,week,season)})).filter(p=>p.points!=null).sort((a,b)=>b.points-a.points);
  if(ranked.length>=Math.max(5,Number(minDirectCandidates)||5)){
   const sample=ranked.slice(2,5);
   result.points=sample.reduce((s,p)=>s+p.points,0)/sample.length;
   result.method='direct-week-ranks-3-to-5';result.sampleSize=ranked.length;
   // Reserve a distinct hypothetical candidate for every gap; never claim acquisition.
   used.add(String(ranked[2].id));
  }else{
   const baseline=number(baselines[position]);
   if(baseline!=null&&baseline>=0){result.points=baseline;result.method='assumed-position-baseline';result.sampleSize=ranked.length;}
  }
  if(result.points!=null)result.replacementAssumed=true;
  return result;
 }));
}

/**
 * Diagnostic-only mutually exclusive exclusion counts, per future gap.
 * Identity match requires a unique season/week/name/position/NFL-team row.
 * Current status is not a verified future-week availability forecast.
 */
export function diagnoseFutureReplacementExclusions(gaps,candidates,projectionRows,{season,currentWeek}={}){
 const pool=Array.isArray(candidates)?candidates:[],rows=Array.isArray(projectionRows)?projectionRows:[];
 return (gaps??[]).flatMap(gap=>(gap.slots??[]).map(slot=>{
  const week=Number(gap.week);
  const counts={teamId:gap.teamId??null,teamName:gap.teamName??null,week,slot:slot.slot,positionCandidates:0,missingIdentity:0,missingBye:0,onBye:0,currentUnavailable:0,noWeeklyProjection:0,noPositionProjectionRows:0,identityMismatch:0,ambiguousWeeklyProjection:0,uniqueWeeklyProjection:0,provisional:true};
  if(!Number.isInteger(week)||!Number.isInteger(Number(season))||!Number.isInteger(Number(currentWeek))||week<=Number(currentWeek))return counts;
  for(const p of pool.filter(p=>eligible(p,slot.slot))){
   counts.positionCandidates++;
   if(!clean(p.name)||!norm(p.position)||!team(p.nflTeam)){counts.missingIdentity++;continue;}
   if(number(p.byeWeek)==null){counts.missingBye++;continue;}
   if(Number(p.byeWeek)===week){counts.onBye++;continue;}
   if(unavailableStatus(p.status)){counts.currentUnavailable++;continue;}
   const matching=matchingProjectionRows(p,rows,week,{season});
   const samePosition=rows.filter(r=>Number(r.season)===Number(season)&&Number(r.week)===week&&number(r.projection)!=null&&norm(r.position)===norm(p.position));
   if(!samePosition.length)counts.noPositionProjectionRows++;
   else if(!matching.length)counts.identityMismatch++;
   if(!matching.length)counts.noWeeklyProjection++;
   else if(matching.length>1)counts.ambiguousWeeklyProjection++;
   else counts.uniqueWeeklyProjection++;
  }
  return counts;
 }));
}
