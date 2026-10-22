import fs from 'node:fs';
import {fetchNflverseSchedule} from '../src/data/nfl-schedule-source.js';
import {compareKickoffSchedules} from '../src/data/kickoff-schedule-comparison.js';
import {writeKickoffVerificationEvidence} from '../src/data/kickoff-verification-evidence.js';
const season=Number(process.argv[2]??2026),week=Number(process.argv[3]??6),file=process.argv[4]??'data/private/nfl-kickoffs.csv';
try{
 if(!fs.existsSync(file))throw new Error('Local kickoff CSV missing: '+file);
 const reference=await fetchNflverseSchedule(season);
 const result=compareKickoffSchedules(fs.readFileSync(file,'utf8'),reference.rows,{season,week});
 console.log(JSON.stringify({...result,referenceSource:reference.source,localFile:file,localFileUnchanged:true},null,2));
 if(result.match){const evidence=writeKickoffVerificationEvidence({file,season,week,referenceSource:reference.source,comparison:result});console.log('SCHEDULE VERIFY: evidence saved '+evidence.verifiedAt+'; SHA256 '+evidence.localSha256.slice(0,12));}
 else process.exitCode=2;
}catch(error){console.error('SCHEDULE VERIFY: FAIL; '+error.message);process.exitCode=1;}
