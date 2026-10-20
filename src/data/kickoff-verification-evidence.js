import fs from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
export function writeKickoffVerificationEvidence({file,season,week,referenceSource,comparison,verifiedAt=new Date().toISOString(),output='data/private/kickoff-verification.json'}){
 if(!comparison?.match||!Number.isFinite(Date.parse(verifiedAt)))throw new Error('Cannot attest unverified kickoff comparison');
 const record={schemaVersion:1,season:Number(season),week:Number(week),verifiedAt,referenceSource,localFile:path.resolve(file),localSha256:digest(fs.readFileSync(file)),localGames:comparison.localGames,referenceGames:comparison.referenceGames,match:true};
 fs.mkdirSync(path.dirname(output),{recursive:true});
 fs.writeFileSync(output,JSON.stringify(record,null,2)+'\n');
 return record;
}
export function inspectKickoffVerificationEvidence({file,season,week,now=Date.now(),evidencePath='data/private/kickoff-verification.json',maxAgeMs=48*60*60*1000}){
 if(!fs.existsSync(evidencePath))return {ready:false,reason:'missing-verification-evidence'};
 try{
  const e=JSON.parse(fs.readFileSync(evidencePath,'utf8'));
  if(e.schemaVersion!==1||e.match!==true||e.season!==Number(season)||e.week!==Number(week))return {ready:false,reason:'wrong-week-or-invalid-evidence'};
  if(path.resolve(file)!==e.localFile||!fs.existsSync(file)||digest(fs.readFileSync(file))!==e.localSha256)return {ready:false,reason:'schedule-changed-since-verification'};
  const age=now-Date.parse(e.verifiedAt);
  if(!Number.isFinite(age)||age<0||age>maxAgeMs)return {ready:false,reason:'verification-expired'};
  return {ready:true,reason:'verified',verifiedAt:e.verifiedAt,referenceSource:e.referenceSource,localGames:e.localGames};
 }catch{return {ready:false,reason:'unreadable-verification-evidence'};}
}
