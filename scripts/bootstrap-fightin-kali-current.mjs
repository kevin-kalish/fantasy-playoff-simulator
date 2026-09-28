import fs from 'node:fs';
import {bootstrapCurrentState} from '../src/data/current-state-bootstrap.js';

const capturePath=process.argv[2];
const outputPath=process.argv[3]??'data/private/fightin-kali-current.json';
const configPath='config/fightin-kali-2026.json';
const fail=m=>{console.error(`BOOTSTRAP: FAIL; ${m}`);process.exit(2)};
if(!capturePath) fail('usage: node scripts/bootstrap-fightin-kali-current.mjs capture.json [output.json]');
if(!fs.existsSync(capturePath)) fail(`capture not found: ${capturePath}`);
try{
 const capture=JSON.parse(fs.readFileSync(capturePath,'utf8'));
 const config=JSON.parse(fs.readFileSync(configPath,'utf8'));
 const prepared=bootstrapCurrentState(capture,config);
 if(!prepared.validation.valid) fail(prepared.validation.errors.join('; '));
 fs.mkdirSync('data/private',{recursive:true});
 fs.writeFileSync(outputPath,JSON.stringify(prepared.league,null,2)+'\n');
 console.log(`BOOTSTRAP: READY | ${prepared.league.teams.length} teams | ${prepared.league.schedule.length} modeled schedule weeks`);
 console.log(`Team: ${prepared.team.name} | Record ${prepared.team.wins}-${prepared.team.losses}${prepared.team.ties?`-${prepared.team.ties}`:''}`);
 console.log(`Wrote: ${outputPath}`);
 for(const w of prepared.validation.warnings) console.error(`WARNING: ${w}`);
}catch(error){fail(error.message)}
