import fs from 'node:fs';
import path from 'node:path';
import {reconcileYahooNflverseScores} from '../src/data/yahoo-nflverse-score-audit.js';
import {auditIdentityExceptions} from '../src/data/yahoo-identity-exceptions.js';
const nflPath='data/private/historical-actuals.json',yahooPath='data/private/yahoo-player-actuals.json',out='data/private/yahoo-nflverse-score-audit.json';
const overridePath='data/private/yahoo-identity-overrides.json';
try{
 const read=p=>{const data=JSON.parse(fs.readFileSync(p,'utf8'));if(!Array.isArray(data.rows))throw new Error('Missing rows in '+p);return data.rows;};
 const nfl=read(nflPath),yahoo=read(yahooPath);
 const overrides=fs.existsSync(overridePath)?JSON.parse(fs.readFileSync(overridePath,'utf8')):[];
 if(!Array.isArray(overrides))throw new Error('Identity override file must be a JSON array');
 const exceptionAudit=auditIdentityExceptions(nfl,yahoo,{overrides});
 const base=reconcileYahooNflverseScores(nfl,yahoo.filter(r=>String(r.position).toUpperCase()!=='DEF'));
 const baseKeys=new Set(base.mismatches.map(r=>[r.season,r.week,r.yahooPlayerId].join('|')));
 // A reviewed exception must not overlap an already matched identity or another exception.
 const matchedBaseIds=new Set();
 for(const y of yahoo){
  if(String(y.position).toUpperCase()==='DEF')continue;
  const key=[y.season,y.week,y.playerId].join('|');
  if(!base.unmatched.some(u=>u.identity.startsWith([Number(y.season),Number(y.week)].join('|')+'|'))&&!baseKeys.has(key)){
   // Exact matched identities are established from the unique matched player records.
   const n=nfl.filter(n=>Number(n.season)===Number(y.season)&&Number(n.week)===Number(y.week)&&String(n.position).toUpperCase()===String(y.position).toUpperCase()&&String(n.nflTeam).toUpperCase()===String(y.nflTeam).toUpperCase()&&String(n.name).normalize('NFKD').toLowerCase().replace(/[^a-z0-9]/g,'')===String(y.name).normalize('NFKD').toLowerCase().replace(/[^a-z0-9]/g,''));
   if(n.length===1)matchedBaseIds.add(key);
  }
 }
 const rejected=[...exceptionAudit.rejected];
 const approved=[];
 for(const m of exceptionAudit.reviewedMatches){
  const k=[m.season,m.week,m.yahooPlayerId].join('|');
  if(matchedBaseIds.has(k)){rejected.push({override:m,reason:'already-matched-in-base-audit'});continue;}
  if(!Number.isFinite(m.scoreDifference)){rejected.push({override:m,reason:'invalid-score'});continue;}
  approved.push({...m,withinTolerance:Math.abs(m.scoreDifference)<=base.tolerance});
 }
 const remaining=base.unmatched.filter(u=>!approved.some(m=>u.identity.startsWith([Number(m.season),Number(m.week)].join('|')+'|')&&u.identity.includes(String(m.yahooPlayerId))===false));
 const report={...base,exceptionAudit:{excludedDefenses:exceptionAudit.excludedDefenses,individualRows:exceptionAudit.individualRows,reviewedMatches:approved,rejected},summary:{...base.summary,excludedDefenses:exceptionAudit.excludedDefenses,reviewedMatches:approved.length,reviewedScoreMismatches:approved.filter(m=>!m.withinTolerance).length},note:'Base scoring remains provisional. Explicit reviewed mappings are separately audited; no calibration parameters modified.'};
 fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');
 console.log('CROSS-PROVIDER SCORES: '+base.summary.compared+' provisional base matches; '+base.summary.mismatches+' base mismatches; '+base.summary.unmatched+' unmatched individual records.');
 console.log('CROSS-PROVIDER EXCEPTIONS: '+approved.length+' reviewed; '+rejected.length+' rejected; '+exceptionAudit.excludedDefenses+' defenses excluded.');
 console.log('CROSS-PROVIDER POSITIONS: '+JSON.stringify(base.byPosition));
 console.log('CROSS-PROVIDER SCORES: '+(base.pass&&rejected.length===0&&approved.every(m=>m.withinTolerance)?'BASE SCORES AGREE; identity provisional':'REVIEW REQUIRED')+'; '+out);
 if(!base.pass||rejected.length||approved.some(m=>!m.withinTolerance))process.exitCode=2;
}catch(e){console.error('CROSS-PROVIDER SCORES: ERROR; '+e.message);process.exitCode=1;}
