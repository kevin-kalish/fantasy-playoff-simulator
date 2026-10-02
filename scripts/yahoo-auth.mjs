import fs from 'node:fs';
import crypto from 'node:crypto';
import readline from 'node:readline/promises';
import {stdin as input,stdout as output} from 'node:process';
import {createYahooPkce,yahooAuthorizationUrl,exchangeYahooAuthorizationCode} from '../src/data/yahoo-oauth.js';

const clientId=process.env.YAHOO_CLIENT_ID;
const clientSecret=process.env.YAHOO_CLIENT_SECRET;
const redirectUri=process.env.YAHOO_REDIRECT_URI??'oob';
if(!clientId){console.error('YAHOO AUTH: YAHOO_CLIENT_ID is not configured.');process.exit(2)}

const publicClient=!clientSecret;
const pkce=publicClient?createYahooPkce():null;
const state=crypto.randomBytes(24).toString('base64url');
const nonce=crypto.randomBytes(24).toString('base64url');
console.log(`\nYAHOO AUTH: ${publicClient?'public client (PKCE)':'confidential client'} mode.`);
console.log(`Redirect URI: ${redirectUri}`);
console.log('This exact Redirect URI must be registered on the Yahoo app.');
console.log('\nOpen this Yahoo authorization URL in your browser:\n');
console.log(yahooAuthorizationUrl({clientId,redirectUri,state,nonce,codeChallenge:pkce?.codeChallenge,codeChallengeMethod:pkce?.codeChallengeMethod}));
console.log('\nAuthorize the application. Then paste either the authorization code or the full redirected URL below.');
const rl=readline.createInterface({input,output});
let supplied;
try{supplied=(await rl.question('Yahoo authorization code / redirected URL: ')).trim();}finally{rl.close();}
if(!supplied){console.error('YAHOO AUTH: no authorization response supplied.');process.exit(2)}
let code=supplied;
try{const u=new URL(supplied);const returnedState=u.searchParams.get('state');if(returnedState&&returnedState!==state)throw new Error('Yahoo OAuth state mismatch.');code=u.searchParams.get('code')??'';}catch(error){if(error.message==='Yahoo OAuth state mismatch.'){console.error(`YAHOO AUTH: ${error.message}`);process.exit(2)}}
if(!code){console.error('YAHOO AUTH: no authorization code found.');process.exit(2)}

let token;
try{token=await exchangeYahooAuthorizationCode({code,redirectUri,clientId,clientSecret,codeVerifier:pkce?.codeVerifier});}
catch(error){console.error(`YAHOO AUTH: token exchange failed; ${error.message}`);process.exit(2)}
if(!token?.refresh_token){console.error('YAHOO AUTH: Yahoo did not return a refresh token.');process.exit(2)}

fs.mkdirSync('data/private',{recursive:true});
const session={refreshToken:token.refresh_token,accessToken:token.access_token??null,expiresIn:token.expires_in??null,clientType:publicClient?'public':'confidential',createdAt:new Date().toISOString()};
fs.writeFileSync('data/private/yahoo-auth-session.json',JSON.stringify(session,null,2)+'\n',{mode:0o600});
console.log('\nYAHOO AUTH: authorization complete.');
console.log('Refresh credentials saved to data/private/yahoo-auth-session.json.');
console.log('Next: npm run fightin-kali:weekly');
