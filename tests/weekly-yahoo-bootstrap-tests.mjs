import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Run in a temporary working directory so no developer OAuth session can leak into this test.
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'yahoo-bootstrap-'));
try{
 const missing=path.join(dir,'never-created.json');
 const script=path.resolve('scripts/run-fightin-kali-weekly.mjs');
 const config=path.resolve('config/fightin-kali-2026.json');
 fs.mkdirSync(path.join(dir,'config'),{recursive:true});
 fs.copyFileSync(config,path.join(dir,'config/fightin-kali-2026.json'));
 const env={...process.env,YAHOO_ACCESS_TOKEN:'',YAHOO_REFRESH_TOKEN:'',YAHOO_CLIENT_ID:'',YAHOO_CLIENT_SECRET:''};
 const result=spawnSync(process.execPath,[script,missing],{cwd:dir,env,encoding:'utf8'});
 assert.equal(result.status,2);
 assert.match(result.stderr,/Yahoo authentication unavailable/);
 assert.doesNotMatch(result.stderr,/snapshot not found/);
 assert.equal(fs.existsSync(missing),false);
 console.log('weekly-yahoo-bootstrap-tests: all checks passed');
}finally{fs.rmSync(dir,{recursive:true,force:true});}
