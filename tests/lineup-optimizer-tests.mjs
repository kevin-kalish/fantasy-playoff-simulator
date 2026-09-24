import assert from 'node:assert/strict';
import {optimizeLineup,buildFutureWeeklyLineups} from '../src/model/lineup-optimizer.js';
const p=(id,position,projection,extra={})=>({id,name:id,position,nflTeam:'X',projection,...extra});
const roster=[p('QB1','QB',20),p('QB2','QB',15),p('RB1','RB',18),p('RB2','RB',14),p('RB3','RB',10),p('WR1','WR',17),p('WR2','WR',13),p('WR3','WR',12),p('TE1','TE',9),p('TE2','TE',7),p('K1','K',8),p('D1','DEF',7)];
let r=optimizeLineup(roster,{week:10});assert.equal(r.complete,true);assert.equal(r.emptySlots,0);assert.equal(r.lineup.find(x=>x.lineupSlot==='FLEX').id,'WR3');
r=optimizeLineup(roster.map(x=>x.id==='RB1'?{...x,status:'BYE'}:x),{week:10});assert.equal(r.complete,true);assert.ok(!r.lineup.some(x=>x.id==='RB1'));
r=optimizeLineup(roster.filter(x=>x.position!=='TE'),{week:10});assert.equal(r.complete,false);assert.equal(r.emptySlots,1);
const snapshot={teams:[{id:'A',name:'A',lineup:roster}],schedule:[{week:10,matchups:[]}],playoffWeeks:[15]};const out=buildFutureWeeklyLineups(snapshot);assert.ok(out.teams[0].weeklyLineups[10]);assert.ok(out.teams[0].weeklyLineups[15]);assert.equal(out.teams[0].lineupDiagnostics[10].complete,true);
console.log('lineup-optimizer-tests: all checks passed');
