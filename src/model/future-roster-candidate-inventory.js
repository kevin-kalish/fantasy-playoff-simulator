// Diagnostic-only: position/bye/status checks never establish a future transaction
// or a trustworthy week-specific projection. Missing evidence remains unknown.
const ELIGIBLE={QB:['QB'],RB:['RB'],WR:['WR'],TE:['TE'],K:['K'],DEF:['DEF'],FLEX:['RB','WR','TE'],'RB/WR':['RB','WR'],'WR/TE':['WR','TE'],'RB/WR/TE':['RB','WR','TE'],SUPERFLEX:['QB','RB','WR','TE']};
const norm=x=>({'D/ST':'DEF',DST:'DEF','W/R/T':'FLEX','W/R':'RB/WR','W/T':'WR/TE'}[String(x??'').toUpperCase()]??String(x??'').toUpperCase());
const UNAVAILABLE=new Set(['OUT','O','IR','IR-R','PUP','PUP-R','SUSP','SUSPENDED','NA','INACTIVE','BYE']);
const evidenceNumber=x=>x==null||x===''?null:Number.isFinite(Number(x))?Number(x):null;
const cleanName=x=>String(x??'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\b(jr|sr|ii|iii|iv)\b\.?/g,'').replace(/[^a-z0-9]/g,'');
const team=x=>({'LA':'LAR','JAC':'JAX','WAS':'WSH','NEP':'NE','NWE':'NE'}[String(x??'').trim().toUpperCase()]??String(x??'').trim().toUpperCase());
const validRow=(r,week)=>Number(r.week)===Number(week)&&r.projection!=null&&r.projection!==''&&Number.isFinite(Number(r.projection));
export function inventoryFutureRosterCandidates(futureRosterGaps,candidates=[],projectionRows=[]){
 const rows=Array.isArray(projectionRows)?projectionRows:[];
 const pool=Array.isArray(candidates)?candidates:[];
 return (futureRosterGaps??[]).map(row=>({
  teamName:row.teamName,week:row.week,
  slots:(row.slots??[]).map(slot=>{
   const matches=pool.filter(p=>(ELIGIBLE[norm(slot.slot)]??[norm(slot.slot)]).some(pos=>[norm(p.position),...(p.positions??[]).map(norm)].includes(pos)));
   const byeKnown=matches.filter(p=>evidenceNumber(p.byeWeek)!=null);
   const onBye=byeKnown.filter(p=>Number(p.byeWeek)===Number(row.week));
   const statusKnown=matches.filter(p=>p.status!=null&&String(p.status).trim()!=='');
   const unavailableNow=statusKnown.filter(p=>UNAVAILABLE.has(String(p.status).toUpperCase()));
   // Exact ID equality is only a diagnostic; provider IDs may be in different namespaces.
   // Never treat an ID coincidence as independently verified projection provenance.
   const sameIdRows=matches.filter(p=>rows.some(r=>String(r.playerId??'')!==''&&String(r.playerId)===String(p.id??'')&&Number(r.week)===Number(row.week)&&r.projection!=null&&r.projection!==''&&Number.isFinite(Number(r.projection))));
   const namePositionCandidates=matches.filter(p=>{const name=cleanName(p.name),position=norm(p.position),nflTeam=team(p.nflTeam);if(!name||!position||!nflTeam)return false;const same=rows.filter(r=>validRow(r,row.week)&&cleanName(r.name)===name&&norm(r.position)===position&&team(r.nflTeam)===nflTeam);return same.length===1;});
   // Current Yahoo status is not a verified future-week availability forecast.
   return {slot:slot.slot,reason:slot.reason,positionMatches:matches.length,
    knownByeWeek:byeKnown.length,onBye:onBye.length,offBye:byeKnown.length-onBye.length,unknownByeWeek:matches.length-byeKnown.length,
    currentStatusKnown:statusKnown.length,currentStatusUnavailable:unavailableNow.length,currentStatusUnknown:matches.length-statusKnown.length,
    futureAvailabilityVerified:0,exactIdWeekProjectionCandidates:sameIdRows.length,uniqueNamePositionTeamWeekCandidates:namePositionCandidates.length,verifiedWeekProjectionMatches:0,
    projectionEvidence:'not-checked',replacementAssumed:false};
  })
 }));
}
