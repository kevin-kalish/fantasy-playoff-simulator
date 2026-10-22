import fs from 'node:fs';
import {reviewScoringEvidence} from '../src/data/scoring-evidence-review.js';
const read=file=>fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):null;
try {
 const settings=read('data/private/yahoo-scoring-settings.json');
 const crossProvider=read('data/private/yahoo-nflverse-score-audit.json');
 const report=reviewScoringEvidence({settings,crossProvider});
 console.log(JSON.stringify(report,null,2));
 if(!report.verified)process.exitCode=2;
} catch(error){console.error('SCORING EVIDENCE: ERROR '+error.message);process.exitCode=1;}
