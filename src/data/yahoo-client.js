const API='https://fantasysports.yahooapis.com/fantasy/v2';

export function createYahooClient({accessToken,fetchImpl=fetch}={}){
 if(!accessToken) throw new Error('Yahoo access token is required.');
 return async function get(path){
  const separator=path.includes('?')?'&':'?';
  const response=await fetchImpl(`${API}/${path}${separator}format=json`,{headers:{Authorization:`Bearer ${accessToken}`,Accept:'application/json'}});
  if(!response.ok) throw new Error(`Yahoo Fantasy request failed (${response.status}): ${await response.text()}`);
  return response.json();
 };
}

export async function discoverYahooNflLeagues(get,{season}={}){
 const path=`users;use_login=1/games;game_codes=nfl${season?`;seasons=${season}`:''}/leagues`;
 const json=await get(path),found=[];
 const walk=node=>{if(!node||typeof node!=='object')return;if(Array.isArray(node)){node.forEach(walk);return}if(node.league&&Array.isArray(node.league)){const p=Object.assign({},...node.league.filter(x=>x&&typeof x==='object'&&!Array.isArray(x)));if(p.league_key)found.push({leagueKey:String(p.league_key),leagueId:String(p.league_id||''),name:String(p.name||''),season:Number(p.season||season||0)})}Object.values(node).forEach(walk)};
 walk(json?.fantasy_content);
 return [...new Map(found.map(x=>[x.leagueKey,x])).values()];
}
