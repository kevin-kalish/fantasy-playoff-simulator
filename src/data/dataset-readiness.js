const POSITIONS=['QB','RB','WR','TE','K'];
const key=(s,w)=>`${s}:${w}`;
export function buildCoverageManifest(rows=[]){
 const seasons={};
 for(const r of rows){const s=Number(r.season),w=Number(r.week);if(!Number.isFinite(s)||!Number.isFinite(w))continue;seasons[s]??={season:s,weeks:{},rows:0};const x=seasons[s];x.rows++;x.weeks[w]??={week:w,rows:0,positions:{}};const y=x.weeks[w];y.rows++;const p=String(r.position||'').toUpperCase();y.positions[p]=(y.positions[p]||0)+1}
 return {seasons:Object.values(seasons).sort((a,b)=>a.season-b.season).map(s=>({...s,weeks:Object.values(s.weeks).sort((a,b)=>a.week-b.week)}))};
}
export function readinessReport(projections=[],actuals=[],{minMatchRate=.9,requiredPositions=POSITIONS,minRowsPerWeek=20}={}){
 const actualKeys=new Set(actuals.map(r=>`${key(r.season,r.week)}:${r.playerId}`)),matched=projections.filter(r=>actualKeys.has(`${key(r.season,r.week)}:${r.playerId}`));
 const manifest=buildCoverageManifest(projections),issues=[];
 for(const s of manifest.seasons)for(const w of s.weeks){const missing=requiredPositions.filter(p=>!(w.positions[p]>0));if(missing.length)issues.push({severity:'warning',season:s.season,week:w.week,type:'missing_positions',detail:missing});if(w.rows<minRowsPerWeek)issues.push({severity:'warning',season:s.season,week:w.week,type:'low_row_count',detail:w.rows})}
 const matchRate=projections.length?matched.length/projections.length:0;if(matchRate<minMatchRate)issues.push({severity:'error',type:'low_match_rate',detail:matchRate});
 const seasons=manifest.seasons.map(s=>s.season),ready=projections.length>0&&actuals.length>0&&seasons.length>=2&&matchRate>=minMatchRate&&!issues.some(x=>x.severity==='error');
 return {ready,projectionRows:projections.length,actualRows:actuals.length,matchedRows:matched.length,matchRate,seasons,seasonCount:seasons.length,manifest,issues};
}
export function assertDatasetReady(report){if(!report?.ready){const errors=(report?.issues||[]).filter(x=>x.severity==='error').map(x=>x.type).join(', ')||'insufficient coverage';throw new Error(`Historical dataset is not calibration-ready: ${errors}`)}return true}
