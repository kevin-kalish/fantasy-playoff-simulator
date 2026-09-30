import {yahooCollection,yahooPlayer,yahooProperties} from './yahoo-normalize.js';

const props=node=>yahooProperties(node);
function findObject(node,key){
 if(!node||typeof node!=='object')return null;
 if(Array.isArray(node)){for(const x of node){const r=findObject(x,key);if(r)return r}return null}
 if(node[key])return Array.isArray(node[key])?props(node[key]):node[key];
 for(const x of Object.values(node)){const r=findObject(x,key);if(r)return r}
 return null;
}
function playersFrom(json){
 const league=findObject(json?.fantasy_content,'league');
 return yahooCollection(league?.players,'player').map(p=>yahooPlayer(Object.entries(p).map(([k,v])=>({[k]:v}))));
}

export async function loadYahooWaiverPool(get,{leagueKey,limit=30,status='A',sort='AR'}={}){
 if(!leagueKey)throw new Error('Yahoo leagueKey is required.');
 const max=Math.max(1,Number(limit)||30),pageSize=Math.min(25,max),players=[];
 for(let start=0;start<max;start+=pageSize){
  const count=Math.min(pageSize,max-start);
  const json=await get(`league/${leagueKey}/players;status=${status};sort=${sort};start=${start};count=${count}`);
  const rows=playersFrom(json);
  players.push(...rows);
  if(rows.length<count)break;
 }
 const seen=new Set();
 return players.filter(p=>{const id=String(p.id??p.playerId??'');if(!id||seen.has(id))return false;seen.add(id);return true}).slice(0,max);
}

export function candidateDropPlayerIds(team,{includeStarters=false,limit=8}={}){
 const roster=team?.roster??[],bench=new Set(['BN','IR','IL','NA']);
 return roster.filter(p=>includeStarters||bench.has(String(p.lineupSlot??p.slot??'').toUpperCase())).slice().sort((a,b)=>Number(a.projection??a.projectedPoints??0)-Number(b.projection??b.projectedPoints??0)).slice(0,Math.max(1,Number(limit)||8)).map(p=>String(p.id??p.playerId??'')).filter(Boolean);
}
