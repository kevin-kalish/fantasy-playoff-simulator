import {preflightPregameCapture} from '../src/data/pregame-capture-preflight.js';
const [snapshotPath,specPath]=process.argv.slice(2);
if(!snapshotPath||!specPath){console.error('Usage: npm run calibration:preflight -- <data/private/snapshot.json> <data/private/spec.json>');process.exit(2);}
const result=preflightPregameCapture({snapshotPath,specPath});
for(const check of result.checks)console.log('PREFLIGHT: '+(check.pass?'PASS':'FAIL')+' '+check.name+' — '+check.detail);
console.log('PREFLIGHT: '+(result.ready?'READY':'BLOCKED')+'; no network requests; no provider quota consumed.');
if(!result.ready)process.exitCode=2;
