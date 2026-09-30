import {yahooCollection,yahooPlayer,yahooProperties} from './yahoo-normalize.js';

const props=node=>yahooProperties(node);
const pid=p=>String(p?.id??p?.playerId??'');
const pos=p=>String(p?.position??p?.displayPosition??'').toUpperCase();
const proj=p=>Number(p?.projection??p?.projectedPoints??0)||0;
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
 return players.filter(p=>{const id=pid(p);if(!id||seen.has(id))return false;seen.add(id);return true}).slice(0,max);
}

export function candidateDropPlayerIds(team,{includeStarters=false,limit=8}={}){
 const roster=team?.roster??[],bench=new Set(['BN','IR','IL','NA']);
 return roster.filter(p=>includeStarters||bench.has(String(p.lineupSlot??p.slot??'').toUpperCase())).slice().sort((a,b)=>proj(a)-proj(b)).slice(0,Math.max(1,Number(limit)||8)).map(pid).filter(Boolean);
}

// Cheap first-pass pruning before expensive Monte Carlo add/drop evaluation.  We retain
// the strongest candidates overall plus candidates at thin roster positions, and pair
// each with the weakest compatible bench drops plus a few weakest drops overall.
export function prescreenWaiverScenarios(team,candidates,{candidateLimit=12,dropsPerCandidate=3,overallDropLimit=3}={}){
 const roster=team?.roster??[],benchSlots=new Set(['BN','IR','IL','NA']);
 const bench=roster.filter(p=>benchSlots.has(String(p.lineupSlot??p.slot??'').toUpperCase()));
 const positionCounts=roster.reduce((m,p)=>(m.set(pos(p),(m.get(pos(p))??0)+1),m),new Map());
 const weakest=[...bench].sort((a,b)=>proj(a)-proj(b));
 const score=c=>proj(c)+(positionCounts.get(pos(c))<=1?4:positionCounts.get(pos(c))===2?2:0);
 const screened=[...candidates].filter(c=>pid(c)).sort((a,b)=>score(b)-score(a)||proj(b)-proj(a)||String(a.name??pid(a)).localeCompare(String(b.name??pid(b)))).slice(0,Math.max(1,Number(candidateLimit)||12));
 const dropMap={};
 for(const c of screened){
  const same=weakest.filter(p=>pos(p)&&pos(p)===pos(c));
  const pool=[...same.slice(0,Math.max(1,Number(dropsPerCandidate)||3)),...weakest.slice(0,Math.max(1,Number(overallDropLimit)||3))];
  const seen=new Set();dropMap[pid(c)]=pool.map(pid).filter(id=>id&&!seen.has(id)&&seen.add(id));
 }
 return {candidates:screened,dropMap,totalCandidates:candidates.length,screenedCandidates:screened.length,benchPlayers:bench.length};
}
