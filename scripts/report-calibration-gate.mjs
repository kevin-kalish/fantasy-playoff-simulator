import fs from 'node:fs';
import path from 'node:path';
import {readArchiveDirectory} from '../src/data/historical-projection-importer.js';
import {diagnoseCaptureSources} from '../src/data/capture-source-diagnostics.js';
import {buildCalibrationGateReport} from '../src/data/calibration-gate-report.js';
const root='data/private',season=Number(process.argv[2]??2026),week=Number(process.argv[3]??6);
try{
 const originals=readArchiveDirectory(path.join(root,'projection-archives'));
 const enriched=readArchiveDirectory(path.join(root,'projection-archives-enriched'));
 const names=new Set(enriched.map(a=>path.basename(a.path)));
 const archives=[...enriched,...originals.filter(a=>!names.has(path.basename(a.path)))];
 const file=path.join(root,'historical-actuals.json');
 const raw=fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):[];
 const actuals=Array.isArray(raw)?raw:raw?.rows;
 if(!Array.isArray(actuals))throw new Error('Invalid actuals JSON');
 const sources=diagnoseCaptureSources({season,week});
 const report=buildCalibrationGateReport({archives,actuals,sources,season,week});
 console.log(JSON.stringify(report,null,2));
}catch(error){console.error('CALIBRATION GATE: FAIL; '+error.message);process.exitCode=1;}
