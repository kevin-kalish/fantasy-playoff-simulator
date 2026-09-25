import assert from 'node:assert/strict';
import fs from 'node:fs';
import {loadYahooLeagueSnapshot} from '../src/data/yahoo-league.js';
import {auditImportedYahooLeague} from '../src/data/yahoo-reference-bridge.js';
import {get,leagueKey,currentWeek} from '../fixtures/yahoo-api-reference-week3.mjs';

const reference=JSON.parse(fs.readFileSync(new URL('../fixtures/yahoo-reference-2026-week3.json',import.meta.url),'utf8'));
const league=await loadYahooLeagueSnapshot(get,{leagueKey,season:2026,week:currentWeek});
assert.equal(league.teams.length,10);
const kali=league.teams.find(t=>t.name==='The Fightin’ Kali');
assert.ok(kali);assert.equal(kali.points,177.54);assert.equal(kali.pointsAgainst,237.20);assert.equal(kali.rank,10);assert.equal(kali.waiverPriority,10);assert.equal(kali.moves,1);
assert.equal(league.playoffSpots,8);assert.deepEqual(league.playoffWeeks,[15,16,17]);assert.equal(league.reseed,true);assert.equal(league.playoffTiebreaker,'higher-seed');
const audit=auditImportedYahooLeague(league,reference);
assert.equal(audit.passed,true,JSON.stringify(audit.failures,null,2));
console.log('yahoo-api-reference-integration-tests: all checks passed');
