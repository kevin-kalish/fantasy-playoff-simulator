// Provider-free manual browser acceptance harness. Never invokes Yahoo or projection APIs.
// Uses the existing local trusted report, but simulates refresh failures only.
import http from 'node:http';
import {randomBytes} from 'node:crypto';
import {makeLocalDashboardHandler,latestReport} from './serve-private-dashboard.mjs';

try { latestReport(); } catch {
  console.error('A readiness-passing local private report is required before running this harness.');
  process.exit(1);
}
let state={phase:'idle',startedAt:null,finishedAt:null,error:null};
let busy=false;
const controller={
  status:()=>({...state}),
  refresh:()=>{
    if(busy)return false;
    busy=true;
    state={phase:'running',startedAt:new Date().toISOString(),finishedAt:null,error:null};
    setTimeout(()=>{
      state={...state,phase:'failed',finishedAt:new Date().toISOString(),
        error:'Simulated provider failure (acceptance test). Previous report preserved. You may retry.'};
      busy=false;
    },1200);
    return true;
  }
};
const token=randomBytes(32).toString('hex');
const server=http.createServer(makeLocalDashboardHandler({token,loadReport:latestReport,controller}));
server.listen(0,'127.0.0.1',()=>{
  const port=server.address().port;
  console.log('PROVIDER-FREE FAILURE ACCEPTANCE: http://127.0.0.1:'+port+'/?token='+token);
  console.log('This harness NEVER contacts Yahoo/JerryGM or changes report files.');
  console.log('Open URL locally, note report timestamp, click Refresh Yahoo data.');
  console.log('Expect simulated failure text, existing report still visible, and button enabled for retry.');
  console.log('Click again to verify retry. Ctrl+C stops harness. Do not share URL.');
});
