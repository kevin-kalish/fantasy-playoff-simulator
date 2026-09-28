import fs from 'node:fs';
import {mergeCurrentState,summarizeCurrentStatePatch} from '../src/data/current-state-merge.js';
import {validateLeagueSnapshot} from '../src/data/league-snapshot.js';

const basePath=process.argv[2]??'data/private/fightin-kali-current.json';
const patchPath=process.argv[3];
const outputPath=process.argv[4]??basePath;
if(!patchPath){console.error('Usage: node scripts/merge-current-state.mjs [base.json] patch.json [output.json]');process.exit(2)}
for(const p of [basePath,patchPath]) if(!fs.existsSync(p)){console.error(`Input not found: ${p}`);process.exit(2)}
try{
 const base=JSON.parse(fs.readFileSync(basePath,'utf8'));
 const patch=JSON.parse(fs.readFileSync(patchPath,'utf8'));
 const merged=mergeCurrentState(base,patch);
 const validation=validateLeagueSnapshot(merged);
 if(!validation.valid){console.error('Merged snapshot failed validation:');for(const e of validation.errors)console.error(`- ${e}`);process.exit(1)}
 fs.mkdirSync(new URL('.',`file://${process.cwd()}/${outputPath.replaceAll('\\','/')}`).pathname,{recursive:true});
 fs.writeFileSync(outputPath,JSON.stringify(validation.league,null,2)+'\n');
 const s=summarizeCurrentStatePatch(patch);
 console.log(`CURRENT STATE: MERGED | teams ${s.teamsUpdated} | schedule ${s.scheduleReplaced?'replaced':'unchanged'} | NFL games ${s.nflGamesReplaced?'replaced':'unchanged'}`);
 console.log(`Wrote: ${outputPath}`);
}catch(error){console.error(error.message);process.exit(1)}
