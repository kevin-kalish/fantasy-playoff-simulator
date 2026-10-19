import assert from 'node:assert/strict';
import {extractYahooRosterWeeklyScores} from '../src/data/yahoo-weekly-player-scores.js';
const response={fantasy_content:{team:[{}, {roster:{players:{0:{player:[[{player_key:'470.p.123'},{name:{full:'Test Player'}},{display_position:'RB'},{editorial_team_abbr:'NE'}],{player_points:{coverage_type:'week',week:'1',total:'14.25'}}]},count:1}}}]}};
const result=extractYahooRosterWeeklyScores(response,{season:2026,week:1,teamKey:'470.l.1.t.1'});
assert.equal(result.rows.length,1);
assert.equal(result.rows[0].actual,14.25);
assert.equal(result.rows[0].playerId,'470.p.123');
assert.equal(extractYahooRosterWeeklyScores({fantasy_content:{}},{season:2026,week:1}).rows.length,0);
console.log('yahoo-weekly-player-scores-tests: all checks passed');
