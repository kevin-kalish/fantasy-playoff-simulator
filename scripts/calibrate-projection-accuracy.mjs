import fs from 'node:fs';
import {evaluateProjectionAccuracy} from '../src/model/projection-accuracy-calibration.js';
const [input,output='data/private/projection-accuracy-report.json']=process.argv.slice(2);
if(!input){console.error('Usage: node scripts/calibrate-projection-accuracy.mjs <archived-rows.json> [private-report.json]');process.exit(2);}
try{
 const rows=JSON.parse(fs.readFileSync(input,'utf8'));
 const result=evaluateProjectionAccuracy(rows);
 if(!output.startsWith('data/private/')&&!output.startsWith('data\\private\\'))throw new Error('output must be under data/private');
 fs.mkdirSync('data/private',{recursive:true});
 fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n');
 console.log('PROJECTION ACCURACY: '+result.quality.confidence+'; accepted '+result.quality.accepted+'; rejected '+result.quality.rejected+'; MAE '+(result.overall.mae?.toFixed(2)??'n/a')+'; RMSE '+(result.overall.rmse?.toFixed(2)??'n/a'));
 console.log('PRIVATE CALIBRATION REPORT: '+output);
}catch(error){console.error('PROJECTION ACCURACY: FAIL; '+error.message);process.exitCode=1;}
