import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {classifyEvidenceDocument,discoverLocalEvidence} from '../src/data/local-evidence-discovery.js';
const root=fs.mkdtempSync(path.join(os.tmpdir(),'evidence-discovery-'));
try{
 fs.mkdirSync(path.join(root,'archives'));
 fs.writeFileSync(path.join(root,'archives','legacy.json'),JSON.stringify({schemaVersion:2,rows:[{season:2026,week:6,projection:10}]}));
 fs.writeFileSync(path.join(root,'archives','fresh.json'),JSON.stringify({schemaVersion:3,immutableArchive:true,rows:[{forecastProvenance:{kind:'fresh-provider-response',provider:'jerrygm',observedAt:'2026-10-10T12:00:00Z'}}]}));
 const result=discoverLocalEvidence(root);
 assert.equal(result.scannedJson,2);
 assert.equal(result.documentsWithFreshProof,1);
 assert.equal(result.documentsWithObservationTimes,1);
 assert.equal(result.documentsWithLegacySchema,1);
 assert.equal(result.byDirectory.archives.documents,2);
 assert.equal(result.parameterUpdatesAllowed,false);
 assert.equal(classifyEvidenceDocument({rows:[]}).freshProofRows,0);
 assert.equal(discoverLocalEvidence(path.join(root,'absent')).status,'directory-not-found');
 console.log('local-evidence-discovery-tests: all checks passed');
}finally{fs.rmSync(root,{recursive:true,force:true});}
