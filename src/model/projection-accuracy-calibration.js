// Point-in-time projection accuracy. Input rows must contain archived pregame
// forecasts and realized points; never reconstruct forecasts from final scores.
const finite=x=>x!==null&&x!==undefined&&x!==''&&Number.isFinite(Number(x));
const norm=x=>String(x??'UNKNOWN').trim().toUpperCase();
function summary(rows){
 const n=rows.length;
 if(!n)return {n:0,mae:null,rmse:null,bias:null,within3:null};
 let absolute=0,squared=0,signed=0,within3=0;
 for(const r of rows){const e=r.projection-r.actual;absolute+=Math.abs(e);squared+=e*e;signed+=e;if(Math.abs(e)<=3)within3++;}
 return {n,mae:absolute/n,rmse:Math.sqrt(squared/n),bias:signed/n,within3:within3/n};
}
function group(rows,key){const m=new Map();for(const r of rows){const k=String(key(r));if(!m.has(k))m.set(k,[]);m.get(k).push(r);}return Object.fromEntries([...m].sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>[k,summary(v)]));}
export function evaluateProjectionAccuracy(input=[],{asOf=null,minSamples=30}={}){
 if(!Array.isArray(input))throw new Error('projection calibration expects an array');
 const accepted=[],rejected=[],seen=new Set();
 for(let i=0;i<input.length;i++){
  const r=input[i],season=Number(r?.season),week=Number(r?.week),id=String(r?.playerId??'').trim(),source=String(r?.source??'').trim(),scoring=norm(r?.scoring);
  const target=Date.parse(r?.kickoffAt??''),issued=Date.parse(r?.projectedAt??''),observed=Date.parse(r?.actualRecordedAt??'');
  const fail=reason=>rejected.push({row:i+1,reason});
  if(!Number.isInteger(season)||!Number.isInteger(week)||week<1||week>22||!id||!source||!['PPR','HALF','STANDARD'].includes(scoring)||!finite(r?.projection)||!finite(r?.actual)){fail('invalid-required-fields');continue;}
  if(!Number.isFinite(target)||!Number.isFinite(issued)||issued>=target){fail('projection-not-proven-pregame');continue;}
  if(!Number.isFinite(observed)||observed<target){fail('actual-not-proven-postgame');continue;}
  if(asOf&&(!Number.isFinite(Date.parse(asOf))||observed>Date.parse(asOf))){fail('actual-after-as-of');continue;}
  const key=[season,week,id,source,scoring].join(':');
  if(seen.has(key)){fail('duplicate-player-week-source');continue;}
  seen.add(key);
  const horizonHours=(target-issued)/3600000;
  const horizon=horizonHours<=24?'0-24h':horizonHours<=72?'24-72h':horizonHours<=168?'3-7d':'7d+';
  accepted.push({season,week,playerId:id,source,scoring,position:norm(r.position),projection:Number(r.projection),actual:Number(r.actual),horizon});
 }
 const count=accepted.length;
 const bySeason=group(accepted,r=>r.season);
 const historicalSeasons=[...new Set(accepted.map(r=>r.season))].sort((a,b)=>a-b);
 const walkForward=historicalSeasons.map(season=>({testSeason:season,trainingSeasons:historicalSeasons.filter(s=>s<season),test:summary(accepted.filter(r=>r.season===season)),prior:summary(accepted.filter(r=>r.season<season))}));
 return {schemaVersion:1,scope:'Archived pregame projection vs realized fantasy points, descriptive accuracy only; no automatic parameter fitting or future-data leakage',overall:summary(accepted),byPosition:group(accepted,r=>r.position),bySource:group(accepted,r=>r.source),byHorizon:group(accepted,r=>r.horizon),byScoring:group(accepted,r=>r.scoring),bySeason,walkForward,rejected,quality:{accepted:count,rejected:rejected.length,minSamples,confidence:count>=minSamples?'DESCRIPTIVE_SAMPLE':'INSUFFICIENT_SAMPLE',hasHistoricalComparison:historicalSeasons.length>=2},publicationEligible:false};
}
