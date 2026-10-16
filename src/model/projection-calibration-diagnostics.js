// Diagnostics only: never fit or publish parameters from an insufficient sample.
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const pct=(n,d)=>d?n/d:null;
export function assessProjectionCalibration(accuracy,{minTotal=100,minPerPosition=30,minPerSource=30,minPerHorizon=30,minSeasons=2}={}){
 const overall=accuracy?.overall??{},quality=accuracy?.quality??{},seasons=Object.keys(accuracy?.bySeason??{});
 const groups=(input,minimum)=>Object.fromEntries(Object.entries(input??{}).map(([key,value])=>[key,{n:value?.n??0,mae:value?.mae??null,bias:value?.bias??null,sufficient:(value?.n??0)>=minimum}]));
 const byPosition=groups(accuracy?.byPosition,minPerPosition),bySource=groups(accuracy?.bySource,minPerSource),byHorizon=groups(accuracy?.byHorizon,minPerHorizon);
 const sampleEnough=(overall.n??0)>=minTotal,historyEnough=seasons.length>=minSeasons;
 const ready=sampleEnough&&historyEnough&&quality.rejected===0&&finite(overall.mae)&&finite(overall.rmse);
 const warnings=[];
 if(!sampleEnough)warnings.push('insufficient-total-sample');
 if(!historyEnough)warnings.push('insufficient-distinct-seasons');
 if(quality.rejected>0)warnings.push('rejected-input-rows');
 for(const [name,items] of [['position',byPosition],['source',bySource],['horizon',byHorizon]])for(const [key,value] of Object.entries(items))if(!value.sufficient)warnings.push('insufficient-'+name+':'+key);
 return {schemaVersion:1,mode:'descriptive-only',parameterUpdatesAllowed:false,calibrationReviewReady:ready,overall:{n:overall.n??0,mae:overall.mae??null,rmse:overall.rmse??null,bias:overall.bias??null},coverage:{seasons:seasons.length,accepted:quality.accepted??0,rejected:quality.rejected??0,rejectionRate:pct(quality.rejected??0,(quality.accepted??0)+(quality.rejected??0))},thresholds:{minTotal,minPerPosition,minPerSource,minPerHorizon,minSeasons},byPosition,bySource,byHorizon,warnings};
}
