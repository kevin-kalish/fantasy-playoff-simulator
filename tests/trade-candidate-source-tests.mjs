import assert from 'node:assert/strict';
import {discoverTradeCandidates} from '../src/model/trade-candidate-source.js';
const p=(id,name,position,projection)=>({id,name,position,projection});
const input={teams:[{id:'A',name:'Alpha',roster:[p('a1','Alpha RB','RB',15),p('a2','Alpha WR','WR',10),p('a3','Alpha TE','TE',7),p('ak','Alpha K','K',20)]},{id:'B',name:'Bravo',roster:[p('b1','Bravo WR','WR',16),p('b2','Bravo RB','RB',9),p('b3','Bravo TE','TE',6)]},{id:'C',name:'Charlie',roster:[p('c1','Charlie RB','RB',14),p('c2','Charlie WR','WR',8)]}],schedule:[{week:4},{week:5}]};
const rows=[];for(const week of [4,5])for(const t of input.teams)for(const x of t.roster)rows.push({week,playerId:x.id,projection:x.projection});
const out=discoverTradeCandidates(input,{teamId:'A',projectionRows:rows,weeks:[4,5],maxScenarios:20,valueTolerance:.5});
assert.ok(out.scenarios.length>0);assert.ok(out.scenarios.some(x=>x.teamBId==='B'));assert.ok(out.scenarios.some(x=>x.teamBId==='C'));assert.equal(out.scenarios.some(x=>x.teamAGives.includes('ak')),false);assert.ok(out.scenarios.every(x=>x.discovery.valueGap<=.2));assert.equal(out.diagnostics.selectionValueTolerance,.2);assert.equal(out.diagnostics.partnerCount,2);assert.equal(out.diagnostics.version,'league-vorp-roster-fit-v8');assert.ok(Number.isFinite(out.diagnostics.replacementByPosition.RB));assert.ok(Number.isFinite(out.diagnostics.replacementByPosition.WR));assert.ok(out.diagnostics.packageScenarioCount>0);assert.ok(out.scenarios.some(x=>x.discovery.kind!=='1-for-1'));assert.ok(out.scenarios.every(x=>Number.isFinite(x.discovery.partnerNeedGain)));assert.ok(out.scenarios.every(x=>Number.isFinite(x.discovery.partnerSurplusCost)));
const singles=discoverTradeCandidates(input,{teamId:'A',projectionRows:rows,weeks:[4,5],maxScenarios:20,valueTolerance:.5,includePackages:false});assert.ok(singles.scenarios.every(x=>x.discovery.kind==='1-for-1'));
assert.throws(()=>discoverTradeCandidates(input,{teamId:'NOPE'}),/Unknown team/);
const qbInput={teams:[
{id:'A',name:'A',roster:[p('aq1','Elite QB','QB',24),p('aq2','Backup QB A','QB',19),p('awr1','A WR1','WR',10),p('awr2','A WR2','WR',9),p('awr3','A WR3','WR',4)]},
{id:'B',name:'B',roster:[p('bq1','Strong QB','QB',22),p('bq2','Backup QB B','QB',18),p('bwr1','Elite WR','WR',20),p('bwr2','B WR2','WR',9),p('bwr3','B WR3','WR',4)]},
{id:'C',name:'C',roster:[p('cq1','QB C','QB',21),p('cq2','Backup QB C','QB',18),p('cwr1','WR C1','WR',9),p('cwr2','WR C2','WR',8),p('cwr3','WR C3','WR',4)]},
{id:'D',name:'D',roster:[p('dq1','QB D','QB',20),p('dq2','Backup QB D','QB',17),p('dwr1','WR D1','WR',8),p('dwr2','WR D2','WR',7),p('dwr3','WR D3','WR',3)]}
],schedule:[{week:4}]};
const qbRows=[];for(const t of qbInput.teams)for(const x of t.roster)qbRows.push({week:4,playerId:x.id,projection:x.projection});
const qbOut=discoverTradeCandidates(qbInput,{teamId:'A',projectionRows:qbRows,weeks:[4],maxScenarios:100,valueTolerance:1,selectionValueTolerance:1,includePackages:false});
assert.equal(qbOut.diagnostics.replacementByPosition.QB,19);
assert.equal(qbOut.diagnostics.replacementByPosition.WR,4);
const badQbForWr=qbOut.scenarios.find(x=>x.teamAGives.includes('aq1')&&x.teamBGives.includes('bwr1'));
assert.ok(!badQbForWr||badQbForWr.discovery.valueGap>.2,'abundant QB should not look balanced with elite scarce WR');
const duplicateNeed=out.scenarios.find(x=>x.discovery.kind==='1-for-2'&&x.teamBGives.length===2&&x.teamBGives.every(id=>['b1','b2','b3'].includes(id)));
if(duplicateNeed){const positionsById=new Map(input.teams.flatMap(t=>t.roster).map(x=>[x.id,x.position]));const receivedPositions=duplicateNeed.teamBGives.map(id=>positionsById.get(id));if(receivedPositions[0]===receivedPositions[1])assert.ok(duplicateNeed.discovery.needGain>=0,'same-position package need gain remains finite and nonnegative');}
console.log('trade-candidate-source-tests: all checks passed');
