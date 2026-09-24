import assert from 'node:assert/strict';
import {normalizeLeagueSnapshot,validateLeagueSnapshot,importLeagueSnapshot,LEAGUE_SNAPSHOT_VERSION} from '../src/data/league-snapshot.js';

const raw={provider:'yahoo',leagueId:'12345',season:2026,playoffSpots:4,playoffWeeks:[15,16],teams:[
 {team_id:'1',team_name:'Alpha',wins:7,losses:3,points_for:1012.4,starters:[{player_id:'p1',player_name:'QB One',pos:'qb',team:'BUF',projected_points:22.1}]},
 {team_id:'2',team_name:'Beta',wins:6,losses:4,points_for:990,starters:[{player_id:'p2',player_name:'RB Two',pos:'RB',team:'DET',projected_points:16}]},
 {team_id:'3',team_name:'Gamma',wins:5,losses:5,points_for:970,starters:[{player_id:'p3',player_name:'WR Three',pos:'WR',team:'MIN',projected_points:14}]},
 {team_id:'4',team_name:'Delta',wins:4,losses:6,points_for:940,starters:[{player_id:'p4',player_name:'TE Four',pos:'TE',team:'KC',projected_points:10}]}
],schedule:[{week:11,games:[{home:'1',away:'2'},{home:'3',away:'4'}]},{week:12,matchups:[['1','3'],['2','4']]}]};
const normalized=normalizeLeagueSnapshot(raw);
assert.equal(normalized.schemaVersion,LEAGUE_SNAPSHOT_VERSION);assert.equal(normalized.source.provider,'yahoo');assert.equal(normalized.teams[0].lineup[0].projection,22.1);assert.equal(normalized.teams[0].lineup[0].position,'QB');assert.deepEqual(normalized.schedule[0].matchups[0],['1','2']);
const valid=validateLeagueSnapshot(raw);assert.equal(valid.valid,true);assert.equal(importLeagueSnapshot(JSON.stringify(raw)).league.teams.length,4);
const unknown=structuredClone(raw);unknown.schedule[0].matchups=[['1','999']];assert.equal(validateLeagueSnapshot(unknown).valid,false);assert.match(validateLeagueSnapshot(unknown).errors.join(' '),/unknown team/);
const duplicate=structuredClone(raw);duplicate.teams[1].team_id='1';assert.equal(validateLeagueSnapshot(duplicate).valid,false);
const badPosition=structuredClone(raw);badPosition.teams[0].starters[0].pos='FLEX';assert.equal(validateLeagueSnapshot(badPosition).valid,false);
assert.throws(()=>importLeagueSnapshot({teams:[],schedule:[]}),/Invalid league snapshot/);
console.log('league-snapshot-tests: all checks passed');
