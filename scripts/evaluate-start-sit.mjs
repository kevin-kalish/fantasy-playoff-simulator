import fs from 'node:fs';import {evaluateStartSitChoices} from '../src/model/start-sit-evaluator.js';
const [inputPath,specPath]=process.argv.slice(2);if(!inputPath||!specPath){console.error('Usage: npm run scenario:start-sit -- <simulation-input.json> <start-sit-spec.json>');process.exit(1)}
const read=p=>JSON.parse(fs.readFileSync(p,'utf8')),input=read(inputPath),spec=read(specPath),rows=evaluateStartSitChoices(input,spec);const pct=n=>`${n>=0?'+':''}${(n*100).toFixed(2)}%`;
for(const r of rows)console.log(`#${r.rank} Start ${r.startPlayerName} / Sit ${r.sitPlayerName} (${r.slot}): ${r.projectedPointDelta>=0?'+':''}${r.projectedPointDelta.toFixed(2)} pts, ${pct(r.playoffDelta)} playoff, ${pct(r.championshipDelta)} championship`);console.log(JSON.stringify(rows,null,2));
