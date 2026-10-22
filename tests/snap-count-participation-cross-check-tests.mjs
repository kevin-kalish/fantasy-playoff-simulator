import assert from 'node:assert/strict';
import {compareRosterToSnapCounts} from '../src/data/snap-count-participation-cross-check.js';
const report={schemaVersion:1,records:[
 {season:2026,week:5,yahooPlayerId:'470.p.1',name:'Example Player',nflTeam:'JAX',position:'RB',reviewBucket:'reserveSnapshot'},
 {season:2026,week:5,yahooPlayerId:'470.p.2',name:'No Snap',nflTeam:'CHI',position:'WR',reviewBucket:'inactiveSnapshot'},
 {season:2026,week:5,yahooPlayerId:'470.p.3',name:'Ambiguous Player',nflTeam:'NE',position:'QB',reviewBucket:'activeZero'}
]};
const snaps=[
 {season:'2026',week:'5',player:'Example Player',team:'JAC',position:'RB',offense_snaps:'0',defense_snaps:'0',st_snaps:'4'},
 {season:'2026',week:'5',player:'Ambiguous Player',team:'NE',position:'QB',offense_snaps:'1',defense_snaps:'0',st_snaps:'0'},
 {season:'2026',week:'5',player:'Ambiguous Player',team:'NE',position:'QB',offense_snaps:'1',defense_snaps:'0',st_snaps:'0'}
];
const out=compareRosterToSnapCounts(report,snaps);
assert.deepEqual(out.records.map(x=>x.classification),['positive-snaps-name-match','no-snap-match','ambiguous-snap-match']);
assert.equal(out.records[0].totalSnaps,4);
assert.ok(out.records.every(x=>!x.verified && !x.evidenceEligible && !x.identityVerified));
const zero=compareRosterToSnapCounts({schemaVersion:1,records:[report.records[0]]},[{...snaps[0],st_snaps:'0'}]);
assert.equal(zero.records[0].classification,'zero-snaps-name-match');
assert.throws(()=>compareRosterToSnapCounts(report,null),/Invalid/);
console.log('snap-count-participation-cross-check-tests: all checks passed');
