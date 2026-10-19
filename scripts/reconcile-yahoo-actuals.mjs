import fs from 'node:fs';
import path from 'node:path';
import {compareYahooActualScores} from '../src/data/yahoo-actuals-reconciliation.js';
const actualPath=process.argv[2]??'data/private/historical-actuals.json';
const yahooPath=process.argv[3]??'data/private/yahoo-player-actuals.json';
const output='data/private/yahoo-scoring-reconciliation.json';
try{
 const readRows=file=>{if(!fs.existsSync(file))return null;const data=JSON.parse(fs.readFileSync(file,'utf8'));return Array.isArray(data)?data:data.rows};
 const actuals=readRows(actualPath),yahoo=readRows(yahooPath);
 if(!Array.isArray(actuals))throw new Error('Missing or invalid NFL actuals: '+actualPath);
 const report=compareYahooActualScores(actuals,Array.isArray(yahoo)?yahoo:[]);
 report.yahooSourceAvailable=Array.isArray(yahoo);
 report.yahooSourcePath=yahooPath;
 fs.mkdirSync(path.dirname(output),{recursive:true});
 fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');
 console.log('YAHOO SCORING: '+(report.pass?'PASS':'NOT VERIFIED')+'; '+report.summary.compared+' exact-ID comparisons, '+report.summary.mismatches+' mismatches, '+report.summary.unmatched+' unmatched.');
 console.log('YAHOO SCORING: '+(report.yahooSourceAvailable?'Yahoo score file found':'Yahoo score file missing')+'; report '+output);
 if(!report.pass)process.exitCode=2;
}catch(e){console.error('YAHOO SCORING: ERROR; '+e.message);process.exitCode=1;}
