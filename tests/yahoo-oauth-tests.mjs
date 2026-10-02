import assert from 'node:assert/strict';
import {createYahooPkce,yahooAuthorizationUrl,exchangeYahooAuthorizationCode,refreshYahooAccessToken} from '../src/data/yahoo-oauth.js';

const pkce=createYahooPkce();
assert.ok(pkce.codeVerifier.length>=43&&pkce.codeVerifier.length<=128);
assert.equal(pkce.codeChallengeMethod,'S256');
const u=new URL(yahooAuthorizationUrl({clientId:'abc',redirectUri:'oob',state:'xyz',nonce:'nonce',codeChallenge:pkce.codeChallenge}));
assert.equal(u.hostname,'api.login.yahoo.com');assert.equal(u.searchParams.get('client_id'),'abc');assert.equal(u.searchParams.get('response_type'),'code');assert.equal(u.searchParams.get('state'),'xyz');assert.equal(u.searchParams.get('code_challenge'),pkce.codeChallenge);assert.equal(u.searchParams.get('code_challenge_method'),'S256');
let request;
const fetchImpl=async(url,opts)=>{request={url,opts};return{ok:true,json:async()=>({access_token:'a',refresh_token:'r',expires_in:3600})}};
let t=await exchangeYahooAuthorizationCode({code:'code1',clientId:'id',clientSecret:'secret',fetchImpl});assert.equal(t.access_token,'a');assert.ok(request.opts.body.toString().includes('grant_type=authorization_code'));assert.ok(request.opts.headers.Authorization.startsWith('Basic '));
t=await exchangeYahooAuthorizationCode({code:'code2',clientId:'public-id',codeVerifier:'verifier',fetchImpl});assert.equal(t.access_token,'a');assert.equal(request.opts.headers.Authorization,undefined);assert.ok(request.opts.body.toString().includes('client_id=public-id'));assert.ok(request.opts.body.toString().includes('code_verifier=verifier'));
t=await refreshYahooAccessToken({refreshToken:'r1',clientId:'public-id',fetchImpl});assert.equal(t.refresh_token,'r');assert.equal(request.opts.headers.Authorization,undefined);assert.ok(request.opts.body.toString().includes('grant_type=refresh_token'));assert.ok(request.opts.body.toString().includes('refresh_token=r1'));assert.ok(request.opts.body.toString().includes('client_id=public-id'));
console.log('yahoo-oauth-tests: all checks passed');
