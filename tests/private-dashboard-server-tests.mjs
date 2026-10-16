import assert from 'node:assert/strict';
import {makeLocalDashboardHandler} from '../scripts/serve-private-dashboard.mjs';
const token='secret-session';
let started=0;const controller={status:()=>({phase:'idle'}),refresh:()=>{started++;return true}};
const handler=makeLocalDashboardHandler({token,loadReport:()=>({readiness:{ready:false}}),controller});
function call(method,url,host='127.0.0.1:9999',extra={}){
 const headers={};let status,body='';
 handler({method,url,headers:{host,...extra}}, {writeHead:(s,h)=>{status=s;Object.assign(headers,h)},end:x=>{body=x??''}});
 return {status,headers,body};
}
assert.equal(call('GET','/?token=secret-session','evil.example').status,403);
assert.equal(call('GET','/?token=wrong').status,403);
assert.equal(call('POST','/?token=secret-session').status,404);
assert.equal(call('GET','/data/private/secret.json?token=secret-session').status,404);
assert.equal(call('GET','/?token=secret-session').status,503);
assert.equal(call('GET','/?token=secret-session').headers['Cache-Control'],'no-store');
assert.equal(call('GET','/status?token=secret-session').status,200);
assert.equal(call('POST','/refresh?token=secret-session').status,403);
assert.equal(call('POST','/refresh','127.0.0.1:9999',{origin:'http://evil.example','x-private-session':token}).status,403);
assert.equal(call('POST','/refresh','127.0.0.1:9999',{origin:'http://127.0.0.1:9999','x-private-session':token}).status,202);
assert.equal(started,1);
console.log('private-dashboard-server-tests: all checks passed');
