const API='https://fantasysports.yahooapis.com/fantasy/v2';

export function createYahooClient({accessToken,fetchImpl=fetch,maxRetries=2,retryDelayMs=400,sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms))}={}){
 if(!Number.isInteger(maxRetries)||maxRetries<0||maxRetries>3)throw new Error('Yahoo maxRetries must be 0–3.');
 if(!Number.isInteger(retryDelayMs)||retryDelayMs<0||retryDelayMs>5000)throw new Error('Yahoo retryDelayMs must be 0–5000.');

 if(!accessToken) throw new Error('Yahoo access token is required.');
 return async function get(path){
  const separator=path.includes('?')?'&':'?';
  for(let attempt=0;attempt<=maxRetries;attempt++){
   let response;
   try{
    response=await fetchImpl(`${API}/${path}${separator}format=json`,{headers:{Authorization:`Bearer ${accessToken}`,Accept:'application/json'}});
   }catch(error){
    // Only retry network transport failures, never JSON parsing or authentication errors.
    if(attempt===maxRetries)throw new Error('Yahoo Fantasy transport failed after '+(attempt+1)+' attempt(s): '+error.message);
    await sleep(retryDelayMs*2**attempt);
    continue;
   }
   if(response.ok)return response.json();
   if(![502,503,504].includes(response.status)||attempt===maxRetries){
    const body=String(await response.text()).slice(0,500);
    throw new Error(`Yahoo Fantasy request failed (${response.status}) after ${attempt+1} attempt(s): ${body}`);
   }
   await sleep(retryDelayMs*2**attempt);
  }
 };
}

export async function discoverYahooNflLeagues(get,{season}={}){
 const path=`users;use_login=1/games;game_codes=nfl${season?`;seasons=${season}`:''}/leagues`;
 const json=await get(path),found=[];
 const walk=node=>{if(!node||typeof node!=='object')return;if(Array.isArray(node)){node.forEach(walk);return}if(node.league&&Array.isArray(node.league)){const p=Object.assign({},...node.league.filter(x=>x&&typeof x==='object'&&!Array.isArray(x)));if(p.league_key)found.push({leagueKey:String(p.league_key),leagueId:String(p.league_id||''),name:String(p.name||''),season:Number(p.season||season||0)})}Object.values(node).forEach(walk)};
 walk(json?.fantasy_content);
 return [...new Map(found.map(x=>[x.leagueKey,x])).values()];
}
