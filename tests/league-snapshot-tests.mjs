import assert from 'node:assert/strict';
import {normalizeLeagueSnapshot,validateLeagueSnapshot} from '../src/data/league-snapshot.js';
const raw={source:{provider:'manual',season:2025},teams:[{id:'A',lineup:[{name:'QB A',position:'QB'}]},{id:'B',lineup:[{name:'QB B',position:'QB'}]}],schedule:[{week:12,matchups:[['A','B']]}],playoffSpots:2,lineupSlots:['qb','rb','rb','wr','wr','te','rb/wr/te','k','def']};
const normalized=normalizeLeagueSnapshot(raw);
assert.deepEqual(normalized.lineupSlots,['QB','RB','RB','WR','WR','TE','RB/WR/TE','K','DEF']);
const checked=validateLeagueSnapshot(raw);assert.equal(checked.valid,true);assert.deepEqual(checked.league.lineupSlots,normalized.lineupSlots);
console.log('league-snapshot-tests: all checks passed');
