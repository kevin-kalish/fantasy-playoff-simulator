import fs from 'node:fs';
import path from 'node:path';
import {discoverLocalEvidence} from '../src/data/local-evidence-discovery.js';
const root=path.resolve('data/private');
try{
 const report=discoverLocalEvidence(root);
 fs.mkdirSync(root,{recursive:true});
 const output=path.join(root,'historical-evidence-discovery.json');
 fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');
 console.log('EVIDENCE DISCOVERY: '+report.scannedJson+' JSON files scanned; '+report.documentsWithFreshProof+' contain sampled fresh-provider proof; '+report.documentsWithObservationTimes+' contain sampled observation timestamps.');
 console.log('EVIDENCE DISCOVERY: '+JSON.stringify(report.byDirectory));
 console.log('EVIDENCE DISCOVERY: '+report.skippedOversize+' oversized, '+report.skippedInvalidJson+' invalid JSON, '+report.skippedSymlinks+' symlinks skipped.');
 console.log('EVIDENCE DISCOVERY: private report data/private/historical-evidence-discovery.json; no external requests or archive modifications.');
}catch(e){console.error('EVIDENCE DISCOVERY: FAIL; '+e.message);process.exitCode=1;}
