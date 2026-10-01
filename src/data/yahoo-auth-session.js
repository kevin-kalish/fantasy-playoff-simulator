import {refreshYahooAccessToken} from './yahoo-oauth.js';

export async function resolveYahooAccessToken(env=process.env,{fetchImpl}={}){
 if(env.YAHOO_ACCESS_TOKEN)return {accessToken:env.YAHOO_ACCESS_TOKEN,source:'environment'};
 const refreshToken=env.YAHOO_REFRESH_TOKEN;
 const clientId=env.YAHOO_CLIENT_ID;
 const clientSecret=env.YAHOO_CLIENT_SECRET;
 if(!refreshToken)return {accessToken:null,source:'unavailable',reason:'Yahoo access token absent; YAHOO_REFRESH_TOKEN not configured.'};
 if(!clientId||!clientSecret)return {accessToken:null,source:'unavailable',reason:'Yahoo refresh token is configured, but YAHOO_CLIENT_ID/YAHOO_CLIENT_SECRET are missing.'};
 const token=await refreshYahooAccessToken({refreshToken,clientId,clientSecret,redirectUri:env.YAHOO_REDIRECT_URI??'oob',fetchImpl});
 if(!token?.access_token)throw new Error('Yahoo OAuth refresh succeeded without an access token.');
 return {accessToken:token.access_token,source:'refresh',expiresIn:token.expires_in??null,refreshToken:token.refresh_token??refreshToken};
}
