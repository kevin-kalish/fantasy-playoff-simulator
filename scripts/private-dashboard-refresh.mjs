// Local-only, single-flight Yahoo refresh. Never run a shell or accept browser-supplied commands.
import {spawn} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export function createRefreshController({start=null,readReport=null}={}){
 let state={phase:'idle',startedAt:null,finishedAt:null,error:null};
 let busy=false;
 let before=null;
 const runner=start??(()=>spawn(process.execPath,[path.join(root,'scripts/run-fightin-kali-weekly.mjs')],{
  cwd:root,env:{...process.env,LINEUP_MANAGEMENT_STRESS:'false',LONG_RANGE_SENSITIVITY:'false'},shell:false,windowsHide:true,stdio:['ignore','pipe','pipe']
 }));
 function refresh(){
  if(busy)return false;
  busy=true;state={phase:'running',startedAt:new Date().toISOString(),finishedAt:null,error:null};
  try{before=readReport?.()??null}catch{before=null}
  let settled=false;
  let child;try{child=runner()}catch{complete(false);return true}
  let stderr='';
  child.stderr?.on('data',chunk=>{stderr=(stderr+String(chunk)).slice(-8192)});
  child.stdout?.resume();
  child.on('error',()=>complete(false));
  child.on('close',code=>complete(code===0));
  function complete(ok){
   if(settled)return;
   settled=true;busy=false;
   let reportError=null;
   if(ok&&readReport){
    try{
     const after=readReport();
     if(after?.readiness?.ready!==true)throw Error('New report did not pass readiness.');
     if(!after?.report?.team?.id)throw Error('New report is missing the target team.');
     if(before?.report?.team?.id&&String(after.report.team.id)!==String(before.report.team.id))throw Error('Refreshed report belongs to a different team.');
     const fresh=Date.parse(after?.report?.generatedAt??'');
     const prior=Date.parse(before?.report?.generatedAt??'');
     if(!Number.isFinite(fresh)||before&&(!Number.isFinite(prior)||fresh<=prior))throw Error('No newer valid report was produced.');
    }catch(error){ok=false;reportError=error.message}
   }
   state={...state,phase:ok?'succeeded':'failed',finishedAt:new Date().toISOString(),error:ok?null:reportError??'Yahoo refresh failed. Check the private PowerShell console for details.'};
   if(!ok)console.error('PRIVATE DASHBOARD REFRESH: failed; see local Yahoo credentials/provider status. '+stderr.replace(/[^\x20-\x7e\n]/g,' ').slice(-1000));
  }
  return true;
 }
 return {refresh,status:()=>({...state})};
}
