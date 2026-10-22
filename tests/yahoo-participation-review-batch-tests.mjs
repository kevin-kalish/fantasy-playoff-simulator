import assert from 'node:assert/strict';
import {selectParticipationReviewBatch} from '../src/data/yahoo-participation-review-batch.js';
const eligible={season:2026,week:5,name:'Fixture Player',position:'WR',nflTeam:'NE',
  yahooActual:0,reviewPriority:'first',reviewStatus:'unverified',evidenceRequired:true};
const queue={schemaVersion:1,records:[eligible,{...eligible,reviewPriority:'second'}]};
assert.equal(selectParticipationReviewBatch(queue).length,1);
assert.throws(()=>selectParticipationReviewBatch({schemaVersion:1,records:[{...eligible,yahooActual:5}]}),/ineligible/);
assert.throws(()=>selectParticipationReviewBatch({schemaVersion:1,records:[{...eligible,reviewStatus:'verified'}]}),/ineligible/);
assert.throws(()=>selectParticipationReviewBatch({schemaVersion:1,records:[{...eligible,week:6}]}),/ineligible/);
assert.throws(()=>selectParticipationReviewBatch({records:[]}),/Invalid/);
console.log('yahoo-participation-review-batch-tests: all checks passed');
