import fs from 'node:fs';
import {compareYahooScoringToModel} from '../src/data/yahoo-scoring-comparison.js';
const file=process.argv[2]||'data/private/yahoo-scoring-settings.json';
try {
 const record=JSON.parse(fs.readFileSync(file,'utf8'));
 const result=compareYahooScoringToModel(record);
 console.log(JSON.stringify(result,null,2));
 if(!result.verified)process.exitCode=2;
} catch(error) {
 console.error('SCORING COMPARISON: ERROR '+error.message);
 process.exitCode=1;
}
