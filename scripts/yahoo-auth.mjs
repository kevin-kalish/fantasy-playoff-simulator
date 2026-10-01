import fs from 'node:fs';
import readline from 'node:readline/promises';
import {stdin as input,stdout as output} from 'node:process';
import {yahooAuthorizationUrl,exchangeYahooAuthorizationCode} from '../src/data/yahoo-oauth.js';

const clientId=process.env.YAHOO_CLIENT_ID;
const clientSecret=process.env.YAHOO_CLIENT_SECRET;
const redirectUri=process.env.YAHOO_REDIRECT_URI??'oob';
if(!clientId){console.error('YAHOO AUTH: YAHOO_CLIENT_ID is not configured.');process.exit(2)}
if(!clientSecret){console.error('YAHOO AUTH: YAHOO_CLIENT_SECRET is not configured. Set it locally, then rerun npm run yahoo:auth.');process.exit(2)}

console.log('\nOpen this Yahoo authorization URL in your browser:\n');
console.log(yahooAuthorizationUrl({clientId,redirectUri}));
console.log('\nAuthorize the application, then paste the authorization code below.');
const rl=readline.createInterface({input,output});
let code;
try{code=(await rl.question('Yahoo authorization code: ')).trim();}finally{rl.close();}
if(!code){console.error('YAHOO AUTH: no authorization code supplied.');process.exit(2)}

let token;
try{token=await exchangeYahooAuthorizationCode({code,redirectUri,clientId,clientSecret});}
catch(error){console.error(`YAHOO AUTH: token exchange failed; ${error.message}`);process.exit(2)}
if(!token?.refresh_token){console.error('YAHOO AUTH: Yahoo did not return a refresh token.');process.exit(2)}

fs.mkdirSync('data/private',{recursive:true});
const session={refreshToken:token.refresh_token,accessToken:token.access_token??null,expiresIn:token.expires_in??null,createdAt:new Date().toISOString()};
fs.writeFileSync('data/private/yahoo-auth-session.json',JSON.stringify(session,null,2)+'\n',{mode:0o600});
console.log('\nYAHOO AUTH: authorization complete.');
console.log('Refresh credentials saved to data/private/yahoo-auth-session.json.');
console.log('Next: npm run fightin-kali:weekly');
