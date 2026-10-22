import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {validatePregameCaptureInputs} from './pregame-capture-validation.js';
import {parseKickoffScheduleCSV} from './projection-kickoff-enrichment.js';
import {inspectKickoffVerificationEvidence} from './kickoff-verification-evidence.js';
const quotaKey=apiKey=>createHash('sha256').update('https://api.jerrygm.com/api/ext/v1:'+apiKey).digest('hex');
const inside=(root,file)=>{const relative=path.relative(path.resolve(root),path.resolve(file));return relative!==''&&!relative.startsWith('..'+path.sep)&&relative!=='..'&&!path.isAbsolute(relative);};
export function preflightPregameCapture({snapshotPath,specPath,env=process.env,now=Date.now(),root='data/private',referencePath=env.YAHOO_REFERENCE??'fixtures/yahoo-reference-2026-week3.json',kickoffPath='data/private/nfl-kickoffs.csv',quotaPath='data/private/jerrygm-quota-state.json',verificationPath='data/private/kickoff-verification.json'}={}){
 const checks=[];
 const add=(name,pass,detail)=>checks.push({name,pass:Boolean(pass),detail});
 let spec=null;
 for(const [name,file] of [['snapshot',snapshotPath],['spec',specPath]]){
  add(name+'-private-path',typeof file==='string'&&inside(root,file),'Must be inside data/private');
  add(name+'-exists',typeof file==='string'&&inside(root,file)&&fs.existsSync(file),'File must exist');
 }
 if(checks.every(c=>c.pass)){
  try{spec=JSON.parse(fs.readFileSync(specPath,'utf8'));JSON.parse(fs.readFileSync(snapshotPath,'utf8'));add('valid-input-json',true,'Both JSON files parse');}
  catch{add('valid-input-json',false,'Unable to parse input JSON');}
 }
 if(spec){
  try{validatePregameCaptureInputs(spec,snapshotPath,{now});add('yahoo-audit-fresh',true,'Audit valid and within 15 minutes');}
  catch(e){add('yahoo-audit-fresh',false,e.message);}
  add('no-projection-fixture',!spec.projectionFixturePath,'Fixture projections cannot be captured');
  add('week-and-season',Number.isInteger(Number(spec.season))&&Number(spec.season)>2020&&Number.isInteger(Number(spec.week))&&Number(spec.week)>=1&&Number(spec.week)<=18,'Valid NFL season/week required');
 }
 add('yahoo-reference',fs.existsSync(referencePath),'Yahoo audit reference file must exist');
 const scheduleExists=fs.existsSync(kickoffPath)&&fs.statSync(kickoffPath).size>0;
 add('kickoff-schedule',scheduleExists,'Independent kickoff CSV should exist before capture');
 if(spec&&scheduleExists){
  try{
   const rows=parseKickoffScheduleCSV(fs.readFileSync(kickoffPath,'utf8'));
   const selected=rows.filter(r=>Number(r.season)===Number(spec.season)&&Number(r.week)===Number(spec.week));
   const kickoff=selected.map(r=>r.kickoffAt??r.gameday_utc??r.kickoff_utc);
   const valid=selected.length>0&&kickoff.every(v=>typeof v==='string'&&Number.isFinite(Date.parse(v)));
   add('kickoff-week-covered',valid,valid?selected.length+' scheduled game rows found for requested week':'Requested season/week missing or invalid kickoff times');
   if(valid)add('kickoff-week-future',kickoff.every(v=>Date.parse(v)>now),kickoff.every(v=>Date.parse(v)>now)?'All scheduled games have future kickoff timestamps':'At least one game has already started; cannot establish whole-week pregame capture');
  }catch(e){add('kickoff-week-covered',false,'Kickoff CSV could not be parsed: '+e.message);}
 }
 if(spec&&scheduleExists){const evidence=inspectKickoffVerificationEvidence({file:kickoffPath,season:spec.season,week:spec.week,now,evidencePath:verificationPath});add('kickoff-source-verified',evidence.ready,evidence.reason);}
 const fp=Boolean(env.FANTASYPROS_API_KEY),jg=Boolean(env.JERRYGM_API_KEY);
 add('provider-credentials',fp||jg,'FantasyPros or JerryGM credential must be available');
 let blockedUntil=null;
 if(jg&&fs.existsSync(quotaPath)){
  try{const state=JSON.parse(fs.readFileSync(quotaPath,'utf8'));const value=Number(state[quotaKey(env.JERRYGM_API_KEY)]);if(Number.isFinite(value)&&value>now)blockedUntil=new Date(value).toISOString();}
  catch{add('quota-state-readable',false,'JerryGM quota state cannot be parsed');}
 }
 add('jerrygm-quota',!jg||!blockedUntil||fp,blockedUntil?'JerryGM blocked until '+blockedUntil+(fp?'; FantasyPros credential available':''):'No active local JerryGM quota block detected');
 add('usable-provider-candidate',fp||(jg&&!blockedUntil),fp?'FantasyPros credential configured; availability not verified':jg&&!blockedUntil?'JerryGM credential configured with no local quota block; availability not verified':'No configured provider can currently be attempted; cache-only projections are not calibration eligible');
 return {schemaVersion:1,mode:'offline-preflight',networkRequests:0,ready:checks.every(c=>c.pass),checks,providerCredentials:{fantasypros:fp,jerrygm:jg},jerrygmBlockedUntil:blockedUntil,note:'Preflight does not guarantee provider success, valid Yahoo credentials, or fresh provider observations. It never makes a network request.'};
}
