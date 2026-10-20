import {dryRunPregameCapture} from '../src/data/pregame-capture-dry-run.js';
const [snapshotPath,specPath,seasonArg,weekArg]=process.argv.slice(2);
if(!snapshotPath||!specPath||!seasonArg||!weekArg){console.error('Usage: npm run calibration:dry-run -- data/private/snapshot.json data/private/spec.json 2026 7');process.exit(2);}
const result=dryRunPregameCapture({snapshotPath,specPath,sourceOptions:{season:Number(seasonArg),week:Number(weekArg)}});
for(const c of result.checks)console.log('DRY RUN: '+(c.pass?'PASS':'BLOCKED')+' '+c.name+' — '+c.detail);
console.log('DRY RUN: STRUCTURE '+(result.structuralReady?'READY':'BLOCKED'));
console.log('DRY RUN: CAPTURE '+(result.captureReady?'LOCAL PREREQUISITES READY':'BLOCKED'));
console.log('DRY RUN: roster '+result.roster?.expectedPlayers+'; scoring '+result.scoringStatus+'; scoring independently verified '+result.scoringVerified+'; network requests 0; archives created 0.');
if(!result.captureReady)process.exitCode=2;
