import assert from 'node:assert/strict';
import { diagnoseUnmatchedYahooPlayers } from '../src/data/yahoo-unmatched-diagnostics.js';

const n = {
  season: 2026, week: 1, playerId: 'n1',
  name: 'Example Player', position: 'WR',
  nflTeam: 'NE', actual: 10
};

const y = {
  season: 2026, week: 1, playerId: 'y1',
  name: 'Example Player', position: 'WR',
  nflTeam: 'NE', actual: 10
};

// Existing identity-matching tests
assert.equal(diagnoseUnmatchedYahooPlayers([n], [y]).unmatched, 0);
assert.equal(diagnoseUnmatchedYahooPlayers([n], [{ ...y, nflTeam: 'NYJ' }]).reasons['team-disagreement'], 1);
assert.equal(diagnoseUnmatchedYahooPlayers([n], [{ ...y, position: 'RB' }]).reasons['position-disagreement'], 1);
assert.equal(diagnoseUnmatchedYahooPlayers([n], [{ ...y, name: 'Different Player' }]).reasons['name-or-roster-coverage'], 1);
assert.equal(diagnoseUnmatchedYahooPlayers([], [y]).reasons['no-nflverse-week'], 1);
assert.equal(diagnoseUnmatchedYahooPlayers([n, { ...n, playerId: 'n2' }], [y]).reasons['ambiguous-exact-identity'], 1);

// Schedule fixture
const scheduleRows = [{
  season: 2026,
  week: 6,
  home_team: 'NE',
  away_team: 'NYJ',
  kickoffAt: '2026-10-18T17:00:00.000Z'
}];

// Pending finalization
const pending = diagnoseUnmatchedYahooPlayers(
  [],
  [{ ...y, week: 6 }],
  { scheduleRows, asOf: '2026-10-20T16:00:00.000Z' }
);

assert.equal(pending.unmatched, 1);
assert.equal(pending.reasons['pending-finalization'], 1);
assert.equal(pending.details[0].reason, 'pending-finalization');

// Finalization window expired
const expired = diagnoseUnmatchedYahooPlayers(
  [],
  [{ ...y, week: 6 }],
  { scheduleRows, asOf: '2026-10-25T16:00:00.000Z' }
);

assert.equal(expired.reasons['no-nflverse-week'], 1);

// Verified bye week
const verifiedBye = diagnoseUnmatchedYahooPlayers(
  [],
  [{ ...y, week: 6, nflTeam: 'DET', actual: 0 }],
  {
    scheduleRows,
    asOf: '2026-10-20T16:00:00.000Z',
    verifiedScheduleWeeks: [{ season: 2026, week: 6 }]
  }
);

assert.equal(verifiedBye.unmatched, 1);
assert.equal(verifiedBye.reasons['bye-week-no-game'], 1);

// Unverified schedule must not establish a bye
const unverifiedBye = diagnoseUnmatchedYahooPlayers(
  [],
  [{ ...y, week: 6, nflTeam: 'DET', actual: 0 }],
  { scheduleRows, asOf: '2026-10-20T16:00:00.000Z' }
);

assert.equal(unverifiedBye.reasons['no-nflverse-week'], 1);

console.log('yahoo-unmatched-diagnostics-tests: all checks passed');