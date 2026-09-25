import fs from 'node:fs';
import path from 'node:path';
import {loadYahooLeagueSnapshot} from './yahoo-league.js';
import {auditImportedYahooLeague} from './yahoo-reference-bridge.js';

export async function runYahooLeagueAudit(get,{leagueKey,season,week,reference,reportPath}={}){
 if(!reference)throw new Error('Yahoo audit reference is required.');
 const league=await loadYahooLeagueSnapshot(get,{leagueKey,season,week});
 const audit=auditImportedYahooLeague(league,reference);
 const report={generatedAt:new Date().toISOString(),leagueKey,season:Number(season),week:Number(week),passed:audit.passed,checks:audit.checks,failures:audit.failures,actual:audit.actual};
 if(reportPath){fs.mkdirSync(path.dirname(reportPath),{recursive:true});fs.writeFileSync(reportPath,JSON.stringify(report,null,2));}
 return {league,audit,report};
}

export function formatYahooAuditReport(report){
 const lines=[`YAHOO LEAGUE AUDIT: ${report.passed?'PASS':'FAIL'}`,`League ${report.leagueKey} | season ${report.season} | week ${report.week}`];
 for(const c of report.checks)lines.push(`${c.code.padEnd(30,'.')} ${c.pass?'PASS':'FAIL'}${c.pass?'':`  expected=${JSON.stringify(c.expected)} observed=${JSON.stringify(c.observed)}`}`);
 if(report.failures.length)lines.push(`BLOCKED: ${report.failures.length} reconciliation check(s) failed.`);
 else lines.push('SAFE TO PROCEED: all reference reconciliation checks passed.');
 return lines.join('\n');
}
