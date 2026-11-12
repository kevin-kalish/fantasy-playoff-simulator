import assert from 'node:assert/strict';
import {futureReplacementProjectionWeeks} from '../src/model/future-replacement-projection-horizon.js';
const args={currentWeek:10,loadedWeeks:[10,11,12],gapWeeks:[14,13,12,14,15],playoffWeeks:[15,16,17]};
assert.deepEqual(futureReplacementProjectionWeeks(args),[13,14]);
assert.deepEqual(futureReplacementProjectionWeeks({...args,maxExtraWeeks:1}),[13]);
assert.deepEqual(futureReplacementProjectionWeeks({...args,maxExtraWeeks:0}),[]);
assert.deepEqual(futureReplacementProjectionWeeks({...args,currentWeek:14}),[]);
assert.deepEqual(futureReplacementProjectionWeeks({...args,maxExtraWeeks:5}),[]);
console.log('future-replacement-projection-horizon-tests: all checks passed');
