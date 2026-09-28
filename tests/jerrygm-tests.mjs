import assert from 'node:assert/strict';
import {JerryGMClient,normalizeJerryGMProjections} from '../src/data/jerrygm.js';
import {loadWeeklyProjections} from '../src/data/weekly-projection-provider.js';

const payload={season:2026,week:3,players:[{name:'Josh Allen',position:'QB',team:'BUF',projectedPPG:20.06},{name:'Example Back',position:'RB',team:'NE',projectedPPG:12.4}]};
const rows=normalizeJerryGMProjections(payload);assert.equal(rows.length,2);assert.equal(rows[0].projection,20.06);assert.equal(rows[0].source,'jerrygm');assert.equal(rows[0].week,3);
let requested='';const fetchImpl=async(url,opts)=>{requested=String(url);assert.equal(opts.headers['x-api-key'],'jgm-test');return{ok:true,status:200,text:async()=>JSON.stringify(payload)}};
const direct=await new JerryGMClient({apiKey:'jgm-test',fetchImpl}).projections({season:2026,week:3,scoring:'HALF'});assert.equal(direct.players.length,2);assert.match(requested,/week=3/);assert.match(requested,/scoring=half/);
const fallbackFetch=async(url)=>String(url).includes('fantasypros.com')?{ok:false,status:403,statusText:'Forbidden',text:async()=>'{"message":"Forbidden"}'}:{ok:true,status:200,text:async()=>JSON.stringify(payload)};
const result=await loadWeeklyProjections({season:2026,week:3,minimumRows:2,apiKey:'fp-test',jerryGMApiKey:'jgm-test',cachePath:null,fetchImpl:fallbackFetch});assert.equal(result.provider,'jerrygm');assert.equal(result.rows.length,2);assert.equal(result.degraded,true);assert.equal(result.attempts[0].provider,'fantasypros');assert.equal(result.attempts[1].provider,'jerrygm');assert.equal(result.trust.ready,true);
console.log('jerrygm-tests: all checks passed');
