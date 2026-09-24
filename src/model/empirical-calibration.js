const DEFAULT_CV={QB:.27,RB:.40,WR:.47,TE:.48,K:.45,DEF:.50};
const mean=xs=>xs.length?xs.reduce((a,b)=>a+b,0)/xs.length:null;
const quantile=(xs,q)=>{if(!xs.length)return null;const a=[...xs].sort((x,y)=>x-y),p=(a.length-1)*q,l=Math.floor(p),h=Math.ceil(p);return a[l]+(a[h]-a[l])*(p-l)};
const sd=xs=>{if(xs.length<2)return null;const m=mean(xs);return Math.sqrt(xs.reduce((s,x)=>s+(x-m)**2,0)/(xs.length-1))};
export function projectionErrorProfile(rows,{minProjection=3,minRows=30}={}){
 const by={};for(const r of rows){const p=Number(r.projection),a=Number(r.actual??r.actualPoints);if(!Number.isFinite(p)||!Number.isFinite(a)||p<minProjection)continue;(by[r.position]||=[]).push({p,a,error:a-p,ratio:a/Math.max(p,.1)});}
 const out={};for(const [position,g] of Object.entries(by)){if(g.length<minRows)continue;const errors=g.map(x=>x.error),ratios=g.map(x=>x.ratio),projs=g.map(x=>x.p),actuals=g.map(x=>x.a),residSd=sd(errors),projMean=mean(projs);out[position]={n:g.length,bias:mean(errors),mae:mean(errors.map(Math.abs)),rmse:Math.sqrt(mean(errors.map(x=>x*x))),errorSd:residSd,projectionMean:projMean,actualMean:mean(actuals),cv:residSd/Math.max(projMean,1),ratioMedian:quantile(ratios,.5),ratioP10:quantile(ratios,.1),ratioP90:quantile(ratios,.9)};}return out;
}
export function calibratedPositionCV(rows,opts={}){const profiles=projectionErrorProfile(rows,opts),out={...DEFAULT_CV};for(const [pos,p] of Object.entries(profiles))out[pos]=Math.max(.12,Math.min(1.10,p.cv));return out;}
export function projectionBiasAdjustments(rows,opts={}){const profiles=projectionErrorProfile(rows,opts),out={};for(const [pos,p] of Object.entries(profiles))out[pos]={additive:p.bias,multiplier:p.projectionMean>0?p.actualMean/p.projectionMean:1,n:p.n};return out;}
export function calibrationSnapshot(rows,opts={}){return{profiles:projectionErrorProfile(rows,opts),positionCV:calibratedPositionCV(rows,opts),bias:projectionBiasAdjustments(rows,opts)};}
