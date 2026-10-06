import fs from 'node:fs';
import path from 'node:path';
import {JerryGMClient,normalizeJerryGMProjections,normalizeJerryGMSeasonProjections} from '../src/data/jerrygm.js';
import {mergeProjectionCache,writeProjectionCache} from '../src/data/projection-cache.js';

const args=process.argv.slice(2),value=name=>{const i=args.indexOf(`--${name}`);return i>=0?args[i+1]:undefined};
const season=Number(value('season')),weeks=String(value('weeks')??'').split(',').map(Number).filter(Number.isInteger),scoring=value('scoring')??'HALF';
const snapshotPath=value('snapshot')??'data/private/fightin-kali-current.json',weeklyPath=process.env.PROJECTION_CACHE_PATH??'data/private/projection-cache.json',seasonPath=process.env.JERRYGM_SEASON_CACHE_PATH??`data/private/jerrygm-season-${season}.json`;
const maxCalls=Number(value('max-calls')??process.env.JERRYGM_REFRESH_MAX_CALLS??25),batchSize=25;
if(!process.env.JERRYGM_API_KEY){console.error('PROJECTION REFRESH: FAIL; JERRYGM_API_KEY is required.');process.exit(2)}
if(!Number.isInteger(season)||!weeks.length){console.error('Usage: npm run projections:refresh -- --season 2026 --weeks 5,6,7 [--snapshot data/private/fightin-kali-current.json] [--max-calls 25]');process.exit(2)}
if(!Number.isInteger(maxCalls)||maxCalls<1){console.error('PROJECTION REFRESH: FAIL; --max-calls must be a positive integer.');process.exit(2)}
const canon=s=>String(s??'').replace(/[’‘]/g,"'").trim().toLowerCase(),rows=x=>Array.isArray(x)?x:Array.isArray(x?.players)?x.players:Array.isArray(x?.projections)?x.projections:[];
const targetNames=fs.existsSync(snapshotPath)?[...new Set((JSON.parse(fs.readFileSync(snapshotPath,'utf8')).teams??[]).flatMap(t=>t.roster??t.lineup??[]).map(p=>String(p?.name??'').trim()).filter(Boolean))]:[];
const missing=(names,projectionRows)=>{const have=new Set(projectionRows.map(r=>canon(r.name??r.player??r.player_name)));return names.filter(n=>!have.has(canon(n)))};
const uniqueWeeks=[...new Set(weeks)].sort((a,b)=>a-b),client=new JerryGMClient({apiKey:process.env.JERRYGM_API_KEY});
let calls=0,weeklyRows=[],seasonPayload=null,seasonRows=[];
const ensureBudget=n=>{if(calls+n>maxCalls)throw new Error(`Call budget would be exceeded: ${calls} used + ${n} required > ${maxCalls} max.`)};
const fetchTargeted=async({week,names})=>{const out=[];for(let i=0;i<names.length;i+=batchSize){ensureBudget(1);const batch=names.slice(i,i+batchSize),payload=await client.projections({season,week,scoring,names:batch});calls++;out.push(...(week?normalizeJerryGMProjections(payload,{season,week}):normalizeJerryGMSeasonProjections(payload,{season})));}return out};
try{
 for(const week of uniqueWeeks){ensureBudget(1);const payload=await client.projections({season,week,scoring});calls++;let wr=normalizeJerryGMProjections(payload,{season,week});const miss=missing(targetNames,wr),extra=Math.ceil(miss.length/batchSize);console.error(`JERRYGM REFRESH: W${week} board ${wr.length} rows; ${miss.length} roster misses require ${extra} targeted call(s); API calls ${calls}.`);ensureBudget(extra);wr=mergeProjectionCache(wr,await fetchTargeted({week,names:miss}));weeklyRows.push(...wr);console.error(`JERRYGM REFRESH: W${week} merged ${wr.length} rows; remaining roster misses ${missing(targetNames,wr).length}; API calls ${calls}.`);}
 ensureBudget(1);seasonPayload=await client.seasonProjections({season,scoring});calls++;seasonRows=normalizeJerryGMSeasonProjections(seasonPayload,{season});let seasonMiss=missing(targetNames,seasonRows),extra=Math.ceil(seasonMiss.length/batchSize);console.error(`JERRYGM REFRESH: season board ${seasonRows.length} rows; ${seasonMiss.length} roster misses require ${extra} targeted call(s); API calls ${calls}.`);ensureBudget(extra);seasonRows=[...seasonRows,...await fetchTargeted({names:seasonMiss})];seasonMiss=missing(targetNames,seasonRows);
 let existing=[];if(fs.existsSync(weeklyPath)){try{const raw=JSON.parse(fs.readFileSync(weeklyPath,'utf8'));existing=Array.isArray(raw)?raw:(raw.rows??raw.projections??[]);}catch{}}
 writeProjectionCache(weeklyPath,mergeProjectionCache(existing,weeklyRows),{source:'jerrygm'});
 fs.mkdirSync(path.dirname(seasonPath),{recursive:true});fs.writeFileSync(seasonPath,JSON.stringify({season,players:seasonRows,source:'jerrygm-merged-cache'},null,2)+'\n');
 const coverage=uniqueWeeks.map(week=>{const wr=weeklyRows.filter(r=>r.week===week);return{week,rows:wr.length,rosterMisses:missing(targetNames,wr).length}});
 console.error(`JERRYGM REFRESH: season merged ${seasonRows.length} rows; remaining roster misses ${seasonMiss.length}; API calls ${calls}.`);
 console.log(JSON.stringify({ok:true,season,weeks:coverage,seasonRows:seasonRows.length,seasonRosterMisses:seasonMiss.length,targetRosterPlayers:targetNames.length,weeklyCache:weeklyPath,seasonCache:seasonPath,apiCalls:calls,maxCalls},null,2));
}catch(error){console.error(`PROJECTION REFRESH: FAIL after ${calls} API call(s); ${error.message}`);process.exit(2)}
