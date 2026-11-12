// Hypothetical aggregate scoring sensitivity; NOT free-agent allocation or a trusted forecast.
// Only replaces explicit EMPTY future lineup slots, never modifies the input or submitted lineup.
const key=(id,week,slot)=>JSON.stringify([String(id),Number(week),String(slot).toUpperCase()]);
export function buildProvisionalReplacementScenario(input,estimates,{currentWeek}={}){
 if(!Array.isArray(input?.teams)||!Array.isArray(estimates)||!Number.isInteger(Number(currentWeek)))throw new Error('Invalid replacement scenario input');
 const byKey=new Map();
 for(const e of estimates){
  const k=key(e.teamId,e.week,e.slot);
  if(e.teamId==null||!Number.isInteger(Number(e.week))||Number(e.week)<=Number(currentWeek)||!Number.isFinite(e.points)||e.points<0||e.method!=='direct-week-ranks-3-to-5'||byKey.has(k))throw new Error('Replacement scenario requires unique future direct-week estimates');
  byKey.set(k,e);
 }
 const used=new Set();
 const teams=input.teams.map(t=>({...t,weeklyLineups:Object.fromEntries(Object.entries(t.weeklyLineups??{}).map(([w,players])=>{
  const week=Number(w);
  return [w,players.map(p=>{
   if(p.status!=='EMPTY'||week<=Number(currentWeek))return p;
   const k=key(t.id,week,p.lineupSlot??p.position),e=byKey.get(k);
   if(!e||used.has(k))throw new Error('Missing or ambiguous replacement estimate for '+t.id+' week '+week+' slot '+(p.lineupSlot??p.position));
   used.add(k);
   const position=String(p.lineupSlot??p.position).toUpperCase();
   if(!['QB','RB','WR','TE','K','DEF'].includes(position))throw new Error('Unsupported hypothetical replacement position '+position);
   return {...p,id:'HYPOTHETICAL-'+t.id+'-'+week+'-'+position,name:'Hypothetical '+position+' scoring',position,projection:e.points,status:'ACTIVE',projectionStatus:'hypothetical',byeWeek:null,playProbability:1};
  })];
 }))}));
 if(used.size!==byKey.size)throw new Error('Unused replacement estimates: scenario coverage mismatch');
 return {...input,teams};
}
