const DEFAULT_WEIGHTS=[0,.25,.5,.65,.75,1];
const DEFAULT_DECAYS=[.6,.7,.8,.9,1];

const finite=v=>Number.isFinite(Number(v));
const key=r=>`${r.season}:${r.playerId}`;

// The live long-range model blends a season baseline with recent WEEKLY
// projections. Historical calibration must use the same information type;
// using prior actual fantasy points here would calibrate a different model.
export function weightedRecentProjection(samples,{beforeWeek,decay=.8}={}){
 const eligible=(samples||[]).filter(r=>Number(r.week)<Number(beforeWeek)&&finite(r.projection));
 if(!eligible.length)return null;
 const newest=Math.max(...eligible.map(x=>Number(x.week)));
 let total=0,weight=0;
 for(const row of eligible){const w=Math.pow(decay,newest-Number(row.week));total+=Number(row.projection)*w;weight+=w;}
 return weight?total/weight:null;
}

export function deriveSeasonBaselines(rows=[],{throughWeek=3,minWeeks=1}={}){
 const groups=new Map();
 for(const row of rows){if(!row.playerId||!finite(row.projection)||Number(row.week)>throughWeek)continue;const k=key(row),g=groups.get(k)||{season:Number(row.season),playerId:String(row.playerId),name:row.name||null,position:row.position||null,total:0,n:0};g.total+=Number(row.projection);g.n++;groups.set(k,g);}
 return[...groups.values()].filter(g=>g.n>=minWeeks).map(g=>({season:g.season,playerId:g.playerId,name:g.name,position:g.position,projection:g.total/g.n,sampleWeeks:g.n,source:`weekly-projection-mean-through-week-${throughWeek}`}));
}

export function evaluateLongRangeBlend(rows=[],{seasonBaselines=[],seasonWeights=DEFAULT_WEIGHTS,recencyDecays=DEFAULT_DECAYS,minHistory=1,minTargetWeek=2}={}){
 const baseline=new Map((seasonBaselines||[]).filter(r=>finite(r.projection)).map(r=>[key(r),Number(r.projection)]));
 const groups=new Map();
 for(const row of rows||[]){if(!finite(row.actual)||!finite(row.projection)||!row.playerId)continue;const k=key(row);if(!groups.has(k))groups.set(k,[]);groups.get(k).push(row);}
 const results=[];
 for(const seasonWeight of seasonWeights)for(const recencyDecay of recencyDecays){
  let n=0,se=0,ae=0,bias=0;const byPosition=new Map();
  for(const [k,playerRows] of groups){
   const seasonBaseline=baseline.get(k);if(!finite(seasonBaseline))continue;
   const ordered=[...playerRows].sort((a,b)=>Number(a.week)-Number(b.week));
   for(const target of ordered){if(Number(target.week)<minTargetWeek)continue;const history=ordered.filter(r=>Number(r.week)<Number(target.week));if(history.length<minHistory)continue;
    const recent=weightedRecentProjection(history,{beforeWeek:target.week,decay:recencyDecay});if(!finite(recent))continue;
    const prediction=Number(seasonBaseline)*seasonWeight+Number(recent)*(1-seasonWeight),error=prediction-Number(target.actual);
    n++;se+=error*error;ae+=Math.abs(error);bias+=error;
    const position=String(target.position||'UNK').toUpperCase(),p=byPosition.get(position)||{n:0,se:0,ae:0,bias:0};p.n++;p.se+=error*error;p.ae+=Math.abs(error);p.bias+=error;byPosition.set(position,p);
   }
  }
  const summarize=x=>({n:x.n,rmse:x.n?Math.sqrt(x.se/x.n):null,mae:x.n?x.ae/x.n:null,bias:x.n?x.bias/x.n:null});
  results.push({seasonWeight,recencyDecay,...summarize({n,se,ae,bias}),byPosition:Object.fromEntries([...byPosition].map(([p,v])=>[p,summarize(v)]))});
 }
 return results.sort((a,b)=>(a.rmse??Infinity)-(b.rmse??Infinity));
}

export function selectLongRangeCalibration(rows=[],options={}){const results=evaluateLongRangeBlend(rows,options),best=results[0]||null;return{best,results,defaults:{seasonWeight:.65,recencyDecay:.8}};}

export function evaluateLongRangeWalkForward(rows=[],{baselineThroughWeek=3,seasonWeights=DEFAULT_WEIGHTS,recencyDecays=DEFAULT_DECAYS,minHistory=1}={}){
 const seasons=[...new Set((rows||[]).map(r=>Number(r.season)).filter(Number.isFinite))].sort((a,b)=>a-b),folds=[];
 for(const holdoutSeason of seasons){
  const trainRows=rows.filter(r=>Number(r.season)!==holdoutSeason),testRows=rows.filter(r=>Number(r.season)===holdoutSeason);
  if(!trainRows.length||!testRows.length)continue;
  const trainBaselines=deriveSeasonBaselines(trainRows,{throughWeek:baselineThroughWeek,minWeeks:1});
  const selected=selectLongRangeCalibration(trainRows,{seasonBaselines:trainBaselines,seasonWeights,recencyDecays,minHistory,minTargetWeek:baselineThroughWeek+1});
  if(!selected.best?.n)continue;
  const testBaselines=deriveSeasonBaselines(testRows,{throughWeek:baselineThroughWeek,minWeeks:1});
  const evaluated=evaluateLongRangeBlend(testRows,{seasonBaselines:testBaselines,seasonWeights:[selected.best.seasonWeight],recencyDecays:[selected.best.recencyDecay],minHistory,minTargetWeek:baselineThroughWeek+1})[0]||null;
  const defaults=evaluateLongRangeBlend(testRows,{seasonBaselines:testBaselines,seasonWeights:[.65],recencyDecays:[.8],minHistory,minTargetWeek:baselineThroughWeek+1})[0]||null;
  folds.push({holdoutSeason,trainedOnSeasons:seasons.filter(s=>s!==holdoutSeason),selected:{seasonWeight:selected.best.seasonWeight,recencyDecay:selected.best.recencyDecay,trainingRmse:selected.best.rmse,trainingN:selected.best.n},test:evaluated,defaults,rmseImprovement:evaluated&&defaults&&finite(evaluated.rmse)&&finite(defaults.rmse)?defaults.rmse-evaluated.rmse:null});
 }
 const valid=folds.filter(f=>finite(f.test?.rmse)&&finite(f.defaults?.rmse));
 const totalN=valid.reduce((n,f)=>n+Number(f.test.n||0),0),weighted=(field)=>totalN?valid.reduce((sum,f)=>sum+Number(f[field]?.rmse||0)*Number(f.test.n||0),0)/totalN:null;
 const selectedRmse=weighted('test'),defaultRmse=weighted('defaults');
 return{folds,summary:{folds:valid.length,n:totalN,selectedRmse,defaultRmse,rmseImprovement:finite(selectedRmse)&&finite(defaultRmse)?defaultRmse-selectedRmse:null,rmseImprovementPct:finite(defaultRmse)&&defaultRmse?((defaultRmse-selectedRmse)/defaultRmse):null,selectedWeights:[...new Set(valid.map(f=>f.selected.seasonWeight))],selectedDecays:[...new Set(valid.map(f=>f.selected.recencyDecay))]}};
}
