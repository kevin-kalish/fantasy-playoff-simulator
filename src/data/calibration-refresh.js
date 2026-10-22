import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {readArchiveDirectory} from './historical-projection-importer.js';
export function calibrationRefreshPlan({season=2026,archives=0,refreshSchedule=false}={}){
 if(!Number.isInteger(Number(season))||Number(season)<1999)throw new Error('Invalid season');
 const steps=[];
 if(refreshSchedule)steps.push({name:'kickoffs',args:['scripts/fetch-nfl-kickoffs.mjs',String(season)]});
 if(archives>0)steps.push({name:'enrich',args:['scripts/enrich-projection-kickoffs.mjs']});
 steps.push({name:'actuals',args:['scripts/fetch-completed-nfl-actuals.mjs',String(season)]});
 if(archives>0)steps.push({name:'import',args:['scripts/import-historical-projections.mjs'],allowNoPairs:true});
 return steps;
}
export function runCalibrationRefresh({season=2026,refreshSchedule=false,privateDir='data/private',run=(args)=>spawnSync(process.execPath,args,{encoding:'utf8',timeout:180000}),now=()=>new Date().toISOString()}={}){
 const base=path.resolve(privateDir);
 if(base!==path.resolve('data/private'))throw new Error('Refresh must use data/private');
 fs.mkdirSync(base,{recursive:true});
 const lock=path.join(base,'calibration-refresh.lock');
 const fd=fs.openSync(lock,'wx');
 const report={startedAt:now(),season,steps:[],status:'running'};
 try{
  const archives=readArchiveDirectory(path.join(base,'projection-archives')).length;
  const schedule=path.join(base,'nfl-kickoffs.csv');
  const plan=calibrationRefreshPlan({season,archives,refreshSchedule:refreshSchedule||!fs.existsSync(schedule)});
  for(const step of plan){
   const result=run(step.args),code=result.status??1;
   report.steps.push({name:step.name,status:code===0?'ok':step.allowNoPairs&&code===2?'no-pairs':'failed',exitCode:code,stdout:String(result.stdout??'').slice(-5000),stderr:String(result.stderr??'').slice(-5000)});
   if(code!==0&&!(step.allowNoPairs&&code===2)){report.status='failed';break;}
  }
  if(report.status!=='failed')report.status=report.steps.some(s=>s.status==='no-pairs')?'waiting-for-completed-pairs':'ok';
 }catch(error){report.status='failed';report.error=error.message;}
 finally{
  report.finishedAt=now();
  fs.writeFileSync(path.join(base,'calibration-refresh-status.json'),JSON.stringify(report,null,2)+'\n');
  fs.closeSync(fd);fs.unlinkSync(lock);
 }
 return report;
}
