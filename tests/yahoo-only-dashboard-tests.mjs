import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
const file='data/private/yahoo-only-test-input.json',out='data/private/yahoo-only-test-output.html';
try{
 fs.mkdirSync('data/private',{recursive:true});
 fs.writeFileSync(file,JSON.stringify({source:{provider:'yahoo',leagueKey:'test'},currentWeek:7,teams:[{name:'<script>alert(1)</script>',rank:1,wins:3,losses:2,ties:0,roster:[{name:'Test & Player',position:'QB'}]}],schedule:[]}));
 const run=spawnSync(process.execPath,['scripts/build-yahoo-only-dashboard.mjs',file,out],{encoding:'utf8'});
 assert.equal(run.status,0,run.stderr);
 const html=fs.readFileSync(out,'utf8');
 assert.match(html,/snapshot week 7/i);
 assert.match(html,/no trusted projection data/i);
 assert.match(html,/&lt;script&gt;/);
 assert.doesNotMatch(html,/<script>alert/);
 assert.match(html,/Test &amp; Player/);
 const rejected=spawnSync(process.execPath,['scripts/build-yahoo-only-dashboard.mjs',file,'public.html'],{encoding:'utf8'});
 assert.notEqual(rejected.status,0);
 console.log('yahoo-only-dashboard-tests: passed');
}finally{for(const p of [file,out])fs.rmSync(p,{force:true});}
