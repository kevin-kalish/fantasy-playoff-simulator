import assert from 'node:assert/strict';
import {normalizeLeagueSnapshot,validateLeagueSnapshot} from '../src/data/league-snapshot.js';
const raw={source:{provider:'manual',season:2025},teams:[{id:'A',lineup:[{name:'QB A',position:'QB'}]},{id:'B',lineup:[{name:'QB B',position:'QB'}]}],schedule:[{week:12,matchups:[['A','B']]}],playoffSpots:2,lineupSlots:['qb','rb','rb','wr','wr','te','rb/wr/te','k','def']};
const normalized=normalizeLeagueSnapshot(raw);
assert.deepEqual(normalized.lineupSlots,['QB','RB','RB','WR','WR','TE','RB/WR/TE','K','DEF']);
const checked=validateLeagueSnapshot(raw);assert.equal(checked.valid,true);assert.deepEqual(checked.league.lineupSlots,normalized.lineupSlots);

 // Provider-independent contract: the same valid league shape must survive either adapter.
for(const provider of ['yahoo','espn']){
 const candidate={...raw,source:{provider,season:2026,currentWeek:7,leagueId:'test-league'}};
 const result=validateLeagueSnapshot(candidate);
 assert.equal(result.valid,true,`${provider}: ${result.errors.join('; ')}`);
 assert.equal(result.league.source.provider,provider);
 assert.equal(result.league.source.currentWeek,7);
 assert.equal(result.league.schedule[0].matchups[0][0],'A');
 assert.equal(result.league.playoffSpots,2);
 assert.deepEqual(result.league.lineupSlots,normalized.lineupSlots);
}
// A missing or invalid schedule must never be accepted as a valid league.
for(const schedule of [[],[{week:12,matchups:[['A','missing']]}],[{week:12,matchups:[['A','A']]}],[{week:12,matchups:[['A','B'],['A','B']]}]]){
 assert.equal(validateLeagueSnapshot({...raw,schedule}).valid,false);
}
// Document current permissive defaults: adapters must verify settings upstream.
const defaults=normalizeLeagueSnapshot({source:{provider:'espn'},teams:raw.teams,schedule:raw.schedule});
assert.equal(defaults.playoffSpots,8);
assert.deepEqual(defaults.playoffWeeks,[15,16,17]);
assert.equal(defaults.teams[0].lineup[0].projection,0);

console.log('league-snapshot-tests: all checks passed');
