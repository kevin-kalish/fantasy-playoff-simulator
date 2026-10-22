import fs from 'node:fs';
import path from 'node:path';
import {buildPrivateCalibrationReport} from '../src/model/private-calibration-report.js';
const root=path.resolve('data/private'),input=path.join(root,'historical-projections.json'),output=path.join(root,'historical-calibration-report.json');
try{
 fs.mkdirSync(root,{recursive:true});
 if(!fs.existsSync(input)){
  const status={schemaVersion:1,status:'waiting-for-verified-pairs',input:path.relative(process.cwd(),input),parameterUpdatesAllowed:false};
  fs.writeFileSync(output,JSON.stringify(status,null,2)+'\n');
  console.log('CALIBRATION: no verified historical pairs file yet. Waiting; no model changes.');
 }else{
  const data=JSON.parse(fs.readFileSync(input,'utf8'));
  const rows=Array.isArray(data)?data:data?.rows;
  if(!Array.isArray(rows))throw new Error('Historical dataset must be an array or {rows:array}');
  const report=buildPrivateCalibrationReport(rows);
  const status={generatedAt:new Date().toISOString(),status:report.reviewEligible?'candidate-review-possible':'insufficient-evidence',...report};
  fs.writeFileSync(output,JSON.stringify(status,null,2)+'\n');
  console.log('CALIBRATION: '+status.status+'; verified pairs '+report.accuracy.quality.accepted+'; chronological test observations '+report.chronological.summary.n+'.');
  console.log('CALIBRATION: private report '+path.relative(process.cwd(),output)+'; no live parameter changes.');
 }
}catch(error){console.error('CALIBRATION: FAIL; '+error.message);process.exitCode=1;}
