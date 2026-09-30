import fs from 'node:fs';
import {FantasyProsClient,normalizeFantasyProsProjections} from './fantasypros.js';
import {JerryGMClient,normalizeJerryGMProjections} from './jerrygm.js';
import {createProjectionProvider,loadProjectionRows,projectionProviderTrust} from './projection-provider.js';

const readRows=path=>{const raw=JSON.parse(fs.readFileSync(path,'utf8'));return Array.isArray(raw)?raw:(raw.rows||raw.projections||[])};
const sameWeek=(row,{season,week})=>Number(row?.season??row?.year)===Number(season)&&Number(row?.week??row?.wk)===Number(week);
const fileProvider=(name,priority,path)=>createProjectionProvider({name,priority,load:async context=>readRows(path).filter(row=>sameWeek(row,context))});
export function buildWeeklyProjectionProviders({apiKey=process.env.FANTASYPROS_API_KEY,jerryGMApiKey=process.env.JERRYGM_API_KEY,fixturePath=null,cachePath=process.env.PROJECTION_CACHE_PATH??'data/private/projection-cache.json',fetchImpl=globalThis.fetch}={}){
 const providers=[];
 if(apiKey)providers.push(createProjectionProvider({name:'fantasypros',priority:100,load:async({season,week,scoring='HALF'})=>normalizeFantasyProsProjections(await new FantasyProsClient({apiKey,fetchImpl}).projections({season,week,scoring}),{season,week})}));
 if(jerryGMApiKey)providers.push(createProjectionProvider({name:'jerrygm',priority:75,load:async({season,week,scoring='HALF',projectionNames=[]})=>normalizeJerryGMProjections(await new JerryGMClient({apiKey:jerryGMApiKey,fetchImpl}).projections({season,week,scoring,names:projectionNames}),{season,week})}));
 if(cachePath&&fs.existsSync(cachePath))providers.push(fileProvider('cache',50,cachePath));
 if(fixturePath)providers.push(fileProvider('fixture',10,fixturePath));
 return providers;
}
export async function loadWeeklyProjections({season,week,scoring='HALF',minimumRows=1,projectionNames=[],apiKey=process.env.FANTASYPROS_API_KEY,jerryGMApiKey=process.env.JERRYGM_API_KEY,fixturePath=null,cachePath=process.env.PROJECTION_CACHE_PATH??'data/private/projection-cache.json',fetchImpl=globalThis.fetch}={}){
 const providers=buildWeeklyProjectionProviders({apiKey,jerryGMApiKey,fixturePath,cachePath,fetchImpl});
 if(!providers.length)throw new Error('No weekly projection providers configured. Set FANTASYPROS_API_KEY or JERRYGM_API_KEY, provide a projection cache, or provide fixturePath.');
 const result=await loadProjectionRows(providers,{season,week,scoring,projectionNames},{minimumRows});
 return {...result,trust:projectionProviderTrust(result,{minimumRows})};
}
export async function loadWeeklyProjectionHorizon({season,weeks,week,scoring='HALF',minimumRows=1,projectionNames=[],apiKey=process.env.FANTASYPROS_API_KEY,jerryGMApiKey=process.env.JERRYGM_API_KEY,fixturePath=null,cachePath=process.env.PROJECTION_CACHE_PATH??'data/private/projection-cache.json',fetchImpl=globalThis.fetch}={}){
 const targetWeeks=[...new Set((weeks?.length?weeks:[week]).map(Number).filter(Number.isInteger))].sort((a,b)=>a-b);
 if(!targetWeeks.length)throw new Error('At least one projection week is required.');
 const results=[];
 for(const targetWeek of targetWeeks)results.push(await loadWeeklyProjections({season,week:targetWeek,scoring,minimumRows,projectionNames,apiKey,jerryGMApiKey,fixturePath,cachePath,fetchImpl}));
 const rows=results.flatMap(result=>result.rows);
 const providers=[...new Set(results.map(result=>result.provider))];
 const attempts=results.flatMap((result,index)=>result.attempts.map(attempt=>({...attempt,week:targetWeeks[index]})));
 const degraded=results.some(result=>result.degraded)||providers.length>1;
 const provider=providers.length===1?providers[0]:'mixed';
 const trust={ready:results.every(result=>result.trust.ready),provider,rows:rows.length,degraded,fallbacksUsed:results.reduce((sum,result)=>sum+result.trust.fallbacksUsed,0),attempts,weeks:targetWeeks,weekResults:results.map((result,index)=>({week:targetWeeks[index],provider:result.provider,rows:result.rows.length,degraded:result.degraded}))};
 return {provider,rows,attempts,degraded,trust,weeks:targetWeeks};
}
