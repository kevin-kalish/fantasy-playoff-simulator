const mean=xs=>xs.length?xs.reduce((a,b)=>a+b,0)/xs.length:0;
function corr(pairs){if(pairs.length<8)return null;const xs=pairs.map(x=>x[0]),ys=pairs.map(x=>x[1]),mx=mean(xs),my=mean(ys),num=pairs.reduce((s,[x,y])=>s+(x-mx)*(y-my),0),dx=Math.sqrt(xs.reduce((s,x)=>s+(x-mx)**2,0)),dy=Math.sqrt(ys.reduce((s,y)=>s+(y-my)**2,0));return dx&&dy?num/(dx*dy):null;}
const pairKey=(a,b)=>[a,b].sort().join('-');
export function empiricalErrorCorrelations(rows,{minProjection=3}={}){
 const games=new Map();for(const r of rows){const projection=Number(r.projection),actual=Number(r.actual??r.actualPoints);if(!Number.isFinite(projection)||!Number.isFinite(actual)||projection<minProjection||!r.nflTeam)continue;const key=`${r.season}:${r.week}:${r.nflTeam}`;(games.get(key)||games.set(key,[]).get(key)).push({...r,error:actual-projection});}
 const pairs={};for(const players of games.values())for(let i=0;i<players.length;i++)for(let j=i+1;j<players.length;j++){const a=players[i],b=players[j],key=pairKey(a.position,b.position);(pairs[key]||=[]).push([a.error,b.error]);}
 return Object.fromEntries(Object.entries(pairs).map(([k,v])=>[k,{n:v.length,correlation:corr(v)}]).filter(([,v])=>v.correlation!=null));
}
export function recommendedCorrelationPriors(rows,opts={}){const c=empiricalErrorCorrelations(rows,opts),get=k=>c[k]?.correlation;const pass=[get('QB-WR'),get('QB-TE')].filter(Number.isFinite);return{qbPassCatcher:pass.length?Math.max(0,mean(pass)):null,rbTeamOffense:get('QB-RB')??null,raw:c};}
