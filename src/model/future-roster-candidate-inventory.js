import {normPosition as norm,normName as cleanName,normTeam as team,evidenceNumber,unavailableStatus,eligibleForSlot,matchingProjectionRows} from './future-candidate-evidence.js';
// Diagnostic-only: position/bye/status checks never establish a future transaction
// or a trustworthy week-specific projection. Missing evidence remains unknown.
export function inventoryFutureRosterCandidates(futureRosterGaps,candidates=[],projectionRows=[]){
 const rows=Array.isArray(projectionRows)?projectionRows:[];
 const pool=Array.isArray(candidates)?candidates:[];
 return (futureRosterGaps??[]).map(row=>({
  teamName:row.teamName,week:row.week,
  slots:(row.slots??[]).map(slot=>{
   const matches=pool.filter(p=>eligibleForSlot(p,slot.slot));
   const byeKnown=matches.filter(p=>evidenceNumber(p.byeWeek)!=null);
   const onBye=byeKnown.filter(p=>Number(p.byeWeek)===Number(row.week));
   const statusKnown=matches.filter(p=>p.status!=null&&String(p.status).trim()!=='');
   const unavailableNow=statusKnown.filter(p=>unavailableStatus(p.status));
   // Exact ID equality is only a diagnostic; provider IDs may be in different namespaces.
   // Never treat an ID coincidence as independently verified projection provenance.
   const sameIdRows=matches.filter(p=>rows.some(r=>String(r.playerId??'')!==''&&String(r.playerId)===String(p.id??'')&&Number(r.week)===Number(row.week)&&r.projection!=null&&r.projection!==''&&Number.isFinite(Number(r.projection))));
   const namePositionCandidates=matches.filter(p=>{const name=cleanName(p.name),position=norm(p.position),nflTeam=team(p.nflTeam);if(!name||!position||!nflTeam)return false;const same=matchingProjectionRows(p,rows,row.week);return same.length===1;});
   // Current Yahoo status is not a verified future-week availability forecast.
   return {slot:slot.slot,reason:slot.reason,positionMatches:matches.length,
    knownByeWeek:byeKnown.length,onBye:onBye.length,offBye:byeKnown.length-onBye.length,unknownByeWeek:matches.length-byeKnown.length,
    currentStatusKnown:statusKnown.length,currentStatusUnavailable:unavailableNow.length,currentStatusUnknown:matches.length-statusKnown.length,
    futureAvailabilityVerified:0,exactIdWeekProjectionCandidates:sameIdRows.length,uniqueNamePositionTeamWeekCandidates:namePositionCandidates.length,verifiedWeekProjectionMatches:0,
    projectionEvidence:'not-checked',replacementAssumed:false};
  })
 }));
}
