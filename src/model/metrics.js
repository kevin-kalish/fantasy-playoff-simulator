const mean=xs=>xs.length?xs.reduce((a,b)=>a+b,0)/xs.length:null;
export const mae=rows=>mean(rows.map(r=>Math.abs(r.predicted-r.actual)));
export const rmse=rows=>Math.sqrt(mean(rows.map(r=>(r.predicted-r.actual)**2)));
export const brier=rows=>mean(rows.map(r=>(r.probability-r.outcome)**2));
export const logLoss=rows=>mean(rows.map(r=>{const p=Math.max(1e-9,Math.min(1-1e-9,r.probability));return -(r.outcome*Math.log(p)+(1-r.outcome)*Math.log(1-p))}));
export function calibrationBins(rows,bins=10){const out=Array.from({length:bins},(_,i)=>({low:i/bins,high:(i+1)/bins,rows:[]}));for(const r of rows){const i=Math.min(bins-1,Math.floor(Math.max(0,Math.min(.999999,r.probability))*bins));out[i].rows.push(r)}return out.map(b=>({low:b.low,high:b.high,n:b.rows.length,meanProbability:mean(b.rows.map(r=>r.probability)),observedRate:mean(b.rows.map(r=>r.outcome))}))}
export function expectedCalibrationError(rows,bins=10){const bs=calibrationBins(rows,bins),n=rows.length||1;return bs.reduce((s,b)=>s+(b.n/n)*(b.n?Math.abs(b.meanProbability-b.observedRate):0),0)}
