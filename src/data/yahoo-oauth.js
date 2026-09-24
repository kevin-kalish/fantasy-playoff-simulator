const AUTH='https://api.login.yahoo.com/oauth2/request_auth';
const TOKEN='https://api.login.yahoo.com/oauth2/get_token';

export function yahooAuthorizationUrl({clientId,redirectUri='oob',state,language='en-us'}={}){
 if(!clientId)throw new Error('Yahoo clientId is required.');
 const q=new URLSearchParams({client_id:clientId,redirect_uri:redirectUri,response_type:'code',language});
 if(state)q.set('state',state);
 return `${AUTH}?${q}`;
}
async function tokenRequest(body,{clientId,clientSecret,fetchImpl=fetch}={}){
 if(!clientId||!clientSecret)throw new Error('Yahoo clientId and clientSecret are required.');
 const auth=Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
 const r=await fetchImpl(TOKEN,{method:'POST',headers:{Authorization:`Basic ${auth}`,'Content-Type':'application/x-www-form-urlencoded',Accept:'application/json'},body:new URLSearchParams(body)});
 if(!r.ok)throw new Error(`Yahoo OAuth token request failed (${r.status}): ${await r.text()}`);
 return r.json();
}
export function exchangeYahooAuthorizationCode({code,redirectUri='oob',clientId,clientSecret,fetchImpl}={}){
 if(!code)throw new Error('Yahoo authorization code is required.');
 return tokenRequest({grant_type:'authorization_code',redirect_uri:redirectUri,code},{clientId,clientSecret,fetchImpl});
}
export function refreshYahooAccessToken({refreshToken,redirectUri='oob',clientId,clientSecret,fetchImpl}={}){
 if(!refreshToken)throw new Error('Yahoo refresh token is required.');
 return tokenRequest({grant_type:'refresh_token',redirect_uri:redirectUri,refresh_token:refreshToken},{clientId,clientSecret,fetchImpl});
}
