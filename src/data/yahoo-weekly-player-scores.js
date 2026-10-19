import {yahooProperties,yahooValue} from './yahoo-normalize.js';
const prop=node=>yahooProperties(node);
function find(node,key){
 if(!node||typeof node!=='object')return null;
 if(Array.isArray(node)){for(const v of node){const x=find(v,key);if(x!==null)return x;}return null;}
 if(Object.hasOwn(node,key))return node[key];
 for(const v of Object.values(node)){const x=find(v,key);if(x!==null)return x;}
 return null;
}
export function extractYahooRosterWeeklyScores(json,{season,week,teamKey}={}){
 const players=find(json?.fantasy_content,'players'),rows=[],rejected=[];
 if(!players||typeof players!=='object')return {rows,rejected:[{reason:'players-collection-missing'}]};
 for(const [index,entry] of Object.entries(players)){
  if(index==='count')continue;
  const raw=entry?.player??entry;
  const player=prop(raw),name=prop(player.name);
  const stats=prop(find(raw,'player_points')??{});
  const total=yahooValue(stats.total);
  const id=String(yahooValue(player.player_key??player.player_id)??'').trim();
  const fullName=String(yahooValue(name.full)??'').trim();
  const actual=total!==null&&total!==undefined&&total!==''?Number(total):NaN;
  if(!id||!fullName||!Number.isFinite(actual)){
   rejected.push({index,reason:'missing-player-id-name-or-weekly-points'});continue;
  }
  rows.push({season:Number(season),week:Number(week),playerId:id,name:fullName,position:String(yahooValue(player.display_position??player.primary_position)??'').split(',')[0].toUpperCase(),nflTeam:String(yahooValue(player.editorial_team_abbr)??'').toUpperCase(),actual,source:'yahoo-roster-weekly-points',fantasyTeamKey:teamKey});
 }
 return {rows,rejected};
}
