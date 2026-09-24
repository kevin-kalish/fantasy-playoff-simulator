import fs from 'node:fs';
import {rankWaiverCandidates,compactWaiverRanking} from '../src/model/waiver-ranker.js';
const [inputPath,specPath]=process.argv.slice(2);
if(!inputPath||!specPath){console.error('Usage: node scripts/rank-waivers.mjs <simulation-input.json> <waiver-spec.json>');process.exit(1)}
const input=JSON.parse(fs.readFileSync(inputPath,'utf8')),spec=JSON.parse(fs.readFileSync(specPath,'utf8'));
const ranked=rankWaiverCandidates(input,spec,spec.options||{}),compact=compactWaiverRanking(ranked,{limit:Number(spec.limit||10)});
for(const row of compact)console.error(`#${row.rank} ${row.summary}`);
console.log(JSON.stringify({teamId:spec.teamId,count:ranked.length,ranked:compact},null,2));
