import crypto from 'node:crypto';

const AUTH='https://api.login.yahoo.com/oauth2/request_auth';
const TOKEN='https://api.login.yahoo.com/oauth2/get_token';
const base64url=value=>Buffer.from(value).toString('base64url');

export function createYahooPkce(){
 const codeVerifier=base64url(crypto.randomBytes(48));
 const codeChallenge=crypto.createHash('sha256').update(codeVerifier).digest('base64url');
 return {codeVerifier,codeChallenge,codeChallengeMethod:'S256'};
}

export function yahooAuthorizationUrl({clientId,redirectUri='oob',state,nonce,language='en-us',codeChallenge,codeChallengeMethod='S256'}={}){
 if(!clientId)throw new Error('Yahoo clientId is required.');
 const q=new URLSearchParams({client_id:clientId,redirect_uri:redirectUri,response_type:'code',language});
 if(state)q.set('state',state);
 if(nonce)q.set('nonce',nonce);
 if(codeChallenge){q.set('code_challenge',codeChallenge);q.set('code_challenge_method',codeChallengeMethod);}
 return `${AUTH}?${q}`;
}

async function tokenRequest(body,{clientId,clientSecret,fetchImpl=fetch}={}){
 if(!clientId)throw new Error('Yahoo clientId is required.');
 const headers={'Content-Type':'application/x-www-form-urlencoded',Accept:'application/json'};
 const form=new URLSearchParams(body);
 if(clientSecret){headers.Authorization=`Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`;}
 else form.set('client_id',clientId);
 const r=await fetchImpl(TOKEN,{method:'POST',headers,body:form});
 if(!r.ok)throw new Error(`Yahoo OAuth token request failed (${r.status}): ${await r.text()}`);
 return r.json();
}

export function exchangeYahooAuthorizationCode({code,redirectUri='oob',clientId,clientSecret,codeVerifier,fetchImpl}={}){
 if(!code)throw new Error('Yahoo authorization code is required.');
 const body={grant_type:'authorization_code',redirect_uri:redirectUri,code};
 if(codeVerifier)body.code_verifier=codeVerifier;
 return tokenRequest(body,{clientId,clientSecret,fetchImpl});
}

export function refreshYahooAccessToken({refreshToken,redirectUri='oob',clientId,clientSecret,fetchImpl}={}){
 if(!refreshToken)throw new Error('Yahoo refresh token is required.');
 return tokenRequest({grant_type:'refresh_token',redirect_uri:redirectUri,refresh_token:refreshToken},{clientId,clientSecret,fetchImpl});
}
