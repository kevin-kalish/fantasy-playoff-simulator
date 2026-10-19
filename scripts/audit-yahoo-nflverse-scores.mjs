import fs from 'node:fs';
import path from 'node:path';
import {auditYahooScoresWithOverrides} from '../src/data/yahoo-scoring-with-overrides.js';
const nflPath='data/private/historical-actuals.json',yahooPath='data/private/yahoo-player-actuals.json',out='data/private/yahoo-nflverse-score-audit.json',overridePath='data/private/yahoo-identity-overrides.json';
try{
 const read=p=>{const data=JSON.parse(fs.readFileSync(p,'utf8'));if(!Array.isArray(data.rows))throw new Error('Missing rows in '+p);return data.rows;};
 const overrides=fs.existsSync(overridePath)?JSON.parse(fs.readFileSync(overridePath,'utf8')):[];
 if(!Array.isArray(overrides))throw new Error('Identity overrides must be a JSON array');
 const report=auditYahooScoresWithOverrides(read(nflPath),read(yahooPath),{overrides});
 fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');
 console.log('CROSS-PROVIDER SCORES: '+report.summary.compared+' base matches; '+report.summary.reviewedMatches+' reviewed matches; '+report.summary.totalMatched+' total matched; '+report.summary.unmatchedIndividuals+' unmatched individuals.');
 console.log('CROSS-PROVIDER EXCEPTIONS: '+report.exceptionAudit.rejected.length+' rejected; '+report.summary.excludedDefenses+' defenses excluded.');
 console.log('CROSS-PROVIDER POSITIONS: '+JSON.stringify(report.byPosition));
 console.log('CROSS-PROVIDER SCORES: '+(report.pass?'INDIVIDUAL SCORING COVERAGE PASS (identity still provisional)':'REVIEW REQUIRED')+'; '+out);
 if(!report.pass)process.exitCode=2;
}catch(e){console.error('CROSS-PROVIDER SCORES: ERROR; '+e.message);process.exitCode=1;}
