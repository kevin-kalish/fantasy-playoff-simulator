const BASE_URL='https://api.jerrygm.com/api/ext/v1';
const scoringName=value=>{const s=String(value||'HALF').toLowerCase();return s==='ppr'?'ppr':s==='standard'||s==='std'?'standard':'half'};
const rowsFrom=value=>Array.isArray(value)?value:Array.isArray(value?.players)?value.players:Array.isArray(value?.projections)?value.projections:[];
const numberOrNull=value=>{const n=Number(value);return Number.isFinite(n)?n:null};
const cleanPosition=value=>{const p=String(value||'').trim().toUpperCase();return p==='D/ST'?'DST':p};
const POSITIONS=new Set(['QB','RB','WR','TE','K','DST','DEF']);
const chunks=(values,size)=>{const out=[];for(let i=0;i<values.length;i+=size)out.push(values.slice(i,i+size));return out};

export function normalizeJerryGMProjections(payload,{season,week}={}){
 const resolvedSeason=numberOrNull(payload?.season??season);
 const resolvedWeek=numberOrNull(payload?.week??week);
 return rowsFrom(payload).map(row=>{
  const position=cleanPosition(row.position??row.pos??row.position_id);
  const projection=numberOrNull(row.projectedPoints??row.projection??row.projectedPPG??row.projected_points??row.points);
  const rowSeason=numberOrNull(row.season??row.year)??resolvedSeason;
  const rowWeek=numberOrNull(row.week??row.wk)??resolvedWeek;
  if(!rowSeason||!rowWeek||!POSITIONS.has(position)||projection==null)return null;
  const ids=row.ids??{};
  return{season:rowSeason,week:rowWeek,playerId:String(row.playerId??row.player_id??row.id??ids.gsis??ids.yahoo??'').trim(),yahooId:String(row.yahooId??ids.yahoo??'').trim(),name:String(row.name??row.player??row.player_name??'').trim(),position,nflTeam:String(row.nflTeam??row.team??row.team_id??'').trim().toUpperCase(),projection,source:'jerrygm'};
 }).filter(Boolean);
}

export function normalizeJerryGMSeasonProjections(payload,{season}={}){
 const resolvedSeason=numberOrNull(payload?.season??season);
 return rowsFrom(payload).map(row=>{
  const position=cleanPosition(row.position??row.pos??row.position_id);
  const projection=numberOrNull(row.projectedPPG??row.projectedPoints??row.projection??row.projected_points??row.points);
  if(!resolvedSeason||!POSITIONS.has(position)||projection==null)return null;
  const ids=row.ids??{};
  return{season:resolvedSeason,playerId:String(row.playerId??row.player_id??row.id??ids.gsis??ids.yahoo??'').trim(),yahooId:String(row.yahooId??ids.yahoo??'').trim(),name:String(row.name??row.player??row.player_name??'').trim(),position,nflTeam:String(row.nflTeam??row.team??row.team_id??'').trim().toUpperCase(),projection,seasonTotal:numberOrNull(row.seasonTotal??row.season_total),source:'jerrygm-season'};
 }).filter(Boolean);
}

export class JerryGMClient{
 constructor({apiKey,fetchImpl=globalThis.fetch,baseUrl=BASE_URL}={}){if(!apiKey)throw new Error('JerryGM API key required.');this.apiKey=apiKey;this.fetch=fetchImpl;this.baseUrl=baseUrl;}
 async request({season,week,scoring='HALF',names=[]}={}){
  const url=new URL(`${this.baseUrl}/projections`);url.searchParams.set('season',String(season));if(Number.isInteger(Number(week)))url.searchParams.set('week',String(week));url.searchParams.set('scoring',scoringName(scoring));
  if(names.length)url.searchParams.set('names',names.join(','));
  const response=await this.fetch(url,{headers:{'x-api-key':this.apiKey,'authorization':`Bearer ${this.apiKey}`,'accept':'application/json'}});
  const text=await response.text();if(!response.ok)throw new Error(`JerryGM ${response.status}: ${text.slice(0,300)}`);
  try{return JSON.parse(text);}catch{throw new Error('JerryGM returned invalid JSON.');}
 }
 async projections({season,week,scoring='HALF',names=[]}={}){
  const requested=[...new Set((names||[]).map(x=>String(x||'').trim()).filter(Boolean))];
  if(!requested.length)return this.request({season,week,scoring});
  const payloads=[];
  for(const batch of chunks(requested,25))payloads.push(await this.request({season,week,scoring,names:batch}));
  return{season,week,scoring:scoringName(scoring),players:payloads.flatMap(rowsFrom),targeted:true,batches:payloads.length};
 }
 async seasonProjections({season,scoring='HALF',names=[]}={}){return this.projections({season,scoring,names});}
}
