import fs from 'node:fs';
import path from 'node:path';
import {readArchiveDirectory,importHistoricalProjectionArchives} from '../src/data/historical-projection-importer.js';
import {reconcileProjectionActualIds} from '../src/data/completed-nfl-actuals.js';
import {evaluateProjectionAccuracy} from '../src/model/projection-accuracy-calibration.js';
const [directory='data/private/projection-archives-enriched',actualFile='data/private/historical-actuals.json']=process.argv.slice(2);
const counts=items=>items.reduce((out,x)=>(out[x.reason]=(out[x.reason]||0)+1,out),{});
try{
 const archives=readArchiveDirectory(directory);
 if(!archives.length)throw new Error('No enriched archives found at '+directory);
 if(!fs.existsSync(actualFile))throw new Error('Actuals file missing: '+actualFile);
 const raw=JSON.parse(fs.readFileSync(actualFile,'utf8')),actuals=Array.isArray(raw)?raw:raw.rows;
 if(!Array.isArray(actuals))throw new Error('actuals must be an array or {rows:array}');
 const reconciled=reconcileProjectionActualIds(archives,actuals);
 const result=importHistoricalProjectionArchives(reconciled.archives,actuals);
 const evaluated=evaluateProjectionAccuracy(result.rows);
 const diagnostics={import:{...result.diagnostics,identityMatched:reconciled.matched,identityRejected:reconciled.rejected.length,accuracyAccepted:evaluated.accepted??null},rejectionReasons:counts(result.rejected),identityRejectionReasons:counts(reconciled.rejected),rejected:result.rejected,identityRejected:reconciled.rejected,quality:evaluated.quality};
 fs.mkdirSync('data/private',{recursive:true});
 fs.writeFileSync('data/private/historical-import-diagnostics.json',JSON.stringify(diagnostics,null,2)+'\n');
 console.log('HISTORICAL IMPORT: '+result.rows.length+' joined; '+result.rejected.length+' rejected; '+archives.length+' archives; identity matched '+reconciled.matched+'.');
 console.log('REJECTION REASONS: '+JSON.stringify(diagnostics.rejectionReasons));
 console.log('IDENTITY REJECTIONS: '+JSON.stringify(diagnostics.identityRejectionReasons));
 console.log('PRIVATE DIAGNOSTICS: data/private/historical-import-diagnostics.json');
 const output='data/private/historical-projections.json';
 if(!result.rows.length){console.error('HISTORICAL IMPORT: no verified pairs yet; no calibration dataset written.');process.exitCode=2;}
 else{fs.writeFileSync(output,JSON.stringify(result.rows,null,2)+'\n');console.log('PRIVATE DATASET: '+output);}
}catch(error){console.error('HISTORICAL IMPORT: FAIL; '+error.message);process.exitCode=1;}
