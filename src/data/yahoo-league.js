import {buildYahooSnapshot,yahooCollection,yahooPlayer,yahooStanding,yahooProperties,yahooValue} from './yahoo-normalize.js';

const props=node=>yahooProperties(node);
const val=node=>yahooValue(node);
const num=(v,fallback=0)=>{const n=Number(val(v));return Number.isFinite(n)?n:fallback};

function teamsFrom(json){
 const league=findObject(json?.fantasy_content,'league');
 return yahooCollection(league?.teams,'team');
}
function findObject(node,key){
 if(!node||typeof node!=='object')return null;
 if(Array.isArray(node)){for(const x of node){const r=findObject(x,key);if(r)return r}return null}
 if(node[key])return Array.isArray(node[key])?props(node[key]):node[key];
 for(const x of Object.values(node)){const r=findObject(x,key);if(r)return r}
 return null;
}
function playersFromRoster(json){
 const roster=findObject(json?.fantasy_content,'roster');
 return yahooCollection(roster?.players,'player').map(p=>yahooPlayer(Object.entries(p).map(([k,v])=>({[k]:v}))));
}
function teamKey(t){return String(val(t.team_key)||val(t.team_id)||'')}
function matchupTeams(matchup){
 const teams=yahooCollection(matchup?.teams,'team');
 return teams.map(teamKey).filter(Boolean);
}
function scheduleFrom(json){
 const league=findObject(json?.fantasy_content,'league'),weeks=new Map();
 const matchups=yahooCollection(league?.scoreboard?.matchups,'matchup');
 for(const m of matchups){const week=num(m.week);if(!week)continue;const ids=matchupTeams(m);if(ids.length<2)continue;if(!weeks.has(week))weeks.set(week,[]);weeks.get(week).push(ids.slice(0,2))}
 return [...weeks].sort((a,b)=>a[0]-b[0]).map(([week,matchups])=>({week,matchups}));
}

export async function loadYahooLeagueSnapshot(get,{leagueKey,season,week}={}){
 if(!leagueKey)throw new Error('Yahoo leagueKey is required.');
 const [settingsJson,teamsJson,scoreboardJson]=await Promise.all([
  get(`league/${leagueKey}/settings`),
  get(`league/${leagueKey}/teams`),
  get(`league/${leagueKey}/scoreboard${week?`;week=${week}`:''}`)
 ]);
 const league=findObject(settingsJson?.fantasy_content,'league')||{};
 const settings=league.settings||{};
 const rawTeams=teamsFrom(teamsJson);
 const teams=await Promise.all(rawTeams.map(async t=>{
  const id=teamKey(t),rosterJson=await get(`team/${id}/roster${week?`;week=${week}`:''}`);
  return {id,name:String(val(t.name)||id),...yahooStanding(t),lineup:playersFromRoster(rosterJson)};
 }));
 return buildYahooSnapshot({
  source:{leagueId:leagueKey,season:num(league.season,Number(season)||0),week:Number(week)||0},
  teams,
  schedule:scheduleFrom(scoreboardJson),
  playoffSpots:num(settings.num_playoff_teams,0)
 });
}
