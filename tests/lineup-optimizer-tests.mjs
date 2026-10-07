import assert from 'node:assert/strict';
import {optimizeLineup,buildFutureWeeklyLineups} from '../src/model/lineup-optimizer.js';
const p=(id,position,projection,extra={})=>({id,name:id,position,nflTeam:'X',projection,...extra});
const roster=[p('QB1','QB',20),p('QB2','QB',15),p('RB1','RB',18),p('RB2','RB',14),p('RB3','RB',10),p('WR1','WR',17),p('WR2','WR',13),p('WR3','WR',12),p('TE1','TE',9),p('TE2','TE',7),p('K1','K',8),p('D1','DEF',7)];
let r=optimizeLineup(roster,{week:10});assert.equal(r.complete,true);assert.equal(r.emptySlots,0);assert.equal(r.lineup.find(x=>x.lineupSlot==='FLEX').id,'WR3');
r=optimizeLineup(roster.map(x=>x.id==='RB1'?{...x,status:'BYE'}:x),{week:10});assert.equal(r.complete,true);assert.ok(!r.lineup.some(x=>x.id==='RB1'));
r=optimizeLineup(roster.filter(x=>x.position!=='TE'),{week:10});assert.equal(r.complete,false);assert.equal(r.emptySlots,1);
const yahooSlots=['QB','RB','RB','WR','WR','TE','W/R/T','K','DEF','BN','BN','BN','BN','BN','BN','IR','IR'];
r=optimizeLineup(roster,{week:10,slots:yahooSlots});assert.equal(r.complete,true);assert.equal(r.emptySlots,0);assert.equal(r.lineup.length,9);assert.equal(r.lineup.find(x=>x.lineupSlot==='FLEX').id,'WR3');assert.ok(!r.lineup.some(x=>['BN','IR'].includes(x.lineupSlot)));
for(const defensePosition of ['DST','D/ST']){const aliased=roster.map(x=>x.id==='D1'?{...x,position:defensePosition}:x);r=optimizeLineup(aliased,{week:10,slots:yahooSlots});assert.equal(r.complete,true,`${defensePosition} should fill DEF`);assert.equal(r.lineup.find(x=>x.lineupSlot==='DEF').id,'D1');}
const dstSlots=yahooSlots.map(x=>x==='DEF'?'DST':x);r=optimizeLineup(roster,{week:10,slots:dstSlots});assert.equal(r.complete,true);assert.equal(r.lineup.find(x=>x.lineupSlot==='DEF').id,'D1');

const auditSlots=['QB','RB','RB','WR','WR','TE','FLEX','K','DEF'];
const auditEligible={QB:['QB'],RB:['RB'],WR:['WR'],TE:['TE'],K:['K'],DEF:['DEF'],FLEX:['RB','WR','TE']};
const auditUsable=(x,week)=>x&&x.projectionStatus!=='missing'&&!['OUT','IR','SUSPENDED','BYE'].includes(String(x.status||'ACTIVE').toUpperCase())&&Number(x.byeWeek)!==Number(week)&&Number.isFinite(Number(x.projection));
function exhaustiveScore(players,{week=10,slots=auditSlots}={}){
 const pool=players.filter(x=>auditUsable(x,week));let best=-Infinity;
 const search=(i,used,score)=>{
  if(i===slots.length){best=Math.max(best,score);return}
  const slot=slots[i];
  for(let j=0;j<pool.length;j++)if(!used.has(j)&&(auditEligible[slot]||[slot]).includes(pool[j].position)){
   used.add(j);search(i+1,used,score+Number(pool[j].projection));used.delete(j);
  }
  search(i+1,used,score);
 };
 search(0,new Set(),0);return Math.max(0,best);
}
let state=0x5eed1234;const rand=()=>{state=(1664525*state+1013904223)>>>0;return state/2**32};
const positions=['QB','RB','WR','TE','K','DEF'];
for(let trial=0;trial<250;trial++){
 const players=[];let id=0;
 for(const position of positions){
  const count=position==='RB'||position==='WR'?3+Math.floor(rand()*2):1+Math.floor(rand()*2);
  for(let j=0;j<count;j++){const status=rand()<.08?'OUT':rand()<.04?'BYE':'ACTIVE';players.push(p(`A${trial}-${id++}`,position,Math.round(rand()*250)/10,{status,byeWeek:status==='BYE'?10:null}));}
 }
 const fast=optimizeLineup(players,{week:10,slots:auditSlots}),expected=exhaustiveScore(players,{week:10,slots:auditSlots});
 assert.ok(Math.abs(fast.projectedPoints-expected)<1e-9,`random audit trial ${trial}: memoized ${fast.projectedPoints} != exhaustive ${expected}`);
 assert.ok(Math.abs(fast.lineup.reduce((sum,x)=>sum+Number(x.projection||0),0)-fast.projectedPoints)<1e-9,`random audit trial ${trial}: lineup score mismatch`);
}

const snapshot={teams:[{id:'A',name:'A',lineup:roster}],schedule:[{week:10,matchups:[]}],playoffWeeks:[15]};const out=buildFutureWeeklyLineups(snapshot);assert.ok(out.teams[0].weeklyLineups[10]);assert.ok(out.teams[0].weeklyLineups[15]);assert.equal(out.teams[0].lineupDiagnostics[10].complete,true);
console.log('lineup-optimizer-tests: all checks passed');
