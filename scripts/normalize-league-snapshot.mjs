import fs from 'node:fs';
import {importLeagueSnapshot} from '../src/data/league-snapshot.js';

const inputPath=process.argv[2];
const outputPath=process.argv[3];
if(!inputPath){
 console.error('Usage: node scripts/normalize-league-snapshot.mjs input.json [output.json]');
 process.exit(1);
}
const raw=fs.readFileSync(inputPath,'utf8');
try{
 const {league,warnings}=importLeagueSnapshot(raw);
 const json=JSON.stringify(league,null,2)+'\n';
 if(outputPath){fs.writeFileSync(outputPath,json);console.error(`Wrote normalized league snapshot to ${outputPath}`)}else process.stdout.write(json);
 for(const warning of warnings) console.error(`WARNING: ${warning}`);
}catch(error){console.error(error.message);process.exit(1)}
