import fs from 'node:fs';
import path from 'node:path';
import {fetchNflverseSchedule} from '../src/data/nfl-schedule-source.js';
const season=Number(process.argv[2]??2026),out=process.argv[3]??'data/private/nfl-kickoffs.csv';
const q=value=>'"'+String(value??'').replace(/"/g,'""')+'"';
try{
 if(!Number.isInteger(season)||season<1999)throw new Error('Invalid NFL season');
 const result=await fetchNflverseSchedule(season);
 if(!path.resolve(out).startsWith(path.resolve('data/private')+path.sep))throw new Error('Schedule output must be under data/private');
 fs.mkdirSync(path.dirname(out),{recursive:true});
 const cols=['season','week','home_team','away_team','kickoffAt','gameId'];
 fs.writeFileSync(out,[cols.join(','),...result.rows.map(r=>cols.map(c=>q(r[c])).join(','))].join('\n')+'\n');
 console.log('NFL KICKOFFS: '+result.rows.length+' verified-format regular season games for '+season+'; source '+result.source);
 console.log('PRIVATE SCHEDULE: '+out);
}catch(error){console.error('NFL KICKOFFS: FAIL; '+error.message);process.exitCode=1;}
