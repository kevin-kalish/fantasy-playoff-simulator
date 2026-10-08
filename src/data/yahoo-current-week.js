import {yahooProperties,yahooValue} from './yahoo-normalize.js';

function leagueNode(node){
 if(!node||typeof node!=='object')return null;
 if(Array.isArray(node)){for(const item of node){const found=leagueNode(item);if(found)return found}return null}
 if(node.league!=null)return yahooProperties(node.league);
 for(const value of Object.values(node)){const found=leagueNode(value);if(found)return found}
 return null;
}
export function parseYahooCurrentWeek(payload){
 const league=leagueNode(payload?.fantasy_content);
 const raw=yahooValue(league?.current_week);
 const week=Number(raw);
 if(!Number.isInteger(week)||week<1||week>18)throw new Error('Yahoo league metadata did not provide a valid current_week (1–18). Set WEEK explicitly if the league is not active.');
 return week;
}
export async function fetchYahooCurrentWeek(get,leagueKey){
 if(!leagueKey)throw new Error('Yahoo league key required for current week');
 return parseYahooCurrentWeek(await get(`league/${leagueKey}`));
}
