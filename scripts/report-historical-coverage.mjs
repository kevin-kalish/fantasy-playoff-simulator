import fs from 'node:fs';
import path from 'node:path';
import {readArchiveDirectory} from '../src/data/historical-projection-importer.js';
import {assessHistoricalDataCoverage,auditHistoricalArchiveProvenance} from '../src/data/historical-data-coverage.js';
const root='data/private',directory=process.argv[2]??path.join(root,'projection-archives-enriched'),actualFile=process.argv[3]??path.join(root,'historical-actuals.json');
try{
 const archives=readArchiveDirectory(directory);
 const raw=fs.existsSync(actualFile)?JSON.parse(fs.readFileSync(actualFile,'utf8')):[];
 const actuals=Array.isArray(raw)?raw:raw?.rows;
 if(!Array.isArray(actuals))throw new Error('Actuals must be an array or {rows:array}');
 const report=assessHistoricalDataCoverage(archives,actuals);
 const audit=auditHistoricalArchiveProvenance(archives);
 fs.mkdirSync(root,{recursive:true});
 const output=path.join(root,'historical-data-coverage.json');
 fs.writeFileSync(output,JSON.stringify({...report,provenanceAudit:audit},null,2)+'\n');
 console.log('HISTORICAL COVERAGE: '+report.archives+' archives, '+report.projectionRows+' projection rows, '+report.actualRows+' actual rows.');
 console.log('HISTORICAL COVERAGE: '+report.potentiallyMatchableRows+' rows have verified provenance and a completed-actuals week; player identity matching not yet checked.');
 console.log('HISTORICAL COVERAGE: issues '+JSON.stringify(report.issueCounts));
 console.log('PROVENANCE AUDIT: '+JSON.stringify(audit.failureCounts));
 console.log('HISTORICAL COVERAGE: private report '+output+'; no external API requests.');
}catch(error){console.error('HISTORICAL COVERAGE: FAIL; '+error.message);process.exitCode=1;}
