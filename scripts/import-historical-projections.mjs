import fs from 'node:fs';
import path from 'node:path';
import {readArchiveDirectory,importHistoricalProjectionArchives} from '../src/data/historical-projection-importer.js';
import {evaluateProjectionAccuracy} from '../src/model/projection-accuracy-calibration.js';
const [directory='data/private/projection-archives-enriched',actualFile='data/private/historical-actuals.json']=process.argv.slice(2);
try{
 const archives=readArchiveDirectory(directory);
 if(!fs.existsSync(actualFile)){console.error('HISTORICAL IMPORT: actuals file missing: '+actualFile+'; no output written');process.exit(2);}
 const raw=JSON.parse(fs.readFileSync(actualFile,'utf8')),actuals=Array.isArray(raw)?raw:raw.rows;
 if(!Array.isArray(actuals))throw new Error('actuals must be an array or {rows:array}');
 const result=importHistoricalProjectionArchives(archives,actuals);
 const evaluated=evaluateProjectionAccuracy(result.rows);
 const output='data/private/historical-projections.json';
 if(!result.rows.length){console.error('HISTORICAL IMPORT: no verified pregame projection/actual pairs; no calibration dataset written. Archives '+archives.length+'; rejected '+result.rejected.length);process.exit(2);}
 fs.mkdirSync(path.dirname(output),{recursive:true});
 fs.writeFileSync(output,JSON.stringify(result.rows,null,2)+'\n');
 fs.writeFileSync('data/private/historical-import-diagnostics.json',JSON.stringify({import:result.diagnostics,rejected:result.rejected,quality:evaluated.quality},null,2)+'\n');
 console.log('HISTORICAL IMPORT: '+result.rows.length+' verified pairs; '+result.rejected.length+' rejected; '+archives.length+' archives.');
 console.log('PRIVATE DATASET: '+output);
}catch(error){console.error('HISTORICAL IMPORT: FAIL; '+error.message);process.exitCode=1;}
