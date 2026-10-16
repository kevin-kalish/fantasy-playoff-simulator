import {yahooCollection,yahooProperties,yahooValue} from './yahoo-normalize.js';

const value=x=>String(yahooValue(x)??'');
function find(node,key){
 if(!node||typeof node!=='object')return null;
 if(!Array.isArray(node)&&Object.hasOwn(node,key))return node[key];
 for(const v of Object.values(node)){const result=find(v,key);if(result!==null)return result;}
 return null;
}
export function verifiedYahooCompletedResult(payload,{week,teamId}={}){
 const scoreboard=find(payload?.fantasy_content,'scoreboard');
 if(!scoreboard)return {status:'unverified',reason:'No Yahoo scoreboard'};
 const matches=yahooCollection(yahooProperties(scoreboard).matchups,'matchup');
 for(const raw of matches){
  const m=yahooProperties(raw);
  if(Number(value(m.week))!==Number(week))continue;
  const teams=yahooCollection(m.teams,'team').map(t=>yahooProperties(t)).map(t=>value(t.team_key)).filter(Boolean);
  if(teams.length!==2||!teams.includes(String(teamId)))continue;
  // Yahoo winner_team_key is a finalized outcome indicator. Never infer
  // from live/in-progress projected points or incomplete scoreboards.
  const winner=value(m.winner_team_key);
  const tied=['1','true'].includes(value(m.is_tied).toLowerCase());
  if(tied&&winner)return {status:'unverified',reason:'Contradictory tie and winner flags'};
  if(tied)return {status:'verified',result:'T'};
  if(!winner||!teams.includes(winner))return {status:'unverified',reason:'Winner not confirmed by Yahoo'};
  return {status:'verified',result:winner===String(teamId)?'W':'L'};
 }
 return {status:'unverified',reason:'Matching completed matchup not found'};
}
