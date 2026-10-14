import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
const valid=(v)=>v!==null&&v!==undefined&&v!==''&&Number.isFinite(Number(v));
export function buildProjectionArchive(rows,{capturedAt=new Date().toISOString(),scoring='HALF',provider='unknown',providerByWeek={},observedAtByWeek={},leagueKey=null,refreshRequested=false}={}){
 if(!Number.isFinite(Date.parse(capturedAt)))throw new Error('Invalid capture timestamp');
 const verifiedTime=week=>{const time=observedAtByWeek[week];return typeof time==='string'&&Number.isFinite(Date.parse(time))&&Date.parse(time)<=Date.parse(capturedAt)?time:null;};
 const clean=(rows||[]).filter(r=>Number.isInteger(Number(r.season))&&Number.isInteger(Number(r.week))&&valid(r.projection)&&r.name&&r.position).map(r=>({
  season:Number(r.season),week:Number(r.week),playerId:String(r.playerId??'').trim(),name:String(r.name),position:String(r.position).toUpperCase(),nflTeam:String(r.nflTeam??''),projection:Number(r.projection),
  source:String(r.source??providerByWeek[r.week]??provider),scoring:String(scoring).toUpperCase(),projectedAt:verifiedTime(r.week)??capturedAt,
  forecastProvenance:{kind:verifiedTime(r.week)&&['fantasypros','jerrygm'].includes(String(providerByWeek[r.week]??provider))?'fresh-provider-response':'unverified-cache-or-fallback',provider:String(providerByWeek[r.week]??provider),observedAt:verifiedTime(r.week)},
  // Kickoff is intentionally absent until independently sourced and verified.
  ...(r.kickoffAt?{kickoffAt:r.kickoffAt}:{})
 }));
 return {schemaVersion:3,immutableArchive:true,capturedAt,source:provider,scoring:String(scoring).toUpperCase(),leagueKey,rows:clean};
}
export function saveProjectionArchive(directory,archive){
 if(!archive?.immutableArchive||!Number.isFinite(Date.parse(archive.capturedAt)))throw new Error('Invalid immutable archive');
 const digest=createHash('sha256').update(JSON.stringify(archive)).digest('hex').slice(0,16);
 const stamp=archive.capturedAt.replace(/[^0-9]/g,'').slice(0,14);
 const file=path.join(directory,`projection-${stamp}-${digest}.json`);
 fs.mkdirSync(directory,{recursive:true});
 fs.writeFileSync(file,JSON.stringify(archive,null,2)+'\n',{flag:'wx'});
 return file;
}
