// Offline coverage assessment. Never infer completeness from HTTP success or row count alone.
// expectedPlayers should come from the current Yahoo roster/snapshot, not provider results.
const POSITIONS=['QB','RB','WR','TE','K','DST'];
const norm=s=>String(s??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
const position=p=>{const v=String(p??'').toUpperCase().replace(/[^A-Z]/g,'');return v==='DEF'||v==='D'||v==='DST'?'DST':v;};
const identity=r=>String(r?.playerId??r?.id??'').trim();
const nameKey=r=>norm(r?.name??r?.playerName??r?.player??'');
const rowKey=r=>{const p=position(r?.position??r?.pos),team=norm(r?.nflTeam??r?.team??'');return p+'|'+nameKey(r)+'|'+team;};
export function assessProjectionCoverage(rows,{expectedPlayers=[],season,week,minimumByPosition={},minimumCoverage=1}={}){
 if(!Array.isArray(rows)||!Array.isArray(expectedPlayers))throw new TypeError('rows and expectedPlayers must be arrays');
 if(!Number.isFinite(minimumCoverage)||minimumCoverage<0||minimumCoverage>1)throw new RangeError('minimumCoverage must be between 0 and 1');
 const relevant=rows.filter(r=>Number(r?.season)===Number(season)&&Number(r?.week)===Number(week));
 const valid=relevant.filter(r=>POSITIONS.includes(position(r.position??r.pos))&&Number.isFinite(Number(r.projection))&&Number(r.projection)>=0&&(identity(r)||nameKey(r)));
 const counts=Object.fromEntries(POSITIONS.map(p=>[p,valid.filter(r=>position(r.position??r.pos)===p).length]));
 const duplicates=[];const seen=new Set();
 for(const r of valid){const k=position(r.position??r.pos)+'|'+(identity(r)||rowKey(r));if(seen.has(k))duplicates.push(k);else seen.add(k);}
 const expected=expectedPlayers.filter(r=>POSITIONS.includes(position(r.position??r.pos)));
 const availableIds=new Set(valid.filter(r=>identity(r)).map(r=>position(r.position??r.pos)+'|'+identity(r)));
 const availableNames=new Set(valid.map(rowKey));
 const missing=expected.filter(r=>!((identity(r)&&availableIds.has(position(r.position??r.pos)+'|'+identity(r)))||availableNames.has(rowKey(r))));
 const required=Object.fromEntries(POSITIONS.map(p=>[p,Math.max(0,Math.ceil(Number(minimumByPosition[p]??0)))]));
 const shortages=Object.fromEntries(POSITIONS.filter(p=>counts[p]<required[p]).map(p=>[p,required[p]-counts[p]]));
 const coverage=expected.length?(expected.length-missing.length)/expected.length:null;
 const blockers=[];
 if(!Number.isInteger(Number(season))||!Number.isInteger(Number(week)))blockers.push('invalid-season-week');
 if(!expected.length)blockers.push('no-expected-roster');
 if(missing.length)blockers.push('missing-rostered-players');
 if(Object.keys(shortages).length)blockers.push('position-shortages');
 if(duplicates.length)blockers.push('duplicate-projection-rows');
 if(coverage!==null&&coverage<minimumCoverage)blockers.push('below-minimum-coverage');
 return {ready:blockers.length===0,season:Number(season),week:Number(week),inputRows:rows.length,relevantRows:relevant.length,validRows:valid.length,counts,required,expectedPlayers:expected.length,matchedPlayers:expected.length-missing.length,coverage,missing:missing.map(r=>({playerId:identity(r)||null,name:r.name??null,position:position(r.position??r.pos)})),duplicateCount:duplicates.length,shortages,blockers,note:'Offline diagnostic only; provider retrieval, scoring compatibility, pregame timing, and forecast issuance must be verified separately.'};
}
