import fs from 'node:fs';
import path from 'node:path';
import {auditCompletedActuals} from '../src/data/completed-actuals-quality.js';
const input='data/private/historical-actuals.json',output='data/private/actuals-quality-audit.json';
if(!fs.existsSync(input)){console.error('ACTUALS QUALITY: missing '+input);process.exitCode=2;}
else{
 try{
  const data=JSON.parse(fs.readFileSync(input,'utf8'));
  if(!Array.isArray(data.rows))throw new Error('Expected actuals object with rows array');
  const report=auditCompletedActuals(data.rows,{sourceScoring:String(data.scoring??'HALF').toUpperCase()});
  fs.mkdirSync(path.dirname(output),{recursive:true});
  fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');
  console.log('ACTUALS QUALITY: '+(report.pass?'PASS':'FAIL')+'; '+report.rows+' rows, '+report.uniquePlayerWeeks+' unique player-weeks, '+report.issueCount+' issues.');
  console.log('ACTUALS QUALITY WEEKS: '+JSON.stringify(report.weeks));
  console.log('ACTUALS QUALITY REASONS: '+JSON.stringify(report.reasons));
  console.log('ACTUALS QUALITY: '+output+'; Yahoo scoring reconciliation not established.');
  if(!report.pass)process.exitCode=2;
 }catch(e){console.error('ACTUALS QUALITY: ERROR; '+e.message);process.exitCode=1;}
}
