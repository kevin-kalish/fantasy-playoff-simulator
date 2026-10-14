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
