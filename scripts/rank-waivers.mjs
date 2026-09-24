import fs from 'node:fs';
import {rankWaiverCandidates} from '../src/model/waiver-ranker.js';
const [inputPath,specPath]=process.argv.slice(2);
if(!inputPath||!specPath){console.error('Usage: node scripts/rank-waivers.mjs <simulation-input.json> <waiver-spec.json>');process.exit(1)}
const input=JSON.parse(fs.readFileSync(inputPath,'utf8')),spec=JSON.parse(fs.readFileSync(specPath,'utf8'));
const ranked=rankWaiverCandidates(input,spec,spec.options||{});
const compact=ranked.map(r=>({rank:r.rank,addPlayerId:r.addPlayerId,addPlayerName:r.addPlayerName,dropPlayerId:r.dropPlayerId,playoffDelta:r.playoffDelta,championshipDelta:r.championshipDelta,winsDelta:r.winsDelta}));
console.log(JSON.stringify({teamId:spec.teamId,count:compact.length,ranked:compact},null,2));
