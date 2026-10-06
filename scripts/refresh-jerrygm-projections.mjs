import fs from 'node:fs';
import path from 'node:path';
import {JerryGMClient,normalizeJerryGMProjections,normalizeJerryGMSeasonProjections} from '../src/data/jerrygm.js';
import {mergeProjectionCache,writeProjectionCache} from '../src/data/projection-cache.js';

const args=process.argv.slice(2);
const value=name=>{const i=args.indexOf(`--${name}`);return i>=0?args[i+1]:undefined};
const season=Number(value('season'));
const weeks=String(value('weeks')??'').split(',').map(Number).filter(Number.isInteger);
const scoring=value('scoring')??'HALF';
const weeklyPath=process.env.PROJECTION_CACHE_PATH??'data/private/projection-cache.json';
const seasonPath=process.env.JERRYGM_SEASON_CACHE_PATH??`data/private/jerrygm-season-${season}.json`;
if(!process.env.JERRYGM_API_KEY){console.error('PROJECTION REFRESH: FAIL; JERRYGM_API_KEY is required.');process.exit(2)}
if(!Number.isInteger(season)||!weeks.length){console.error('Usage: npm run projections:refresh -- --season 2026 --weeks 5,6,7');process.exit(2)}
const uniqueWeeks=[...new Set(weeks)].sort((a,b)=>a-b),client=new JerryGMClient({apiKey:process.env.JERRYGM_API_KEY});
let calls=0,weeklyRows=[];
try{
 for(const week of uniqueWeeks){const payload=await client.projections({season,week,scoring});calls++;const rows=normalizeJerryGMProjections(payload,{season,week});if(!rows.length)throw new Error(`Week ${week} returned no usable projections.`);weeklyRows.push(...rows);console.error(`JERRYGM REFRESH: W${week} ${rows.length} rows; API calls ${calls}.`);}
 const seasonPayload=await client.seasonProjections({season,scoring});calls++;const seasonRows=normalizeJerryGMSeasonProjections(seasonPayload,{season});if(!seasonRows.length)throw new Error('Season board returned no usable projections.');
 let existing=[];if(fs.existsSync(weeklyPath)){try{const raw=JSON.parse(fs.readFileSync(weeklyPath,'utf8'));existing=Array.isArray(raw)?raw:(raw.rows??raw.projections??[]);}catch{}}
 writeProjectionCache(weeklyPath,mergeProjectionCache(existing,weeklyRows),{source:'jerrygm'});
 fs.mkdirSync(path.dirname(seasonPath),{recursive:true});fs.writeFileSync(seasonPath,JSON.stringify(seasonPayload,null,2)+'\n');
 const coverage=uniqueWeeks.map(week=>({week,rows:weeklyRows.filter(r=>r.week===week).length}));
 console.error(`JERRYGM REFRESH: season baseline ${seasonRows.length} rows; API calls ${calls}.`);
 console.log(JSON.stringify({ok:true,season,weeks:coverage,seasonRows:seasonRows.length,weeklyCache:weeklyPath,seasonCache:seasonPath,apiCalls:calls},null,2));
}catch(error){console.error(`PROJECTION REFRESH: FAIL after ${calls} API call(s); ${error.message}`);process.exit(2)}
