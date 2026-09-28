import fs from 'node:fs';
import {FantasyProsClient,normalizeFantasyProsProjections} from './fantasypros.js';
import {createProjectionProvider,loadProjectionRows,projectionProviderTrust} from './projection-provider.js';

const readRows=path=>{const raw=JSON.parse(fs.readFileSync(path,'utf8'));return Array.isArray(raw)?raw:(raw.rows||raw.projections||[])};
const sameWeek=(row,{season,week})=>Number(row?.season??row?.year)===Number(season)&&Number(row?.week??row?.wk)===Number(week);
export function buildWeeklyProjectionProviders({apiKey=process.env.FANTASYPROS_API_KEY,fixturePath=null,fetchImpl=globalThis.fetch}={}){
 const providers=[];
 if(apiKey)providers.push(createProjectionProvider({name:'fantasypros',priority:100,load:async({season,week,scoring='HALF'})=>normalizeFantasyProsProjections(await new FantasyProsClient({apiKey,fetchImpl}).projections({season,week,scoring}),{season,week})}));
 if(fixturePath)providers.push(createProjectionProvider({name:'fixture',priority:10,load:async context=>readRows(fixturePath).filter(row=>sameWeek(row,context))}));
 return providers;
}
export async function loadWeeklyProjections({season,week,scoring='HALF',minimumRows=1,apiKey=process.env.FANTASYPROS_API_KEY,fixturePath=null,fetchImpl=globalThis.fetch}={}){
 const providers=buildWeeklyProjectionProviders({apiKey,fixturePath,fetchImpl});
 if(!providers.length)throw new Error('No weekly projection providers configured. Set FANTASYPROS_API_KEY or provide fixturePath.');
 const result=await loadProjectionRows(providers,{season,week,scoring},{minimumRows});
 return {...result,trust:projectionProviderTrust(result,{minimumRows})};
}
export async function loadWeeklyProjectionHorizon({season,weeks,week,scoring='HALF',minimumRows=1,apiKey=process.env.FANTASYPROS_API_KEY,fixturePath=null,fetchImpl=globalThis.fetch}={}){
 const targetWeeks=[...new Set((weeks?.length?weeks:[week]).map(Number).filter(Number.isInteger))].sort((a,b)=>a-b);
 if(!targetWeeks.length)throw new Error('At least one projection week is required.');
 const results=[];
 for(const targetWeek of targetWeeks)results.push(await loadWeeklyProjections({season,week:targetWeek,scoring,minimumRows,apiKey,fixturePath,fetchImpl}));
 const rows=results.flatMap(result=>result.rows);
 const providers=[...new Set(results.map(result=>result.provider))];
 const attempts=results.flatMap((result,index)=>result.attempts.map(attempt=>({...attempt,week:targetWeeks[index]})));
 const degraded=results.some(result=>result.degraded)||providers.length>1;
 const provider=providers.length===1?providers[0]:'mixed';
 const trust={ready:results.every(result=>result.trust.ready),provider,rows:rows.length,degraded,fallbacksUsed:results.reduce((sum,result)=>sum+result.trust.fallbacksUsed,0),attempts,weeks:targetWeeks,weekResults:results.map((result,index)=>({week:targetWeeks[index],provider:result.provider,rows:result.rows.length,degraded:result.degraded}))};
 return {provider,rows,attempts,degraded,trust,weeks:targetWeeks};
}
