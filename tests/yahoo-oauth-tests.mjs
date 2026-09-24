import assert from 'node:assert/strict';
import {yahooAuthorizationUrl,exchangeYahooAuthorizationCode,refreshYahooAccessToken} from '../src/data/yahoo-oauth.js';
const u=new URL(yahooAuthorizationUrl({clientId:'abc',redirectUri:'oob',state:'xyz'}));
assert.equal(u.hostname,'api.login.yahoo.com');assert.equal(u.searchParams.get('client_id'),'abc');assert.equal(u.searchParams.get('response_type'),'code');assert.equal(u.searchParams.get('state'),'xyz');
let request;
const fetchImpl=async(url,opts)=>{request={url,opts};return{ok:true,json:async()=>({access_token:'a',refresh_token:'r',expires_in:3600})}};
let t=await exchangeYahooAuthorizationCode({code:'code1',clientId:'id',clientSecret:'secret',fetchImpl});assert.equal(t.access_token,'a');assert.ok(request.opts.body.toString().includes('grant_type=authorization_code'));assert.ok(request.opts.headers.Authorization.startsWith('Basic '));
t=await refreshYahooAccessToken({refreshToken:'r1',clientId:'id',clientSecret:'secret',fetchImpl});assert.equal(t.refresh_token,'r');assert.ok(request.opts.body.toString().includes('grant_type=refresh_token'));assert.ok(request.opts.body.toString().includes('refresh_token=r1'));
console.log('yahoo-oauth-tests: all checks passed');
