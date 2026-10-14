// Local-only readiness inventory. Never upgrades unverifiable archives into
// calibration observations or infers issuance timestamps.
const count=(rows,key)=>rows.reduce((out,row)=>(out[key(row)]=(out[key(row)]||0)+1,out),{});
export function assessHistoricalDataCoverage(archives=[],actuals=[]){
 const rows=archives.flatMap(a=>(a.data?.rows??[]).map(r=>({row:r,archive:a})));
 const actualWeeks=new Set(actuals.map(r=>String(r.season)+':'+String(r.week)));
 const issues=[];
 for(const {row:r,archive:a} of rows){
  const p=r.forecastProvenance??{},captured=a.capturedAt??a.data?.capturedAt;
  const verified=a.immutable===true&&a.data?.schemaVersion===3&&p.kind==='fresh-provider-response'&&['jerrygm','fantasypros'].includes(String(p.provider??'').toLowerCase())&&Number.isFinite(Date.parse(p.observedAt??''))&&Number.isFinite(Date.parse(captured??''))&&Number.isFinite(Date.parse(r.kickoffAt??''))&&Date.parse(p.observedAt)<=Date.parse(captured)&&Date.parse(captured)<Date.parse(r.kickoffAt);
  const reason=!verified?'unverified-pregame-provenance':!actualWeeks.has(String(r.season)+':'+String(r.week))?'completed-actuals-missing-for-week':null;
  if(reason)issues.push({season:r.season,week:r.week,reason});
 }
 const seasons=[...new Set(rows.map(x=>Number(x.row.season)).filter(Number.isFinite))].sort((a,b)=>a-b);
 return {schemaVersion:1,mode:'inventory-only',parameterUpdatesAllowed:false,archives:archives.length,projectionRows:rows.length,actualRows:actuals.length,seasons,issueCounts:count(issues,r=>r.reason),potentiallyMatchableRows:rows.length-issues.length,missingData:!archives.length?'verified-pregame-archives':!actuals.length?'completed-nfl-actuals':null};
}

const timestamp=v=>typeof v==='string'&&Number.isFinite(Date.parse(v))?Date.parse(v):null;
export function auditHistoricalArchiveProvenance(archives=[]){
 const checks=['archive-not-immutable','schema-not-v3','missing-fresh-provider-proof','unsupported-provider','missing-observation-time','missing-archive-capture-time','missing-kickoff-time','observation-after-archive-capture','archive-captured-at-or-after-kickoff','observation-at-or-after-kickoff'];
 const counts=Object.fromEntries(checks.map(k=>[k,0])),byArchive=[];
 for(const a of archives){
  const rows=Array.isArray(a.data?.rows)?a.data.rows:[];
  const failures=Object.fromEntries(checks.map(k=>[k,0]));
  let eligible=0;
  for(const r of rows){
   const p=r.forecastProvenance??{},capture=timestamp(a.capturedAt??a.data?.capturedAt),observed=timestamp(p.observedAt),kickoff=timestamp(r.kickoffAt),bad=[];
   if(a.immutable!==true)bad.push('archive-not-immutable');
   if(a.data?.schemaVersion!==3)bad.push('schema-not-v3');
   if(p.kind!=='fresh-provider-response')bad.push('missing-fresh-provider-proof');
   if(!['jerrygm','fantasypros'].includes(String(p.provider??'').toLowerCase()))bad.push('unsupported-provider');
   if(observed===null)bad.push('missing-observation-time');
   if(capture===null)bad.push('missing-archive-capture-time');
   if(kickoff===null)bad.push('missing-kickoff-time');
   if(observed!==null&&capture!==null&&observed>capture)bad.push('observation-after-archive-capture');
   if(capture!==null&&kickoff!==null&&capture>=kickoff)bad.push('archive-captured-at-or-after-kickoff');
   if(observed!==null&&kickoff!==null&&observed>=kickoff)bad.push('observation-at-or-after-kickoff');
   if(!bad.length)eligible++;
   for(const reason of bad){failures[reason]++;counts[reason]++;}
  }
  byArchive.push({file:a.path??null,schemaVersion:a.data?.schemaVersion??null,immutable:a.immutable===true,rows:rows.length,provenanceEligibleRows:eligible,failures:Object.fromEntries(Object.entries(failures).filter(([,n])=>n))});
 }
 return {schemaVersion:1,mode:'read-only-provenance-audit',parameterUpdatesAllowed:false,archives:archives.length,rows:byArchive.reduce((n,a)=>n+a.rows,0),provenanceEligibleRows:byArchive.reduce((n,a)=>n+a.provenanceEligibleRows,0),failureCounts:Object.fromEntries(Object.entries(counts).filter(([,n])=>n)),byArchive,note:'Failure categories overlap; counts are not mutually exclusive. Archive names and row counts only; no player data is exported.'};
}
