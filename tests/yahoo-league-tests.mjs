import assert from 'node:assert/strict';
import {loadYahooLeagueSnapshot} from '../src/data/yahoo-league.js';

const prop=(key,value)=>({[key]:value});
const team=(id,name,wins,losses,points)=>({
 team_key:id,team_id:id.split('.').at(-1),name,
 team_standings:{outcome_totals:{wins:String(wins),losses:String(losses),ties:'0'}},
 team_points:{total:String(points)}
});
const player=(id,name,pos,nflTeam)=>[prop('player_key',id),prop('name',{full:name}),prop('editorial_team_abbr',nflTeam),prop('display_position',pos)];
const collection=(key,rows)=>Object.fromEntries([...rows.map((row,i)=>[String(i),{[key]:Array.isArray(row)?row:Object.entries(row).map(([k,v])=>prop(k,v))}]),['count',rows.length]]);
const rosterPayload=players=>({fantasy_content:{team:[{}, {roster:{players:collection('player',players)}}]}});
const matchup=(week,a,b)=>({week:String(week),teams:collection('team',[{team_key:a},{team_key:b}])});

const settings={playoff_start_week:'15',num_playoff_teams:'2',uses_playoff_reseeding:'1'};
const rawTeams=[team('461.l.1.t.1','Alpha',7,3,1100),team('461.l.1.t.2','Beta',6,4,1050)];
const rosters={
 '461.l.1.t.1':[player('461.p.1','Alpha QB','QB','BUF'),player('461.p.2','Alpha WR','WR','MIN')],
 '461.l.1.t.2':[player('461.p.3','Beta QB','QB','KC'),player('461.p.4','Beta RB','RB','PHI')]
};
function scoreJson(week){return {fantasy_content:{league:[{}, {scoreboard:{matchups:collection('matchup',[matchup(week,'461.l.1.t.1','461.l.1.t.2')])}}]}}}
const calls=[];
async function get(path){
 calls.push(path);
 if(path==='league/461.l.1/settings')return {fantasy_content:{league:[{league_key:'461.l.1'},{season:'2025'},{settings}]}};
 if(path==='league/461.l.1/teams')return {fantasy_content:{league:[{}, {teams:collection('team',rawTeams)}]}};
 const sm=path.match(/scoreboard;week=(\d+)/);if(sm)return scoreJson(Number(sm[1]));
 const rm=path.match(/^team\/(.+)\/roster;week=(\d+)$/);if(rm)return rosterPayload(rosters[rm[1]]);
 throw new Error(`Unexpected fixture request: ${path}`);
}
const league=await loadYahooLeagueSnapshot(get,{leagueKey:'461.l.1',season:2025,week:11});
assert.equal(league.source.provider,'yahoo');assert.equal(league.source.leagueId,'461.l.1');assert.equal(league.source.season,2025);
assert.equal(league.teams.length,2);assert.equal(league.teams[0].wins,7);assert.equal(league.teams[0].lineup.length,2);
assert.deepEqual(league.schedule.map(x=>x.week),[11,12,13,14]);assert.equal(league.schedule[0].matchups[0][0],'461.l.1.t.1');
assert.equal(league.playoffSpots,2);assert.deepEqual(league.playoffWeeks,[15,16,17]);assert.equal(league.reseed,true);
assert.deepEqual(Object.keys(league.teams[0].weeklyLineups),['11','12','13','14']);
assert.ok(calls.includes('league/461.l.1/scoreboard;week=14'));assert.ok(calls.includes('team/461.l.1.t.2/roster;week=14'));
console.log('yahoo-league-tests: all checks passed');
