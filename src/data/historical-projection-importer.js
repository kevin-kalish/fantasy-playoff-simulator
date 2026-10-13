import fs from 'node:fs';
import path from 'node:path';
const validTime=value=>typeof value==='string'&&Number.isFinite(Date.parse(value));
const number=value=>value!==null&&value!==undefined&&value!==''&&Number.isFinite(Number(value))?Number(value):null;
const rowsOf=raw=>Array.isArray(raw)?raw:Array.isArray(raw?.rows)?raw.rows:Array.isArray(raw?.projections)?raw.projections:[];
const identity=r=>[Number(r.season??r.year),Number(r.week??r.wk),String(r.playerId??r.player_id??'').trim()];
export function importHistoricalProjectionArchives(archives=[],actualRows=[],{scoring='HALF'}={}){
 const projected=[],actuals=new Map(),rejected=[];
 for(const [i,row] of actualRows.entries()){
  const [season,week,playerId]=identity(row),actual=number(row.actual),actualRecordedAt=row.actualRecordedAt;
  if(!season||!week||!playerId||actual===null||!validTime(actualRecordedAt)){rejected.push({source:'actuals',row:i+1,reason:'missing-actual-or-recorded-time'});continue;}
  const key=[season,week,playerId,String(row.scoring??scoring).toUpperCase()].join('|');
  if(actuals.has(key)){rejected.push({source:'actuals',row:i+1,reason:'duplicate-actual'});continue;}
  actuals.set(key,{actual,actualRecordedAt});
 }
 for(const archive of archives){
  const raw=archive.data,rows=rowsOf(raw),capturedAt=archive.capturedAt??raw?.capturedAt??raw?.updatedAt;
  // updatedAt may be a cache-write time, not a per-row capture time. Treat it
  // as evidence only when the file is explicitly marked as an immutable archive.
  const archiveTime=archive.immutable===true?capturedAt:null;
  for(const [i,row] of rows.entries()){
   const [season,week,playerId]=identity(row),projection=number(row.projection),projectedAt=row.projectedAt??row.capturedAt??archiveTime;
   const kickoffAt=row.kickoffAt;
   const source=String(row.source??archive.source??raw?.source??'').trim();
   if(!season||!week||!playerId||projection===null||!source||!validTime(projectedAt)||!validTime(kickoffAt)){rejected.push({source:archive.path,row:i+1,reason:'missing-identity-projection-source-or-provenance'});continue;}
   if(Date.parse(projectedAt)>=Date.parse(kickoffAt)){rejected.push({source:archive.path,row:i+1,reason:'not-pregame'});continue;}
   const score=String(row.scoring??scoring).toUpperCase(),actual=actuals.get([season,week,playerId,score].join('|'));
   if(!actual){rejected.push({source:archive.path,row:i+1,reason:'actual-not-found'});continue;}
   projected.push({season,week,playerId,position:row.position,source,scoring:score,projection,actual:actual.actual,projectedAt,kickoffAt,actualRecordedAt:actual.actualRecordedAt});
  }
 }
 return {rows:projected,rejected,diagnostics:{archives:archives.length,actualRows:actualRows.length,joined:projected.length,rejected:rejected.length}};
}
export function readArchiveDirectory(directory){
 if(!fs.existsSync(directory))return [];
 return fs.readdirSync(directory,{withFileTypes:true}).filter(x=>x.isFile()&&x.name.endsWith('.json')).sort((a,b)=>a.name.localeCompare(b.name)).map(entry=>{
  const file=path.join(directory,entry.name),data=JSON.parse(fs.readFileSync(file,'utf8'));
  return {path:file,data,immutable:data?.immutableArchive===true,capturedAt:data?.capturedAt??null};
 });
}
