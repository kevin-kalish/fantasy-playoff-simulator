import {normalizeProjectionRows} from './projection-provider.js';

const BASE_URL='https://api.jerrygm.com/api/ext/v1';
const scoringName=value=>{const s=String(value||'HALF').toLowerCase();return s==='ppr'?'ppr':s==='standard'||s==='std'?'standard':'half'};
const rowsFrom=value=>Array.isArray(value)?value:Array.isArray(value?.players)?value.players:Array.isArray(value?.projections)?value.projections:[];

export function normalizeJerryGMProjections(payload,{season,week}={}){
 const rows=rowsFrom(payload).map(row=>({...row,projection:row.projection??row.projectedPPG??row.projected_points??row.points}));
 return normalizeProjectionRows(rows,{source:'jerrygm',season:payload?.season??season,week:payload?.week??week});
}

export class JerryGMClient{
 constructor({apiKey,fetchImpl=globalThis.fetch,baseUrl=BASE_URL}={}){if(!apiKey)throw new Error('JerryGM API key required.');this.apiKey=apiKey;this.fetch=fetchImpl;this.baseUrl=baseUrl;}
 async projections({season,week,scoring='HALF'}={}){
  const url=new URL(`${this.baseUrl}/projections`);url.searchParams.set('season',String(season));url.searchParams.set('week',String(week));url.searchParams.set('scoring',scoringName(scoring));
  const response=await this.fetch(url,{headers:{'x-api-key':this.apiKey,'authorization':`Bearer ${this.apiKey}`,'accept':'application/json'}});
  const text=await response.text();if(!response.ok)throw new Error(`JerryGM ${response.status}: ${text.slice(0,300)}`);
  try{return JSON.parse(text);}catch{throw new Error('JerryGM returned invalid JSON.');}
 }
}
