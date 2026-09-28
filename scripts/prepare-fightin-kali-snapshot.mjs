import fs from 'node:fs';
import {prepareFightinKaliSnapshot} from '../src/data/fightin-kali-snapshot.js';

const inputPath=process.argv[2];
const outputPath=process.argv[3]??'data/private/fightin-kali-current.json';
const configPath='config/fightin-kali-2026.json';
if(!inputPath){console.error('Usage: node scripts/prepare-fightin-kali-snapshot.mjs input.json [output.json]');process.exit(2)}
if(!fs.existsSync(inputPath)){console.error(`Snapshot input not found: ${inputPath}`);process.exit(2)}
const config=JSON.parse(fs.readFileSync(configPath,'utf8'));
const raw=JSON.parse(fs.readFileSync(inputPath,'utf8'));
try{
 const prepared=prepareFightinKaliSnapshot(raw,config);
 if(!prepared.validation.valid){console.error('Snapshot failed validation:');for(const e of prepared.validation.errors)console.error(`- ${e}`);process.exit(1)}
 fs.mkdirSync('data/private',{recursive:true});
 fs.writeFileSync(outputPath,JSON.stringify(prepared.league,null,2)+'\n');
 console.log(`FIGHTIN' KALI SNAPSHOT: READY`);
 console.log(`Team: ${prepared.team.name} | Record ${prepared.team.wins}-${prepared.team.losses}${prepared.team.ties?`-${prepared.team.ties}`:''}`);
 console.log(`Season: ${prepared.state.season} | Next modeled week: ${prepared.state.currentWeek??'unknown'}`);
 console.log(`Playoffs: ${prepared.league.playoffSpots} teams | Weeks ${prepared.league.playoffWeeks.join(', ')} | reseed ${prepared.league.reseed?'yes':'no'} | tie ${prepared.league.playoffTiebreaker}`);
 console.log(`Wrote: ${outputPath}`);
 for(const w of prepared.validation.warnings)console.error(`WARNING: ${w}`);
}catch(error){console.error(error.message);process.exit(1)}
