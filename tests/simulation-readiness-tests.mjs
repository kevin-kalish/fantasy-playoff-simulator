import assert from 'node:assert/strict';
import {assessSimulationReadiness} from '../src/model/simulation-readiness.js';
const base={diagnostics:{projectionCoverage:{total:100,matched:94,bye:2,missing:4,usable:96,matchRate:.96,weeks:[11,12]},incompleteLineups:[],lineupSlots:['QB','RB']},input:{teams:[{id:'A'},{id:'B'}],schedule:[{week:11}],playoffWeeks:[15,16,17],modelVariant:'correlated',simulations:50000,seed:1,calibration:{bias:{}},nflGames:[{}]}};
let r=assessSimulationReadiness(base);assert.equal(r.ready,true);assert.deepEqual(r.errors,[]);
r=assessSimulationReadiness({...base,diagnostics:{...base.diagnostics,projectionCoverage:{...base.diagnostics.projectionCoverage,matchRate:.89}}});assert.equal(r.ready,false);assert.match(r.errors[0],/Projection coverage/);
r=assessSimulationReadiness({...base,diagnostics:{...base.diagnostics,incompleteLineups:[{teamId:'A',week:11}]}});assert.equal(r.ready,false);assert.match(r.errors[0],/incomplete/);
r=assessSimulationReadiness({...base,input:{...base.input,calibration:null,nflGames:[]}});assert.equal(r.ready,true);assert.equal(r.warnings.length,2);
console.log('simulation-readiness-tests: all checks passed');
