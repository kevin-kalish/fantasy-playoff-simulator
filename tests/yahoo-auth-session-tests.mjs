import assert from 'node:assert/strict';
import {resolveYahooAccessToken} from '../src/data/yahoo-auth-session.js';

let result=await resolveYahooAccessToken({YAHOO_ACCESS_TOKEN:'existing'});
assert.equal(result.accessToken,'existing');
assert.equal(result.source,'environment');

result=await resolveYahooAccessToken({});
assert.equal(result.accessToken,null);
assert.match(result.reason,/YAHOO_REFRESH_TOKEN/);

result=await resolveYahooAccessToken({YAHOO_REFRESH_TOKEN:'refresh-only'});
assert.equal(result.accessToken,null);
assert.match(result.reason,/YAHOO_CLIENT_ID/);

let request;
const fetchImpl=async(url,opts)=>{request={url,opts};return{ok:true,json:async()=>({access_token:'fresh-access',refresh_token:'fresh-refresh',expires_in:3600})}};
result=await resolveYahooAccessToken({YAHOO_REFRESH_TOKEN:'refresh',YAHOO_CLIENT_ID:'id'},{fetchImpl});
assert.equal(result.accessToken,'fresh-access');
assert.equal(result.source,'refresh');
assert.equal(result.expiresIn,3600);
assert.equal(result.refreshToken,'fresh-refresh');
assert.equal(request.opts.headers.Authorization,undefined);
assert.ok(request.opts.body.toString().includes('client_id=id'));
assert.ok(request.opts.body.toString().includes('grant_type=refresh_token'));

console.log('yahoo-auth-session-tests: all checks passed');
