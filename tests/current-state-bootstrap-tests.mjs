import assert from 'node:assert/strict';
import {bootstrapCurrentState} from '../src/data/current-state-bootstrap.js';

const config={season:2026,leagueId:'244897',teamName:'The Fightin’ Kali',teamAliases:["The Fightin' Kali",'The Fightin’ Kali'],lineup:{QB:1,RB:2,WR:2,TE:1,'W/R/T':1,K:1,DEF:1,BN:6,IR:2},playoffs:{spots:2,weeks:[15,16,17],reseed:true,tieBreaker:'higher-seed'},defaults:{simulations:50000,seed:20260923}};
const capture={capturedAt:'2026-09-28T12:00:00Z',teams:[{name:"The Fightin' Kali",wins:0,losses:2,ties:0,points:177.54,pointsAgainst:237.2,rank:2,roster:[{name:'Drake Maye',position:'QB',nflTeam:'NE',lineupSlot:'QB'},{name:'Brandon Aubrey',position:'K',nflTeam:'DAL',lineupSlot:'K'},{name:'Texans',position:'DEF',nflTeam:'HOU',lineupSlot:'DEF'}]},{name:'Alpha',wins:2,losses:0,ties:0,points:299.48,pointsAgainst:191.26,rank:1}],schedule:[{week:3,matchups:[["The Fightin' Kali",'Alpha']]}]};
const prepared=bootstrapCurrentState(capture,config);
assert.equal(prepared.validation.valid,true);
assert.equal(prepared.team.wins,0);
assert.equal(prepared.team.roster.length,3);
assert.deepEqual(prepared.league.schedule[0].matchups,[[prepared.team.id,'alpha']]);
assert.equal(prepared.league.playoffTiebreaker,'higher-seed');
assert.equal(prepared.league.source.week,3);
assert.equal(prepared.state.currentWeek,3);
assert.throws(()=>bootstrapCurrentState({...capture,teams:[capture.teams[1]]},config),/Configured team not found/);
console.log('current-state-bootstrap-tests: all checks passed');
