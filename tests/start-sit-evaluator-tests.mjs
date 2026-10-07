import assert from 'node:assert/strict';
import {enumerateStartSitChoices,applyStartSitChoice,evaluateStartSitChoices} from '../src/model/start-sit-evaluator.js';
import {prepareLeagueSimulation} from '../src/model/league-preparation.js';
const p=(id,name,pos,projection,slot=null)=>({id,name,position:pos,projection,...(slot?{lineupSlot:slot}:{})});
const aQB=p('A-QB','AQ','QB',15),aRB=p('A-RB','Starter RB','RB',10,'RB'),aBench=p('A-BRB','Bench RB','RB',20),bQB=p('B-QB','BQ','QB',14),bRB=p('B-RB','BR','RB',14);
const input={simulations:1000,seed:88,modelVariant:'baseline',lineupSlots:['QB','RB'],playoffSpots:2,playoffWeeks:[3],teams:[{id:'A',name:'Alpha',wins:2,losses:0,points:200,roster:[aQB,aRB,aBench],weeklyLineups:{1:[p('A-QB','AQ','QB',15,'QB'),aRB],2:[p('A-QB','AQ','QB',15,'QB'),aRB],3:[p('A-QB','AQ','QB',15,'QB'),aRB]}},{id:'B',name:'Bravo',wins:1,losses:1,points:180,roster:[bQB,bRB],weeklyLineups:{1:[p('B-QB','BQ','QB',14,'QB'),p('B-RB','BR','RB',14,'RB')],2:[p('B-QB','BQ','QB',14,'QB'),p('B-RB','BR','RB',14,'RB')],3:[p('B-QB','BQ','QB',14,'QB'),p('B-RB','BR','RB',14,'RB')]}}],schedule:[{week:1,matchups:[['A','B']]},{week:2,matchups:[['B','A']]}]};
const rows=[{week:1,playerId:'A-RB',projection:10},{week:1,playerId:'A-BRB',projection:20}];
const choices=enumerateStartSitChoices(input,{teamId:'A',week:1,projectionRows:rows,slot:'RB'});assert.equal(choices.length,1);assert.equal(choices[0].projectedPointDelta,10);
const changed=applyStartSitChoice(input,{teamId:'A',week:1,startPlayerId:'A-BRB',sitPlayerId:'A-RB',projectionRows:rows});assert.equal(changed.teams[0].weeklyLineups[1][1].id,'A-BRB');
const ranked=evaluateStartSitChoices(input,{teamId:'A',week:1,projectionRows:rows,slot:'RB'});assert.equal(ranked[0].rank,1);assert.equal(ranked[0].startPlayerId,'A-BRB');assert.ok(ranked[0].winsDelta>=0);
const liveSnapshot={source:{provider:'fixture',season:2026},currentWeek:5,lineupSlots:['RB','WR','RB/WR/TE'],playoffSpots:2,playoffWeeks:[5],teams:[
 {id:'K',name:"The Fightin' Kali",wins:1,losses:3,roster:[p('mont','David Montgomery','RB',0,'RB'),p('gold','Matthew Golden','WR',0,'WR'),p('hend','TreVeyon Henderson','RB',0,'RB/WR/TE'),p('egb','Emeka Egbuka','WR',0,'BN')],weeklyLineups:{5:[p('mont','David Montgomery','RB',0,'RB'),p('gold','Matthew Golden','WR',0,'WR'),p('hend','TreVeyon Henderson','RB',0,'RB/WR/TE')]}},
 {id:'B',name:'Bravo',wins:2,losses:2,roster:[p('br1','B RB','RB',0,'RB'),p('bw1','B WR','WR',0,'WR'),p('br2','B Flex','RB',0,'RB/WR/TE')],weeklyLineups:{5:[p('br1','B RB','RB',0,'RB'),p('bw1','B WR','WR',0,'WR'),p('br2','B Flex','RB',0,'RB/WR/TE')]}}
],schedule:[{week:5,matchups:[['K','B']]}]};
const liveRows=[
 {season:2026,week:5,playerId:'mont',name:'David Montgomery',position:'RB',projection:10},
 {season:2026,week:5,playerId:'gold',name:'Matthew Golden',position:'WR',projection:8},
 {season:2026,week:5,playerId:'hend',name:'TreVeyon Henderson',position:'RB',projection:9},
 {season:2026,week:5,playerId:'egb',name:'Emeka Egbuka',position:'WR',projection:20},
 {season:2026,week:5,playerId:'br1',name:'B RB',position:'RB',projection:10},
 {season:2026,week:5,playerId:'bw1',name:'B WR',position:'WR',projection:10},
 {season:2026,week:5,playerId:'br2',name:'B Flex',position:'RB',projection:9}
];
const prepared=prepareLeagueSimulation(liveSnapshot,liveRows,{weeks:[5],season:2026,minimumProjectionMatchRate:1,simulations:100});
const liveIds=prepared.input.teams.find(t=>t.id==='K').weeklyLineups[5].map(x=>x.id);
assert.deepEqual(liveIds,['mont','gold','hend'],'current week must preserve the submitted Yahoo starters instead of pre-optimizing them');
const liveChoices=enumerateStartSitChoices(prepared.input,{teamId:'K',week:5,projectionRows:liveRows});
assert.ok(liveChoices.some(x=>x.startPlayerId==='egb'&&x.sitPlayerId==='gold'),'bench WR should be considered against the submitted WR starter');
assert.ok(!liveChoices.some(x=>x.startPlayerId==='mont'),'a player already starting in another slot must never be proposed as the start side of a start/sit move');
assert.ok(!liveChoices.some(x=>x.startPlayerId==='hend'),'the submitted flex starter must never be proposed as the start side of another start/sit move');
console.log('start-sit-evaluator-tests: all checks passed');
