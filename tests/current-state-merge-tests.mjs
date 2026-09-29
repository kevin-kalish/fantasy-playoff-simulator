import assert from 'node:assert/strict';
import {mergeCurrentState,summarizeCurrentStatePatch} from '../src/data/current-state-merge.js';
import {validateLeagueSnapshot} from '../src/data/league-snapshot.js';

const base={source:{provider:'manual'},teams:[{id:'1',name:"The Fightin' Kali",wins:2,losses:1,ties:0,points:300,lineup:[]}],schedule:[{week:4,matchups:[]}],nflGames:[]};
const patch={capturedAt:'2026-09-28T13:00:00Z',teams:[{name:"The Fightin' Kali",wins:3,losses:1,points:412.5,rank:2}],schedule:[{week:5,matchups:[]}]};
const merged=mergeCurrentState(base,patch);
assert.equal(merged.teams[0].wins,3);
assert.equal(merged.teams[0].losses,1);
assert.equal(merged.teams[0].points,412.5);
assert.equal(merged.teams[0].rank,2);
assert.equal(merged.schedule[0].week,5);
assert.equal(merged.source.capturedAt,patch.capturedAt);
assert.deepEqual(summarizeCurrentStatePatch(patch),{teamsUpdated:1,scheduleReplaced:true,nflGamesReplaced:false,capturedAt:patch.capturedAt});
assert.throws(()=>mergeCurrentState(base,{teams:[{name:'Missing Team',wins:1}]}),/unknown team/);

const realWorldBase={source:{provider:'manual',season:2026},playoffSpots:2,playoffWeeks:[15,16,17],teams:[
 {id:'the-fightin-kali',name:"The Fightin' Kali",wins:1,losses:2,roster:[{name:'Josh Allen',position:'QB',team:'BUF'}],lineup:[]},
 {id:'aili-s-football-guys',name:'AiLi’s Football Guys',wins:1,losses:2,roster:[{name:'Example Back',position:'RB',team:'NE'}],lineup:[]},
 {id:'the-kalish-kabana',name:'THE KALISH KABANA!!!!',wins:2,losses:1,roster:[{name:'Example Wideout',position:'WR',team:'NYJ'}],lineup:[]}
],schedule:[{week:3,matchups:[['the-fightin-kali','aili-s-football-guys']]}]};
const realWorldPatch={provider:'manual-capture',currentWeek:4,teams:[
 {name:"The Fightin’ Kali",wins:2,losses:2,roster:[{name:'Josh Allen',position:'QB',team:'BUF'}]},
 {name:"AiLi's Football Guys",wins:1,losses:3},
 {name:'THE KALISH KABANA!!!!',wins:3,losses:1}
],schedule:[{week:4,matchups:[["The Fightin' Kali",'THE KALISH KABANA!!!!']]}]};
const realWorldMerged=mergeCurrentState(realWorldBase,realWorldPatch);
assert.deepEqual(realWorldMerged.schedule[0].matchups[0],['the-fightin-kali','the-kalish-kabana']);
assert.equal(realWorldMerged.currentWeek,4);
assert.equal(realWorldMerged.source.currentWeek,4);
assert.equal(realWorldMerged.teams[0].roster.length,1);
assert.equal(validateLeagueSnapshot(realWorldMerged).valid,true);

console.log('current-state-merge-tests: all checks passed');
