import fs from 'node:fs';
import {refreshYahooAccessToken} from './yahoo-oauth.js';

const DEFAULT_SESSION_PATH='data/private/yahoo-auth-session.json';
function readLocalSession(path=DEFAULT_SESSION_PATH){
 try{return JSON.parse(fs.readFileSync(path,'utf8'));}catch(error){if(error?.code==='ENOENT')return null;throw error;}
}

export async function resolveYahooAccessToken(env=process.env,{fetchImpl,sessionPath=DEFAULT_SESSION_PATH}={}){
 if(env.YAHOO_ACCESS_TOKEN)return {accessToken:env.YAHOO_ACCESS_TOKEN,source:'environment'};
 const local=readLocalSession(sessionPath);
 const refreshToken=env.YAHOO_REFRESH_TOKEN??local?.refreshToken;
 const clientId=env.YAHOO_CLIENT_ID;
 const clientSecret=env.YAHOO_CLIENT_SECRET;
 if(!refreshToken)return {accessToken:null,source:'unavailable',reason:'Yahoo access token absent; YAHOO_REFRESH_TOKEN not configured and no local Yahoo auth session found. Run npm run yahoo:auth.'};
 if(!clientId||!clientSecret)return {accessToken:null,source:'unavailable',reason:'Yahoo refresh token is configured, but YAHOO_CLIENT_ID/YAHOO_CLIENT_SECRET are missing.'};
 const token=await refreshYahooAccessToken({refreshToken,clientId,clientSecret,redirectUri:env.YAHOO_REDIRECT_URI??'oob',fetchImpl});
 if(!token?.access_token)throw new Error('Yahoo OAuth refresh succeeded without an access token.');
 const nextRefreshToken=token.refresh_token??refreshToken;
 if(local&&sessionPath){
  const updated={...local,refreshToken:nextRefreshToken,accessToken:token.access_token,expiresIn:token.expires_in??null,refreshedAt:new Date().toISOString()};
  fs.writeFileSync(sessionPath,JSON.stringify(updated,null,2)+'\n',{mode:0o600});
 }
 return {accessToken:token.access_token,source:'refresh',expiresIn:token.expires_in??null,refreshToken:nextRefreshToken};
}
