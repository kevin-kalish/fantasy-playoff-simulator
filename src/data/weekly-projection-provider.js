import fs from 'node:fs';
import {FantasyProsClient,normalizeFantasyProsProjections} from './fantasypros.js';
import {createProjectionProvider,loadProjectionRows,projectionProviderTrust} from './projection-provider.js';

const readRows=path=>{const raw=JSON.parse(fs.readFileSync(path,'utf8'));return Array.isArray(raw)?raw:(raw.rows||raw.projections||[])};
export function buildWeeklyProjectionProviders({apiKey=process.env.FANTASYPROS_API_KEY,fixturePath=null,fetchImpl=globalThis.fetch}={}){
 const providers=[];
 if(apiKey)providers.push(createProjectionProvider({name:'fantasypros',priority:100,load:async({season,week,scoring='HALF'})=>normalizeFantasyProsProjections(await new FantasyProsClient({apiKey,fetchImpl}).projections({season,week,scoring}),{season,week})}));
 if(fixturePath)providers.push(createProjectionProvider({name:'fixture',priority:10,load:async()=>readRows(fixturePath)}));
 return providers;
}
export async function loadWeeklyProjections({season,week,scoring='HALF',minimumRows=1,apiKey=process.env.FANTASYPROS_API_KEY,fixturePath=null,fetchImpl=globalThis.fetch}={}){
 const providers=buildWeeklyProjectionProviders({apiKey,fixturePath,fetchImpl});
 if(!providers.length)throw new Error('No weekly projection providers configured. Set FANTASYPROS_API_KEY or provide fixturePath.');
 const result=await loadProjectionRows(providers,{season,week,scoring},{minimumRows});
 return {...result,trust:projectionProviderTrust(result,{minimumRows})};
}
