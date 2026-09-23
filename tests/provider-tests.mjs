import assert from 'node:assert/strict';
import {buildPlayerIdMap} from '../src/data/player-id-map.js';
import {normalizeFantasyProsProjection,assessProjectionArchive} from '../src/data/fantasypros-adapter.js';
const ids=buildPlayerIdMap([{gsis_id:'00-1',fantasypros_id:'123',yahoo_id:'456',espn_id:'789',name:'Test Player',team:'NE'}]);
assert.deepEqual(ids.resolve({fantasyProsId:123}),{playerId:'00-1',matchedBy:'fantasypros'});assert.equal(ids.resolve({yahooId:456}).playerId,'00-1');assert.equal(ids.resolve({name:'Test Player',team:'NE'}).playerId,'00-1');
const p=normalizeFantasyProsProjection({fpid:123,name:'Test Player',position_id:'WR',team_id:'NE',rec_rec:6,rec_yds:100,rec_tds:1},{season:2025,week:3,idMap:ids});assert.equal(p.playerId,'00-1');assert.equal(p.projection,24); // 3 half-PPR + 10 yards + 6 TD + 5 100-yard bonus
const a=assessProjectionArchive([{fpid:1,pass_yds:250,pass_tds:2}]);assert.equal(a.hasPointProjections,true);assert.equal(a.hasUnderlyingStats,true);
console.log('provider-tests: all checks passed');
