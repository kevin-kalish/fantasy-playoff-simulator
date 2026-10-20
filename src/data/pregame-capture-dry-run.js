import fs from 'node:fs';
import {preflightPregameCapture} from './pregame-capture-preflight.js';
import {diagnoseCaptureSources} from './capture-source-diagnostics.js';
import {expectedProjectionPlayersFromSnapshot} from './yahoo-projection-coverage.js';
const add=(checks,name,pass,detail)=>checks.push({name,pass:Boolean(pass),detail});
export function dryRunPregameCapture({snapshotPath,specPath,now=Date.now(),env=process.env,preflightOptions={},sourceOptions={}}={}){
 const checks=[];
 if(!snapshotPath||!specPath)return {schemaVersion:1,mode:'offline-dry-run',networkRequests:0,ready:false,checks:[{name:'arguments',pass:false,detail:'Snapshot and spec paths required'}]};
 const preflight=preflightPregameCapture({snapshotPath,specPath,now,env,...preflightOptions});
 const source=diagnoseCaptureSources({now,env,...sourceOptions});
 for(const check of preflight.checks)checks.push({...check,name:'preflight:'+check.name});
 add(checks,'schedule-source-verified',source.schedule.sourceVerified,source.schedule.verificationReason??'unverified');
 add(checks,'schedule-future',source.schedule.allFuture,'All games must remain in the future');
 add(checks,'provider-candidate',source.providers.fantasypros.configured||(source.providers.jerrygm.configured&&source.providers.jerrygm.availability==='unverified'),'Credential configuration is not proof of live provider availability');
 let roster={ready:false,expectedPlayers:[],errors:['snapshot-unavailable']};
 try{
  const snapshot=JSON.parse(fs.readFileSync(snapshotPath,'utf8'));
  roster=expectedProjectionPlayersFromSnapshot(snapshot);
  add(checks,'yahoo-roster-identities',roster.ready,roster.ready?roster.expectedPlayers.length+' uniquely identified rostered players':roster.errors.slice(0,12).join('; ')||'No rostered players');
 }catch(e){add(checks,'yahoo-roster-identities',false,e.message);}
 let scoring=null;
 try{
  const spec=JSON.parse(fs.readFileSync(specPath,'utf8'));
  const snapshot=JSON.parse(fs.readFileSync(snapshotPath,'utf8'));
  const value=String(spec.scoring??snapshot.scoring??snapshot.scoringType??'').toUpperCase();
  scoring=value||null;
  add(checks,'scoring-declared',Boolean(scoring),scoring??'Missing explicit scoring declaration; no scoring inference');
  add(checks,'week-aligned',Number(spec.season)===Number(source.season)&&Number(spec.week)===Number(source.week),'Capture spec and source diagnostics must target the same season/week');
 }catch(e){add(checks,'scoring-declared',false,e.message);add(checks,'week-aligned',false,'Unable to inspect capture spec');}
 return {schemaVersion:1,mode:'offline-dry-run',networkRequests:0,archiveCreated:false,season:source.season,week:source.week,ready:checks.every(c=>c.pass),checks,roster:{ready:roster.ready,teamCount:roster.teamCount??0,expectedPlayers:roster.expectedPlayers.length,errors:roster.errors},scoring,sourceReadiness:source.readyForLiveAttempt,note:'No live Yahoo reconciliation or provider retrieval performed; ready does not certify calibration eligibility.'};
}
