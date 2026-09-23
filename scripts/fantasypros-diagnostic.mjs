import {FantasyProsClient,normalizeFantasyProsProjections,inspectFantasyProsResponse} from '../src/data/fantasypros.js';
const key=process.env.FANTASYPROS_API_KEY;if(!key){console.error('FANTASYPROS_API_KEY is not set');process.exit(2)}
const season=Number(process.argv[2]||2025),week=Number(process.argv[3]||1),client=new FantasyProsClient({apiKey:key});
const base='https://api.fantasypros.com/public/v2/json',results=[];
function safeHeaders(headers){const keep=['content-type','content-length','date','server','via','x-cache','x-request-id','x-amzn-requestid','x-amz-apigw-id'];return Object.fromEntries(keep.map(k=>[k,headers.get(k)]).filter(([,v])=>v));}
async function rawProbe(name,url){
 try{const r=await fetch(url,{headers:{'x-api-key':key,'accept':'application/json'}}),text=await r.text();let body;try{body=JSON.parse(text)}catch{body=text.slice(0,500)}const details={ok:r.ok,status:r.status,statusText:r.statusText,headers:safeHeaders(r.headers),body:r.ok?(typeof body==='object'?{topLevelKeys:Object.keys(body||{}),count:body?.count??null}:String(body).slice(0,200)):(typeof body==='object'?body:String(body).slice(0,500))};results.push({name,...details});console.log(`${name}:`,JSON.stringify(details,null,2));return{response:r,body};}
 catch(e){const details={ok:false,status:null,error:String(e?.message||e)};results.push({name,...details});console.log(`${name}:`,JSON.stringify(details,null,2));return null;}
}
async function clientProbe(name,fn,inspect){try{const payload=await fn(),details={ok:true,...(inspect?inspect(payload):{})};results.push({name,...details});console.log(`${name}:`,JSON.stringify(details,null,2));}catch(e){const m=String(e?.message||e),status=Number((m.match(/FantasyPros (\d{3})/)||[])[1]||0)||null,details={ok:false,status,error:m.replace(/^FantasyPros \d{3}:\s*/,'').slice(0,500)};results.push({name,...details});console.log(`${name}:`,JSON.stringify(details,null,2));}}
console.log('FantasyPros diagnostic: API key present; value intentionally hidden.');
// Exact requests based on the supplied FantasyPros v2 OpenAPI examples.
await rawProbe('documented-players-example',`${base}/nfl/players?ecr=included&show=pos_rank`);
await rawProbe('documented-projections-example',`${base}/nfl/2025/projections?position=RB&week=4`);
await rawProbe('documented-player-points-example',`${base}/nfl/2024/player-points?position=QB&scoring=PPR`);
await rawProbe('documented-injuries-example',`${base}/nfl/injuries?year=2025&week=1`);
// Then test our client implementation independently.
await clientProbe('client-players',()=>client.players(),p=>({reported:Number(p.count||0),returned:(p.players||[]).length}));
await clientProbe(`client-historical-${season}-week-${week}`,()=>client.projections({season,week,scoring:'HALF'}),p=>{const inspection=inspectFantasyProsResponse(p),rows=normalizeFantasyProsProjections(p,{season,week});return{...inspection,normalizedRows:rows.length,normalizedPositions:[...new Set(rows.map(r=>r.position))].sort()}});
const successful=results.filter(r=>r.ok).length,statuses=Object.fromEntries([...new Set(results.map(r=>r.status).filter(Boolean))].map(s=>[s,results.filter(r=>r.status===s).length]));
console.log('summary:',JSON.stringify({season,week,successful,total:results.length,statuses,interpretation:successful===0&&statuses[403]===results.length?'All exact documented and client requests returned 403; request format matches the supplied OpenAPI examples, so key activation/account permission is the leading diagnosis.':'At least one request behaved differently; inspect per-endpoint results above.'},null,2));
process.exit(0);
