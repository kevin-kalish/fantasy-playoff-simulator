import fs from 'node:fs';
import {prioritizeScoringReadiness} from '../src/data/scoring-readiness-priority.js';
try {
 const source='data/private/yahoo-participation-coverage.json';
 if(!fs.existsSync(source))throw Error('Missing '+source+'; provide path to an existing private coverage report as first argument');
 const input=process.argv[2]??source;
 if(!/^data\/private\/[a-zA-Z0-9_.-]+\.json$/.test(input))throw Error('Coverage input must be directly under data/private/');
 const report=JSON.parse(fs.readFileSync(input,'utf8'));
 const result=prioritizeScoringReadiness(report);
 const output='data/private/scoring-readiness-priority.json';
 fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n',{mode:0o600});
 console.log('SCORING PRIORITY: '+JSON.stringify(result.summary));
 console.table(result.priorityRecords.slice(0,20));
 console.log('SCORING PRIORITY: private report '+output+'; no gates changed.');
}catch(e){console.error('SCORING PRIORITY: BLOCKED; '+e.message);process.exitCode=1;}
