import assert from 'node:assert/strict';
import {prepareFightinKaliSnapshot} from '../src/data/fightin-kali-snapshot.js';

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
console.log('fightin-kali-snapshot-tests: all checks passed');
