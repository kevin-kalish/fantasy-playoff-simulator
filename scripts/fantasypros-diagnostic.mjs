import {FantasyProsClient,normalizeFantasyProsProjections,inspectFantasyProsResponse} from '../src/data/fantasypros.js';
const key=process.env.FANTASYPROS_API_KEY;if(!key){console.error('FANTASYPROS_API_KEY is not set');process.exit(2)}
const season=Number(process.argv[2]||2025),week=Number(process.argv[3]||1),client=new FantasyProsClient({apiKey:key});
try{
 const players=await client.players();console.log('players:',JSON.stringify({reported:Number(players.count||0),returned:(players.players||[]).length,season:players.season,week:players.week}));
 const payload=await client.projections({season,week,scoring:'HALF'}),inspection=inspectFantasyProsResponse(payload),rows=normalizeFantasyProsProjections(payload,{season,week});console.log('projections:',JSON.stringify(inspection));console.log('normalized:',JSON.stringify({rows:rows.length,positions:[...new Set(rows.map(r=>r.position))].sort(),sample:rows.slice(0,3).map(r=>({id:r.playerId,name:r.name,position:r.position,team:r.nflTeam,projection:r.projection,statFields:Object.keys(r.projectionStats)}))},null,2));
}catch(e){console.error(e.message);process.exit(1)}
