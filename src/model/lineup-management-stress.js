import {optimizeLineup} from './lineup-optimizer.js';
const id=p=>String(p?.id??p?.playerId??p?.name??'');
const usable=(p,w)=>p&&Number.isFinite(Number(p.projection))&&!['OUT','O','IR','BYE','INACTIVE','SUSP','SUSPENDED'].includes(String(p.status??'').toUpperCase())&&Number(p.byeWeek)!==Number(w);
const eligible=(p,slot)=>{const pos=String(p.position??p.pos??'').toUpperCase().replace('D/ST','DEF').replace('DST','DEF'),s=String(slot??'').toUpperCase();return s==='FLEX'?['RB','WR','TE'].includes(pos):s==='W/R/T'?['RB','WR','TE'].includes(pos):s==='W/R'?['RB','WR'].includes(pos):s==='W/T'?['WR','TE'].includes(pos):s==='Q/W/R/T'?['QB','RB','WR','TE'].includes(pos):pos===s.replace('D/ST','DEF')};
function hash(s){let h=2166136261;for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619);return h>>>0;}
/** Deterministic, identical policy across managers. Diagnostic, not a forecast of manager skill. */
export function applyLineupManagementStress(input,league,{missRate=.5,seed=20260923,maxLoss=12}={}){
 if(!Number.isFinite(missRate)||missRate<0||missRate>1)throw Error('missRate must be between 0 and 1');
 const future=[...new Set([...(input.schedule??[]).map(x=>Number(x.week)),...(input.playoffWeeks??[]).map(Number)])].filter(Number.isInteger).sort((a,b)=>a-b);
 const current=Math.min(...(input.schedule??[]).map(x=>Number(x.week)));
 const modified=structuredClone(input);let swaps=0,opportunities=0,loss=0;
 for(const team of modified.teams){
  const original=(league.teams??[]).find(x=>String(x.id)===String(team.id));
  for(const week of future){
   if(week===current)continue;
   const lineup=team.weeklyLineups?.[week],roster=original?.weeklyRosters?.[week];
   if(!lineup?.length||!roster?.length)continue;
   const chosen=new Set(lineup.map(id));let best=null;
   for(let i=0;i<lineup.length;i++){
    const starter=lineup[i],slot=starter.lineupSlot;
    for(const candidate of roster){
     if(chosen.has(id(candidate))||!usable(candidate,week)||!eligible(candidate,slot))continue;
     const delta=Number(starter.projection)-Number(candidate.projection);
     if(!(delta>0&&delta<=maxLoss))continue;
     if(!best||delta<best.delta)best={i,candidate,delta,slot};
    }
   }
   if(!best)continue;opportunities++;
   if(hash(String(seed)+'|'+team.id+'|'+week)/4294967296>=missRate)continue;
   team.weeklyLineups[week][best.i]={...best.candidate,lineupSlot:best.slot};
   swaps++;loss+=best.delta;
  }
 }
 return {input:modified,diagnostics:{missRate,opportunities,swaps,totalProjectedPointsLost:loss,averageLoss:swaps?loss/swaps:0,policy:'one small legal starter/bench downgrade on selected future team-weeks; uniform deterministic hash; not manager-specific'}};
}
