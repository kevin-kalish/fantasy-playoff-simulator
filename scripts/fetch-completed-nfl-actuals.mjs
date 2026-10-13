import fs from 'node:fs';
import path from 'node:path';
import {fetchNflverseCSV} from '../src/data/nflverse-source.js';
import {parseKickoffScheduleCSV} from '../src/data/projection-kickoff-enrichment.js';
import {normalizeCompletedNflverseActuals} from '../src/data/completed-nfl-actuals.js';
const season=Number(process.argv[2]??2026),scheduleFile='data/private/nfl-kickoffs.csv',output='data/private/historical-actuals.json';
try{
 if(!fs.existsSync(scheduleFile))throw new Error('Missing schedule; run npm run calibration:fetch-kickoffs -- '+season);
 const scheduleRows=parseKickoffScheduleCSV(fs.readFileSync(scheduleFile,'utf8'));
 const download=await fetchNflverseCSV('player',season);
 const result=normalizeCompletedNflverseActuals(download.text,{season,scheduleRows});
 if(!result.rows.length)throw new Error('No completed player-week rows; no output written');
 fs.mkdirSync(path.dirname(output),{recursive:true});
 fs.writeFileSync(output,JSON.stringify({source:download.url,scoring:'HALF',capturedAt:new Date().toISOString(),rows:result.rows,rejectedCount:result.rejected.length},null,2)+'\n');
 console.log('NFL ACTUALS: '+result.rows.length+' completed player-week records; '+result.rejected.length+' excluded; private file '+output);
 console.log('CAUTION: points calculated from nflverse using existing league scoring; cross-provider player identity matching is still required.');
}catch(error){console.error('NFL ACTUALS: FAIL; '+error.message);process.exitCode=1;}
