import assert from 'node:assert/strict';
import {prepareFightinKaliSnapshot,applyFightinKaliConfig} from '../src/data/fightin-kali-snapshot.js';

const config={season:2026,leagueId:'244897',teamName:"The Fightin’ Kali",teamAliases:["The Fightin' Kali","The Fightin’ Kali"],playoffs:{spots:8,weeks:[15,16,17],reseed:true,tieBreaker:'higher-seed'},defaults:{simulations:50000,seed:20260923}};
const teams=Array.from({length:10},(_,i)=>({id:`T${i+1}`,name:i===0?"The Fightin' Kali":`Team ${i+1}`,wins:i===0?0:1,losses:i===0?2:1,points:100+i,roster:[{id:`P${i}`,name:`QB ${i}`,position:'QB',nflTeam:'BUF'}]}));
const snapshot={source:{provider:'manual',season:2026},teams,schedule:[{week:3,matchups:[["T1","T2"],["T3","T4"],["T5","T6"],["T7","T8"],["T9","T10"]]}],playoffSpots:4,playoffWeeks:[14],reseed:false,tiebreaker:'points'};
const prepared=prepareFightinKaliSnapshot(snapshot,config);
assert.equal(prepared.validation.valid,true);
assert.equal(prepared.team.id,'T1');
assert.equal(prepared.league.playoffSpots,8);
assert.deepEqual(prepared.league.playoffWeeks,[15,16,17]);
assert.equal(prepared.league.reseed,true);
assert.equal(prepared.league.playoffTiebreaker,'higher-seed');
assert.equal(prepared.league.simulations,50000);
assert.equal(prepared.state.currentWeek,3);
assert.equal(prepared.state.ready,true);

// A newly fetched Yahoo state must replace stale local standings/roster data while
// preserving the configured league rules used by downstream weekly analysis.
const live=structuredClone(snapshot);
live.source={provider:'yahoo',season:2026,leagueKey:'470.l.244897',currentWeek:4};
live.currentWeek=4;
live.teams[0].wins=2;live.teams[0].losses=2;live.teams[0].points=477.25;
live.teams[0].roster=[{id:'LIVE1',name:'Live Yahoo QB',position:'QB',nflTeam:'BUF'}];
live.schedule=[{week:4,matchups:[["T1","T3"],["T2","T4"],["T5","T6"],["T7","T8"],["T9","T10"]]}];
const refreshed=applyFightinKaliConfig(live,config);
const kali=refreshed.teams.find(t=>t.id==='T1');
assert.equal(refreshed.source.provider,'yahoo');
assert.equal(refreshed.source.leagueKey,'470.l.244897');
assert.equal(refreshed.currentWeek,4);
assert.equal(kali.wins,2);assert.equal(kali.losses,2);assert.equal(kali.points,477.25);
assert.equal(kali.roster[0].id,'LIVE1');
assert.deepEqual(refreshed.schedule[0].matchups[0],['T1','T3']);
assert.equal(refreshed.playoffSpots,8);assert.deepEqual(refreshed.playoffWeeks,[15,16,17]);
console.log('fightin-kali-snapshot-tests: all checks passed');
