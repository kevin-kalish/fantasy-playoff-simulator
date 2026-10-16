import fs from 'node:fs';
import path from 'node:path';
import {readArchiveDirectory} from '../src/data/historical-projection-importer.js';
import {auditOriginalArchives} from '../src/data/original-archive-audit.js';
const root='data/private';
try{
 const archives=readArchiveDirectory(path.join(root,'projection-archives'));
 const actualPath=path.join(root,'historical-actuals.json');
 const raw=fs.existsSync(actualPath)?JSON.parse(fs.readFileSync(actualPath,'utf8')):[];
 const actuals=Array.isArray(raw)?raw:raw?.rows;
 if(!Array.isArray(actuals))throw new Error('Historical actuals must be an array or {rows:array}');
 const result=auditOriginalArchives(archives,actuals);
 fs.mkdirSync(root,{recursive:true});
 fs.writeFileSync(path.join(root,'original-archive-audit.json'),JSON.stringify(result,null,2)+'\n');
 console.log('ORIGINAL ARCHIVES: '+result.archives+' files, '+result.totalRows+' rows, '+result.strictImportCandidates+' strict import candidates.');
 for(const a of result.byArchive)console.log('ARCHIVE AUDIT: '+JSON.stringify(a));
 console.log('ORIGINAL ARCHIVES: private report data/private/original-archive-audit.json; no API requests, no archive changes.');
}catch(error){console.error('ORIGINAL ARCHIVES: FAIL; '+error.message);process.exitCode=1;}
