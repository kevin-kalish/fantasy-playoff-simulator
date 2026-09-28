const POSITIONS=new Set(['QB','RB','WR','TE','K','DST','DEF']);
const pick=(r,names)=>{for(const n of names)if(r?.[n]!=null&&r[n]!=='')return r[n];return null};
const num=v=>{const n=Number(v);return Number.isFinite(n)?n:null};
const cleanPos=v=>{const p=String(v||'').toUpperCase().trim();return p==='D/ST'?'DST':p};
export function normalizeProjectionRow(row,{source='generic',season,week}={}){
 const position=cleanPos(pick(row,['position','pos','position_id']));
 const projection=num(pick(row,['projection','projected_points','projectedPoints','fpts','FPTS','points','fantasy_points','fantasyPoints']));
 const s=num(pick(row,['season','year']))??num(season),w=num(pick(row,['week','wk']))??num(week);
 if(!s||!w||!POSITIONS.has(position)||projection==null)return null;
 return{season:s,week:w,playerId:String(pick(row,['playerId','player_id','id','fpid','fantasypros_id'])||'').trim(),name:String(pick(row,['name','player','player_name'])||'').trim(),position,nflTeam:String(pick(row,['nflTeam','team','team_id'])||'').trim().toUpperCase(),projection,source};
}
export function normalizeProjectionRows(rows,opts={}){return rows.map(r=>normalizeProjectionRow(r,opts)).filter(Boolean);}
export function providerAudit(rows,{source='unknown'}={}){const weeks=new Set(rows.map(r=>`${r.season}:${r.week}`)),seasons=[...new Set(rows.map(r=>r.season))].sort(),positions={};for(const r of rows)positions[r.position]=(positions[r.position]||0)+1;return{source,rows:rows.length,seasons,weeks:weeks.size,positions};}

const asRows=value=>Array.isArray(value)?value:Array.isArray(value?.rows)?value.rows:[];
const errText=e=>String(e?.message||e||'unknown error');
export function createProjectionProvider({name,load,priority=0}={}){if(!name||typeof load!=='function')throw new Error('Projection provider requires name and load function.');return{name:String(name),priority:Number(priority)||0,load};}
export async function loadProjectionRows(providers=[],context={}, {minimumRows=1}={}){
 const ordered=[...providers].sort((a,b)=>(b.priority||0)-(a.priority||0)),attempts=[];
 for(const provider of ordered){
  try{const rows=asRows(await provider.load(context));if(rows.length>=minimumRows)return{provider:provider.name,rows,attempts:[...attempts,{provider:provider.name,ok:true,rows:rows.length}],degraded:attempts.length>0};attempts.push({provider:provider.name,ok:false,rows:rows.length,error:`insufficient rows: ${rows.length} < ${minimumRows}`});}
  catch(error){attempts.push({provider:provider.name,ok:false,rows:0,error:errText(error)});}
 }
 const error=new Error(`No usable projection provider. ${attempts.map(x=>`${x.provider}: ${x.error}`).join('; ')}`);error.attempts=attempts;throw error;
}
export function projectionProviderTrust(result,{minimumRows=1}={}){const rows=result?.rows?.length||0,attempts=result?.attempts||[];return{ready:rows>=minimumRows,provider:result?.provider||null,rows,degraded:Boolean(result?.degraded),fallbacksUsed:Math.max(0,attempts.length-1),attempts};}
