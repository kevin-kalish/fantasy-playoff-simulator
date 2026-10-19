import fs from 'node:fs';
import path from 'node:path';
import {reconcileYahooNflverseScores} from '../src/data/yahoo-nflverse-score-audit.js';
const nflPath='data/private/historical-actuals.json',yahooPath='data/private/yahoo-player-actuals.json',out='data/private/yahoo-nflverse-score-audit.json';
try{
 const read=p=>{const data=JSON.parse(fs.readFileSync(p,'utf8'));if(!Array.isArray(data.rows))throw new Error('Missing rows in '+p);return data.rows;};
 const report=reconcileYahooNflverseScores(read(nflPath),read(yahooPath));
 fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');
 console.log('CROSS-PROVIDER SCORES: '+report.summary.compared+' provisional matches; '+report.summary.mismatches+' mismatches; '+report.summary.unmatched+' unmatched; '+report.summary.ambiguous+' ambiguous.');
 console.log('CROSS-PROVIDER POSITIONS: '+JSON.stringify(report.byPosition));
 console.log('CROSS-PROVIDER SCORES: '+(report.pass?'ALL MATCHED SCORES AGREE (identity still provisional)':'REVIEW REQUIRED')+'; '+out);
 if(!report.pass)process.exitCode=2;
}catch(e){console.error('CROSS-PROVIDER SCORES: ERROR; '+e.message);process.exitCode=1;}
