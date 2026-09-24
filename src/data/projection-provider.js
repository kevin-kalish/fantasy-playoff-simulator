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
