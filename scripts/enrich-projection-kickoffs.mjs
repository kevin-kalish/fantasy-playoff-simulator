import fs from 'node:fs';
import path from 'node:path';
import {readArchiveDirectory} from '../src/data/historical-projection-importer.js';
import {parseKickoffScheduleCSV,enrichProjectionArchiveWithKickoffs} from '../src/data/projection-kickoff-enrichment.js';
const [scheduleFile='data/private/nfl-kickoffs.csv',input='data/private/projection-archives',output='data/private/projection-archives-enriched']=process.argv.slice(2);
try{
 if(!fs.existsSync(scheduleFile))throw new Error('Missing independently verified kickoff schedule CSV: '+scheduleFile);
 const schedules=parseKickoffScheduleCSV(fs.readFileSync(scheduleFile,'utf8'));
 if(!schedules.length)throw new Error('Kickoff schedule CSV has no rows');
 const archives=readArchiveDirectory(input);
 if(!archives.length)throw new Error('No immutable projection archives in '+input);
 fs.mkdirSync(output,{recursive:true});
 let eligible=0,matched=0;
 for(const entry of archives){
  const {archive,stats}=enrichProjectionArchiveWithKickoffs(entry.data,schedules);
  const target=path.join(output,path.basename(entry.path));
  fs.writeFileSync(target,JSON.stringify(archive,null,2)+'\n',{flag:'wx'});
  eligible+=stats.eligiblePregame;matched+=stats.matched;
  console.log(path.basename(target)+': '+stats.eligiblePregame+' pregame, '+stats.postKickoff+' post-kickoff, '+stats.missing+' missing, '+stats.conflicted+' conflicts');
 }
 console.log('KICKOFF ENRICHMENT: '+archives.length+' archives; '+matched+' matches; '+eligible+' potentially eligible pregame forecasts.');
 console.log('Derived copies only; original archives unchanged. Player actuals and ID crosswalk remain necessary.');
}catch(error){console.error('KICKOFF ENRICHMENT: FAIL; '+error.message);process.exitCode=1;}
