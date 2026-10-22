import {yahooProperties,yahooValue} from './yahoo-normalize.js';

const value=x=>String(yahooValue(x)??'');
function find(node,key){
 if(!node||typeof node!=='object')return null;
 if(!Array.isArray(node)&&Object.hasOwn(node,key))return node[key];
 for(const v of Object.values(node)){const result=find(v,key);if(result!==null)return result;}
 return null;
}
function collect(node,key,out=[]){
 if(!node||typeof node!=='object')return out;
 if(Array.isArray(node)){for(const item of node)collect(item,key,out);return out;}
 for(const [k,v] of Object.entries(node)){if(k===key)out.push(v);else collect(v,key,out);}
 return out;
}
function matchProperties(node){
 if(node?.matchup)return matchProperties(node.matchup);
 return yahooProperties(node);
}
export function verifiedYahooCompletedResult(payload,{week,teamId}={}){
 const scoreboard=find(payload?.fantasy_content,'scoreboard');
 if(!scoreboard)return {status:'unverified',reason:'No Yahoo scoreboard'};
 const scoreboardWeek=Number(value(find(scoreboard,'week')));
 const matches=collect(scoreboard,'matchup');
 if(!matches.length)return {status:'unverified',reason:'No Yahoo matchup entries'};
 for(const raw of matches){
  const m=matchProperties(raw);
  const matchWeek=Number(value(m.week))||scoreboardWeek;
  if(matchWeek!==Number(week))continue;
  const teams=[...new Set(collect(m.teams??raw,'team_key').map(value).filter(Boolean))];
  if(teams.length!==2||!teams.includes(String(teamId)))continue;
  const winner=value(m.winner_team_key);
  const tied=['1','true'].includes(value(m.is_tied).toLowerCase());
  if(tied&&winner)return {status:'unverified',reason:'Contradictory tie and winner flags'};
  if(tied)return {status:'verified',result:'T'};
  if(!winner||!teams.includes(winner))return {status:'unverified',reason:'Winner not confirmed by Yahoo'};
  return {status:'verified',result:winner===String(teamId)?'W':'L'};
 }
 return {status:'unverified',reason:'Matching completed matchup not found'};
}
