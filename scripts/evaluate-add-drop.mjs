import fs from 'node:fs';
import {evaluateAddDropScenario} from '../src/model/transaction-scenarios.js';
const [inputPath,scenarioPath]=process.argv.slice(2);
if(!inputPath||!scenarioPath){console.error('Usage: node scripts/evaluate-add-drop.mjs <simulation-input.json> <scenario.json>');process.exit(1)}
const input=JSON.parse(fs.readFileSync(inputPath,'utf8')),scenario=JSON.parse(fs.readFileSync(scenarioPath,'utf8'));
const result=evaluateAddDropScenario(input,scenario);
console.log(JSON.stringify(result,null,2));
