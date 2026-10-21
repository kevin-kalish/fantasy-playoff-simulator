// Private, read-only acceptance review. Never uploads or republishes report data.
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
export function auditWeeklyReport(document) {
 const report=document?.report??document;
 const readiness=document?.readiness;
 const findings=[];
 const check=(id,passed,detail,severity='blocker')=>findings.push({id,status:passed?'PASS':severity==='warning'?'WARN':'FAIL',detail});
 check('report-schema',report?.schemaVersion===11,'Expected intelligence schema v11');
 check('simulation-trust',report?.trust?.trusted===true,'Source trust gate must pass');
 check('simulation-readiness',readiness?.ready===true,'Full readiness record must pass');
 const outlook=report?.league?.outlook??[];
 const teams=Number(report?.league?.teamCount);
 check('league-team-count',Number.isInteger(teams)&&teams>1&&outlook.length===teams,'Outlook must cover every league team');
 const valid=p=>typeof p==='number'&&Number.isFinite(p)&&p>=0&&p<=1;
 check('probabilities',outlook.length>0&&outlook.every(t=>valid(t.playoffProbability)&&valid(t.championshipProbability)),'All team odds must be finite probabilities');
 check('championship-mass',Math.abs(outlook.reduce((sum,t)=>sum+(Number(t.championshipProbability)||0),0)-1)<0.002,'Championship probabilities should sum to 1');
 const coverage=readiness?.projectionCoverage?.matchRate;
 check('projection-coverage',typeof coverage==='number'&&coverage>=.9,'At least 90% usable roster-week projections');
 check('lineup-completeness',Array.isArray(readiness?.incompleteLineups)&&readiness.incompleteLineups.length===0,'No incomplete optimized lineups');
 check('simulation-count',Number(report?.outlook?.simulations)>=50000,'At least 50,000 core simulations');
 check('postseason-trust-label',report?.trust?.postseason?.trusted===true||report?.outlook?.championshipTrusted===false,'Derived postseason odds must not be labeled trusted');
 // Dashboard acceptance is stricter than core simulation readiness.
 const schedule=report?.remainingSchedule;
 check('dashboard-schedule',Array.isArray(schedule)&&schedule.length>0&&
   schedule.every(g=>Number.isInteger(g.week)&&g.week>=1&&g.week<=18&&
     String(g.opponentId??'').trim().length>0)),
   'Remaining schedule must be supplied for complete dashboard acceptance');
 const warnings=readiness?.warnings??[];
 check('empirical-calibration',!warnings.some(w=>/no empirical calibration/i.test(w)),'Historical calibration is missing', 'warning');
 check('injury-calibration',!warnings.some(w=>/uncalibrated heuristic play probabilities/i.test(w)),'Injury play probabilities are heuristic', 'warning');
 check('nfl-context',!warnings.some(w=>/no NFL game context/i.test(w)),'NFL game correlation context is missing', 'warning');
 check('postseason-direct',report?.trust?.postseason?.trusted===true,'Postseason projections remain provisional', 'warning');
 check('dashboard-leverage',Array.isArray(schedule)&&schedule.length>0&&
   schedule.every(g=>g.playoffImpact&&Number.isFinite(g.playoffImpact.swing)),
   'Conditional schedule leverage is missing or incomplete','warning');
 const gm=report?.recommendations??{};
 check('gm-confirmation',Number(gm.confirmation?.passedCount??0)<=Number(gm.confirmation?.evaluatedCount??0),'Confirmation counts must be consistent');
 const seedValidation=document?.seedValidation;
 const seedTeam=seedValidation?.teams?.find(t=>String(t.id)===String(report?.team?.id));
 const seedPass=seedValidation?.method==='independent-seed-replication'&&seedValidation?.runCount>=3&&seedValidation?.simulationsPerRun>=50000&&seedTeam?.stability?.playoffWithinTolerance===true&&seedTeam?.stability?.championshipWithinTolerance===true;
 check('live-independent-seeds',Boolean(seedPass),seedPass?'Three or more independent 50,000-run seeds passed sampling stability':'Independent-seed live rerun and odds stability comparison still required','warning');
 check('browser-acceptance',false,'Private live browser smoke test still required','warning');
 return {status:findings.some(x=>x.status==='FAIL')?'FAIL':findings.some(x=>x.status==='WARN')?'REVIEW_REQUIRED':'PASS',findings,summary:{passed:findings.filter(x=>x.status==='PASS').length,failed:findings.filter(x=>x.status==='FAIL').length,warnings:findings.filter(x=>x.status==='WARN').length},generatedAt:report?.generatedAt??null};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const path=process.argv[2];if(!path)throw new Error('Usage: npm run review:readiness -- data/private/fightin-kali-week-5-report.json');
 const review=auditWeeklyReport(JSON.parse(fs.readFileSync(path,'utf8')));
 for(const f of review.findings)console.log(`${f.status.padEnd(5)} ${f.id}: ${f.detail}`);
 console.log(`READINESS REVIEW: ${review.status}; ${review.summary.passed} passed, ${review.summary.failed} failed, ${review.summary.warnings} warnings.`);
 if(review.status==='FAIL')process.exitCode=2;
}
