import assert from 'node:assert/strict';
import {makeLocalDashboardHandler} from '../scripts/serve-private-dashboard.mjs';
const token='secret-session';
const handler=makeLocalDashboardHandler({token,loadReport:()=>({readiness:{ready:false}})});
function call(method,url,host='127.0.0.1:9999'){
 const headers={};let status,body='';
 handler({method,url,headers:{host}}, {writeHead:(s,h)=>{status=s;Object.assign(headers,h)},end:x=>{body=x??''}});
 return {status,headers,body};
}
assert.equal(call('GET','/?token=secret-session','evil.example').status,403);
assert.equal(call('GET','/?token=wrong').status,403);
assert.equal(call('POST','/?token=secret-session').status,404);
assert.equal(call('GET','/data/private/secret.json?token=secret-session').status,404);
assert.equal(call('GET','/?token=secret-session').status,503);
assert.equal(call('GET','/?token=secret-session').headers['Cache-Control'],'no-store');
console.log('private-dashboard-server-tests: all checks passed');
