import {FantasyProsClient,normalizeFantasyProsProjections} from './fantasypros.js';
import {joinProjectionActuals} from './join.js';

const POSITIONS=['QB','RB','WR','TE','K','DST'];
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
export async function fetchFantasyProsHistory({apiKey,seasons,weeks=Array.from({length:18},(_,i)=>i+1),scoring='HALF',positions=POSITIONS,fetchImpl=globalThis.fetch,delayMs=125,onProgress}={}){
 const client=new FantasyProsClient({apiKey,fetchImpl}),rows=[],failures=[];
 for(const season of seasons)for(const week of weeks){try{const payload=await client.projections({season,week,positions:positions.join(':'),scoring});const normalized=normalizeFantasyProsProjections(payload,{season,week}).filter(r=>Number.isFinite(r.projection)&&r.projection>0);rows.push(...normalized);onProgress?.({season,week,rows:normalized.length,total:rows.length});}catch(error){failures.push({season,week,error:String(error?.message||error)});onProgress?.({season,week,error:String(error?.message||error),total:rows.length});}if(delayMs)await sleep(delayMs)}
 return{rows,failures,summary:{source:'fantasypros',seasons:[...seasons],weeks:[...weeks],scoring,positions:[...positions],rows:rows.length,failures:failures.length}};
}
export function joinHistoricalProjectionActuals(projections,actuals,{allowDST=false}={}){const p=allowDST?projections:projections.filter(r=>r.position!=='DST'&&r.position!=='DEF'),a=allowDST?actuals:actuals.filter(r=>r.position!=='DST'&&r.position!=='DEF');const joined=joinProjectionActuals(p,a),rec=joined.reconciliation;return{...joined,summary:{projectionRows:p.length,actualRows:a.length,matched:joined.rows.length,ambiguous:rec.ambiguous?.length||0,unmatchedProjections:rec.unmatched?.length||0,matchRate:rec.summary?.matchRate??(p.length?joined.rows.length/p.length:0)}};}
export function projectionCoverage(rows){const by={};for(const r of rows){const k=`${r.season}:${r.week}:${r.position}`;by[k]=(by[k]||0)+1}return Object.entries(by).map(([key,n])=>{const [season,week,position]=key.split(':');return{season:Number(season),week:Number(week),position,n}}).sort((a,b)=>a.season-b.season||a.week-b.week||a.position.localeCompare(b.position));}
