import {FantasyProsClient,normalizeFantasyProsProjections,inspectFantasyProsResponse} from '../src/data/fantasypros.js';
const key=process.env.FANTASYPROS_API_KEY;if(!key){console.error('FANTASYPROS_API_KEY is not set');process.exit(2)}
const season=Number(process.argv[2]||2025),week=Number(process.argv[3]||1),client=new FantasyProsClient({apiKey:key});
const results=[];
async function probe(name,fn,inspect){
 try{const payload=await fn(),details=inspect?inspect(payload):{};results.push({name,ok:true,...details});console.log(`${name}:`,JSON.stringify({ok:true,...details},null,2));}
 catch(e){const m=String(e?.message||e),status=Number((m.match(/FantasyPros (\d{3})/)||[])[1]||0)||null,body=m.replace(/^FantasyPros \d{3}:\s*/, '').slice(0,500);results.push({name,ok:false,status,error:body});console.log(`${name}:`,JSON.stringify({ok:false,status,error:body},null,2));}
}
await probe('players',()=>client.players(),p=>({reported:Number(p.count||0),returned:(p.players||[]).length}));
await probe('current-season-projections',()=>client.projections({season:2026,week:4,scoring:'HALF'}),p=>inspectFantasyProsResponse(p));
await probe(`historical-${season}-week-${week}`,()=>client.projections({season,week,scoring:'HALF'}),p=>{const inspection=inspectFantasyProsResponse(p),rows=normalizeFantasyProsProjections(p,{season,week});return{...inspection,normalizedRows:rows.length,normalizedPositions:[...new Set(rows.map(r=>r.position))].sort(),sample:rows.slice(0,3).map(r=>({id:r.playerId,name:r.name,position:r.position,team:r.nflTeam,projection:r.projection,statFields:Object.keys(r.projectionStats)}))}});
await probe(`player-points-${season}`,()=>client.playerPoints({season,start:week,end:week,position:'ALL',scoring:'HALF'}),p=>({reported:Number(p.count||0),returned:(p.players||p.player||[]).length,topLevelKeys:Object.keys(p||{}).sort()}));
const ok=results.filter(r=>r.ok).length;console.log('summary:',JSON.stringify({season,week,successful:ok,total:results.length,results:results.map(({name,ok,status})=>({name,ok,status:status||null}))},null,2));
// Diagnostic succeeds if it completed all probes, even when FantasyPros denies some endpoints.
process.exit(0);
