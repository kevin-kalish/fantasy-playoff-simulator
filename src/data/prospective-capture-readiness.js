import {evaluatePregameCaptureArchive} from './pregame-capture-eligibility.js';
const weekKey=r=>String(r.season)+':'+String(r.week);
export function assessProspectiveCaptureReadiness(archives=[],actuals=[]){
 const completed=new Set(actuals.filter(r=>r.actual!==undefined&&r.actual!==null&&r.actual!==''&&typeof r.actualRecordedAt==='string'&&Number.isFinite(Date.parse(r.actualRecordedAt))).map(weekKey));
 const weekly=new Map();
 let legacyArchives=0,v3Archives=0;
 for(const entry of archives){
  const archive=entry.data??entry;
  if(archive.schemaVersion!==3){legacyArchives++;continue;}
  v3Archives++;
  const evaluation=evaluatePregameCaptureArchive(archive);
  for(const row of archive.rows??[]){
   const key=weekKey(row),item=weekly.get(key)??{season:row.season,week:row.week,projectionRows:0,freshProviderRows:0,pregameKickoffVerifiedRows:0,completedActualWeek:false,missingKickoffRows:0,unverifiedProviderRows:0};
   item.projectionRows++;
   const one=evaluatePregameCaptureArchive({...archive,rows:[row]});
   item.freshProviderRows+=one.freshProviderRows;
   item.pregameKickoffVerifiedRows+=one.pregameKickoffVerifiedRows;
   if(!row.kickoffAt)item.missingKickoffRows++;
   if(!one.freshProviderRows)item.unverifiedProviderRows++;
   item.completedActualWeek=completed.has(key);
   weekly.set(key,item);
  }
 }
 const weeks=[...weekly.values()].sort((a,b)=>Number(a.season)-Number(b.season)||Number(a.week)-Number(b.week));
 return {schemaVersion:1,mode:'prospective-capture-readiness',parameterUpdatesAllowed:false,archives:archives.length,legacyArchives,v3Archives,weeks,totals:{projectionRows:weeks.reduce((n,w)=>n+w.projectionRows,0),freshProviderRows:weeks.reduce((n,w)=>n+w.freshProviderRows,0),pregameKickoffVerifiedRows:weeks.reduce((n,w)=>n+w.pregameKickoffVerifiedRows,0)},nextAction:!v3Archives?'Capture a fresh immutable v3 pregame archive with a live provider response.':!weeks.some(w=>w.pregameKickoffVerifiedRows)?'Verify independent kickoff times and fresh provider retrieval for v3 captures.':!weeks.some(w=>w.completedActualWeek)?'Wait for completed same-week NFL actuals; do not calibrate on future games.':'Run strict historical import to verify player IDs and finalized actual timestamps.',note:'Week-level readiness only; no calibration pairs are created and no model parameters are changed.'};
}
