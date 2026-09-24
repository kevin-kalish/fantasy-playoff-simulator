import assert from 'node:assert/strict';
import {createYahooClient,discoverYahooNflLeagues} from '../src/data/yahoo-client.js';
import {yahooCollection,yahooPlayer,yahooStanding,buildYahooSnapshot} from '../src/data/yahoo-normalize.js';

const player=yahooPlayer([{player_key:'461.p.1'},{name:{full:'Test Player'}},{editorial_team_abbr:'NE'},{display_position:'WR'}]);
assert.equal(player.name,'Test Player');assert.equal(player.position,'WR');assert.equal(player.nflTeam,'NE');
assert.deepEqual(yahooStanding({team_standings:{outcome_totals:{wins:'7',losses:'3',ties:'0'}},team_points:{total:'1234.5'}}),{wins:7,losses:3,ties:0,points:1234.5});
assert.equal(yahooCollection({0:{team:[{team_key:'1'},{name:'A'}]},count:1},'team')[0].name,'A');
const snapshot=buildYahooSnapshot({source:{leagueId:'461.l.1',season:2025},teams:[{id:'1',name:'A',lineup:[player]},{id:'2',name:'B',lineup:[{...player,id:'2'}]}],schedule:[{week:11,matchups:[['1','2']]}],playoffSpots:2});
assert.equal(snapshot.source.provider,'yahoo');assert.equal(snapshot.teams.length,2);
let requested='';const get=createYahooClient({accessToken:'test-token',fetchImpl:async(url,opts)=>{requested=url;assert.equal(opts.headers.Authorization,'Bearer test-token');return{ok:true,json:async()=>({fantasy_content:{users:{0:{user:[{}, {games:{0:{game:[{}, {leagues:{0:{league:[{league_key:'461.l.99'},{league_id:'99'},{name:'Test League'},{season:'2025'}]},count:1}}]}}]}}}}})}}});
const leagues=await discoverYahooNflLeagues(get,{season:2025});assert.ok(requested.includes('game_codes=nfl'));assert.equal(leagues[0].leagueKey,'461.l.99');
console.log('yahoo-tests: all checks passed');
