import fs from 'node:fs';
import {evaluateTradeScenario} from '../src/model/trade-evaluator.js';
const [inputPath,specPath]=process.argv.slice(2);if(!inputPath||!specPath){console.error('Usage: npm run scenario:trade -- <simulation-input.json> <trade-spec.json>');process.exit(1)}
const read=p=>JSON.parse(fs.readFileSync(p,'utf8')),input=read(inputPath),spec=read(specPath),r=evaluateTradeScenario(input,spec);
const pct=n=>`${n>=0?'+':''}${(n*100).toFixed(2)}%`,wins=n=>`${n>=0?'+':''}${n.toFixed(3)}`;
for(const side of ['A','B']){const x=r.teams[side];console.log(`${x.teamName}: ${pct(x.playoffDelta)} playoff, ${pct(x.championshipDelta)} championship, ${wins(x.winsDelta)} wins`)}
console.log(JSON.stringify({trade:r.trade,simulations:r.simulations,seed:r.seed,teams:r.teams},null,2));
