import fs from 'node:fs';
import path from 'node:path';
import {readArchiveDirectory} from '../src/data/historical-projection-importer.js';
import {assessProspectiveCaptureReadiness} from '../src/data/prospective-capture-readiness.js';
const root='data/private';
try{
 const archives=readArchiveDirectory(path.join(root,'projection-archives-enriched'));
 const originals=readArchiveDirectory(path.join(root,'projection-archives'));
 const names=new Set(archives.map(a=>path.basename(a.path)));
 const merged=[...archives,...originals.filter(a=>!names.has(path.basename(a.path)))];
 const file=path.join(root,'historical-actuals.json');
 const raw=fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):[];
 const actuals=Array.isArray(raw)?raw:raw?.rows;
 if(!Array.isArray(actuals))throw new Error('Actuals must be array or {rows:array}');
 const report=assessProspectiveCaptureReadiness(merged,actuals);
 fs.mkdirSync(root,{recursive:true});
 fs.writeFileSync(path.join(root,'prospective-capture-readiness.json'),JSON.stringify(report,null,2)+'\n');
 console.log('CAPTURE READINESS: '+report.v3Archives+' v3 archives, '+report.legacyArchives+' legacy archives, '+report.totals.freshProviderRows+' fresh provider rows, '+report.totals.pregameKickoffVerifiedRows+' kickoff-verified pregame rows.');
 for(const week of report.weeks)console.log('CAPTURE WEEK: '+JSON.stringify(week));
 console.log('NEXT ACTION: '+report.nextAction);
 console.log('CAPTURE READINESS: private report data/private/prospective-capture-readiness.json; no network requests.');
}catch(error){console.error('CAPTURE READINESS: FAIL; '+error.message);process.exitCode=1;}
