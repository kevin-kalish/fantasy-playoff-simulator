import assert from 'node:assert/strict';
import {normalizeNFLVersePlayerWeek} from '../src/data/nflverse-adapter.js';
import {buildHistoricalActuals,joinProjectionsToActuals} from '../src/data/historical-actuals.js';
import {importNflverseActuals} from '../src/data/nflverse-import.js';
const raw={season:2025,week:4,season_type:'REG',player_id:'00-test',player_display_name:'Test QB',position:'QB',team:'NE',opponent_team:'BUF',passing_yards:300,passing_tds:2,interceptions:1,rushing_yards:20,rushing_tds:0,receptions:0,receiving_yards:0,receiving_tds:0};
const n=normalizeNFLVersePlayerWeek(raw);assert.equal(n.playerId,'00-test');assert.equal(n.opponent,'BUF');
const actual=buildHistoricalActuals([raw]);assert.equal(actual.length,1);assert.equal(actual[0].actual,26); // 12 pass yds + 5 bonus + 8 TD -1 INT +2 rush
const j=joinProjectionsToActuals([{season:2025,week:4,playerId:'00-test',position:'QB',projection:22}],actual);assert.equal(j.joined.length,1);assert.equal(j.unmatched.length,0);assert.equal(j.matchRate,1);assert.equal(j.joined[0].actual,26);
const mixed=[raw,{...raw,player_id:'00-wr',player_display_name:'Test WR',position:'WR'},{...raw,player_id:'00-lb',player_display_name:'Test LB',position:'LB'},{...raw,player_id:'00-post',player_display_name:'Post QB',season_type:'POST'}];
const filtered=importNflverseActuals(mixed);assert.equal(filtered.rows.length,2);assert.deepEqual(filtered.rows.map(x=>x.position).sort(),['QB','WR']);assert.equal(filtered.summary.filtered,2);
console.log('nflverse-tests: all checks passed');
