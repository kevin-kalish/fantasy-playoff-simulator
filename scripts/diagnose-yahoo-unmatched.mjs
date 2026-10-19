import fs from 'node:fs';
import path from 'node:path';
import {diagnoseUnmatchedYahooPlayers} from '../src/data/yahoo-unmatched-diagnostics.js';
const load=file=>{const data=JSON.parse(fs.readFileSync(file,'utf8'));if(!Array.isArray(data.rows))throw new Error('Expected rows array in '+file);return data.rows;};
try{
 const nfl=load('data/private/historical-actuals.json');
 const yahoo=load('data/private/yahoo-player-actuals.json');
 const report=diagnoseUnmatchedYahooPlayers(nfl,yahoo);
 const output='data/private/yahoo-unmatched-diagnostics.json';
 fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');
 console.log('UNMATCHED YAHOO: '+report.unmatched+' of '+report.yahooRows+' Yahoo records need review.');
 console.log('UNMATCHED REASONS: '+JSON.stringify(report.reasons));
 console.log('UNMATCHED YAHOO: private report '+output+'; no automatic player mapping or model changes.');
}catch(error){console.error('UNMATCHED YAHOO: ERROR; '+error.message);process.exitCode=1;}
