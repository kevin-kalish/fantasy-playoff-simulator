import fs from 'node:fs';
import {captureToPatch,CAPTURE_HELP} from '../src/data/current-state-capture.js';
import {mergeCurrentState} from '../src/data/current-state-merge.js';
import {validateLeagueSnapshot} from '../src/data/league-snapshot.js';

const capturePath=process.argv[2];
const basePath=process.argv[3]??'data/private/fightin-kali-current.json';
const outputPath=process.argv[4]??basePath;
if(!capturePath){console.error('Usage: node scripts/capture-current-state.mjs capture.json [base.json] [output.json]\n\n'+CAPTURE_HELP);process.exit(2)}
for(const p of [capturePath,basePath]) if(!fs.existsSync(p)){console.error(`Input not found: ${p}`);process.exit(2)}
try{
 const capture=JSON.parse(fs.readFileSync(capturePath,'utf8'));
 const base=JSON.parse(fs.readFileSync(basePath,'utf8'));
 const patch=captureToPatch(capture);
 const merged=mergeCurrentState(base,patch);
 const validation=validateLeagueSnapshot(merged);
 if(!validation.valid){console.error('Captured state failed validation:');for(const e of validation.errors)console.error(`- ${e}`);process.exit(1)}
 fs.writeFileSync(outputPath,JSON.stringify(validation.league,null,2)+'\n');
 console.log(`CAPTURE: ACCEPTED | ${patch.teams.length} standings rows | ${patch.schedule?.length??0} schedule weeks`);
 console.log(`Wrote: ${outputPath}`);
}catch(error){console.error(error.message);process.exit(1)}
