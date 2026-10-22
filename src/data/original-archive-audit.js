import path from 'node:path';
import {auditHistoricalArchiveProvenance} from './historical-data-coverage.js';
const number=v=>v!==null&&v!==undefined&&v!==''&&Number.isFinite(Number(v))?Number(v):null;
const key=r=>[number(r.season??r.year),number(r.week??r.wk),String(r.playerId??r.player_id??'').trim(),String(r.scoring??'HALF').toUpperCase()].join('|');
export function auditOriginalArchives(archives=[],actuals=[]){
 const actualKeys=new Set(actuals.filter(r=>number(r.actual)!==null&&typeof r.actualRecordedAt==='string'&&Number.isFinite(Date.parse(r.actualRecordedAt))).map(key));
 const actualWeeks=new Set(actuals.map(r=>[number(r.season??r.year),number(r.week??r.wk)].join('|')));
 const summaries=[];
 for(const archive of archives){
  const audit=auditHistoricalArchiveProvenance([archive]);
  const rows=Array.isArray(archive.data?.rows)?archive.data.rows:Array.isArray(archive.data?.projections)?archive.data.projections:Array.isArray(archive.data)?archive.data:[];
  let fullEligible=0,weekActuals=0,exactActualMatches=0,missingIdentity=0,missingProjection=0,missingSource=0,missingRecordedActual=0;
  for(const r of rows){
   const identity=key(r),[season,week,player]=identity.split('|');
   if(!season||season==='null'||!week||week==='null'||!player)missingIdentity++;
   if(number(r.projection)===null)missingProjection++;
   if(!String(r.source??archive.data?.source??'').trim())missingSource++;
   if(actualWeeks.has([season,week].join('|')))weekActuals++;
   if(actualKeys.has(identity))exactActualMatches++;
   else missingRecordedActual++;
  }
  // The importer requires the projectedAt value to exactly match provider observedAt.
  // It also requires identity, source, scoring, and a finalized actual for a usable pair.
  const strict=audit.provenanceEligibleRows;
  for(const r of rows){
   const p=r.forecastProvenance??{},observed=p.observedAt;
   if(archive.immutable!==true||archive.data?.schemaVersion!==3||p.kind!=='fresh-provider-response'||!['jerrygm','fantasypros'].includes(String(p.provider??'').toLowerCase()))continue;
   const captured=archive.capturedAt??archive.data?.capturedAt;
   if(![observed,captured,r.kickoffAt].every(v=>typeof v==='string'&&Number.isFinite(Date.parse(v))))continue;
   if(Date.parse(observed)>Date.parse(captured)||Date.parse(captured)>=Date.parse(r.kickoffAt))continue;
   if((r.projectedAt??r.capturedAt??captured)!==observed)continue;
   if(number(r.projection)===null||!String(r.source??archive.data?.source??'').trim()||!actualKeys.has(key(r)))continue;
   fullEligible++;
  }
  summaries.push({file:path.basename(archive.path??'unknown.json'),schemaVersion:archive.data?.schemaVersion??null,immutable:archive.immutable===true,rows:rows.length,provenanceEligibleRows:strict,weekWithActualRows:weekActuals,exactIdentityActualMatches:exactActualMatches,strictImportCandidates:fullEligible,missingIdentity,missingProjection,missingSource,missingRecordedActual,failures:audit.failureCounts});
 }
 return {schemaVersion:1,mode:'read-only-original-archive-audit',parameterUpdatesAllowed:false,archives:summaries.length,totalRows:summaries.reduce((n,r)=>n+r.rows,0),strictImportCandidates:summaries.reduce((n,r)=>n+r.strictImportCandidates,0),byArchive:summaries,note:'Counts are diagnostic only. Exact matches require recorded actual timestamps. No data is imported or rewritten; provenance must remain independently verifiable.'};
}
