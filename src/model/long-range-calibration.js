const DEFAULT_WEIGHTS=[0,.25,.5,.65,.75,1];
const DEFAULT_DECAYS=[.6,.7,.8,.9,1];

const finite=v=>Number.isFinite(Number(v));
const key=r=>`${r.season}:${r.playerId}`;

export function weightedRecentProjection(samples,{beforeWeek,decay=.8}={}){
 const eligible=(samples||[]).filter(r=>Number(r.week)<Number(beforeWeek)&&finite(r.actual));
 if(!eligible.length)return null;
 const newest=Math.max(...eligible.map(r=>Number(r.week)));
 let total=0,weight=0;
 for(const row of eligible){const w=Math.pow(decay,newest-Number(row.week));total+=Number(row.actual)*w;weight+=w;}
 return weight?total/weight:null;
}

export function evaluateLongRangeBlend(rows=[],{seasonBaselines=[],seasonWeights=DEFAULT_WEIGHTS,recencyDecays=DEFAULT_DECAYS,minHistory=1}={}){
 const baseline=new Map((seasonBaselines||[]).filter(r=>finite(r.projection)).map(r=>[key(r),Number(r.projection)]));
 const groups=new Map();
 for(const row of rows||[]){if(!finite(row.actual)||!row.playerId)continue;const k=key(row);if(!groups.has(k))groups.set(k,[]);groups.get(k).push(row);}
 const results=[];
 for(const seasonWeight of seasonWeights)for(const recencyDecay of recencyDecays){
  let n=0,se=0,ae=0,bias=0;
  const byPosition=new Map();
  for(const [k,playerRows] of groups){
   const seasonBaseline=baseline.get(k);if(!finite(seasonBaseline))continue;
   const ordered=[...playerRows].sort((a,b)=>Number(a.week)-Number(b.week));
   for(const target of ordered){
    const history=ordered.filter(r=>Number(r.week)<Number(target.week));if(history.length<minHistory)continue;
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

export function selectLongRangeCalibration(rows=[],options={}){
 const results=evaluateLongRangeBlend(rows,options),best=results[0]||null;
 return{best,results,defaults:{seasonWeight:.65,recencyDecay:.8}};
}
