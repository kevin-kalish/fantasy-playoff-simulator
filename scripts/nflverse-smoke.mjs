import {loadNflverseSeason} from '../src/data/nflverse-loader.js';
const season=Number(process.argv[2]||2025);
const data=await loadNflverseSeason(season,{includeDST:true});
if(data.players.length<100)throw new Error(`unexpectedly low player row count: ${data.players.length}`);
if(data.dst.length<20)throw new Error(`unexpectedly low DST row count: ${data.dst.length}`);
const positions=Object.fromEntries([...new Set(data.players.map(x=>x.position))].sort().map(p=>[p,data.players.filter(x=>x.position===p).length]));
const sample=data.players.find(x=>x.position==='QB'&&x.actual>0)||data.players[0];
console.log(JSON.stringify({season,playerRows:data.players.length,dstRows:data.dst.length,totalRows:data.rows.length,positions,sample,provenance:data.provenance},null,2));
