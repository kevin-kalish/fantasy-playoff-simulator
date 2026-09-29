import fs from 'node:fs';
import path from 'node:path';
import {loadYahooLeagueSnapshot} from './yahoo-league.js';
import {auditImportedYahooLeague} from './yahoo-reference-bridge.js';

const benchSlots=new Set(['BN','IR','IL','NA']);
const starterCount=team=>(team?.lineup||[]).filter(player=>!benchSlots.has(String(player?.lineupSlot||'').toUpperCase())).length;

export function auditYahooRosterCompleteness(league,{week}={}){
 const teams=Array.isArray(league?.teams)?league.teams:[];
 const targetWeek=Number(week);
 const checks=[];
 const add=(code,pass,expected,observed)=>checks.push({code,pass:Boolean(pass),expected,observed});
 add('ROSTER_TEAM_COUNT',teams.length>0,'at least 1 team',teams.length);
 const emptyRosters=teams.filter(team=>!(team.roster||[]).length).map(team=>team.id||team.name);
 add('ROSTERS_POPULATED',emptyRosters.length===0,'all teams have roster players',emptyRosters);
 const emptyLineups=teams.filter(team=>starterCount(team)===0).map(team=>team.id||team.name);
 add('CURRENT_LINEUPS_POPULATED',emptyLineups.length===0,'all teams have current starters',emptyLineups);
 if(Number.isInteger(targetWeek)){
  const missingWeekly=teams.filter(team=>!Array.isArray(team.weeklyLineups?.[targetWeek])||team.weeklyLineups[targetWeek].length===0).map(team=>team.id||team.name);
  add('WEEKLY_LINEUPS_POPULATED',missingWeekly.length===0,`all teams have week ${targetWeek} starters`,missingWeekly);
 }
 const failures=checks.filter(check=>!check.pass);
 return {passed:failures.length===0,checks,failures,actual:{teamCount:teams.length,rosterSizes:Object.fromEntries(teams.map(team=>[team.id||team.name,(team.roster||[]).length])),starterCounts:Object.fromEntries(teams.map(team=>[team.id||team.name,starterCount(team)]))}};
}

export async function runYahooLeagueAudit(get,{leagueKey,season,week,reference,reportPath}={}){
 if(!reference)throw new Error('Yahoo audit reference is required.');
 const league=await loadYahooLeagueSnapshot(get,{leagueKey,season,week});
 const audit=auditImportedYahooLeague(league,reference);
 const completeness=auditYahooRosterCompleteness(league,{week});
 const checks=[...audit.checks,...completeness.checks],failures=checks.filter(check=>!check.pass);
 const report={generatedAt:new Date().toISOString(),leagueKey,season:Number(season),week:Number(week),passed:failures.length===0,checks,failures,actual:{...audit.actual,rosterCompleteness:completeness.actual}};
 if(reportPath){fs.mkdirSync(path.dirname(reportPath),{recursive:true});fs.writeFileSync(reportPath,JSON.stringify(report,null,2));}
 return {league,audit:{...audit,passed:report.passed,checks,failures},completeness,report};
}

export function formatYahooAuditReport(report){
 const lines=[`YAHOO LEAGUE AUDIT: ${report.passed?'PASS':'FAIL'}`,`League ${report.leagueKey} | season ${report.season} | week ${report.week}`];
 for(const c of report.checks)lines.push(`${c.code.padEnd(30,'.')} ${c.pass?'PASS':'FAIL'}${c.pass?'':`  expected=${JSON.stringify(c.expected)} observed=${JSON.stringify(c.observed)}`}`);
 if(report.failures.length)lines.push(`BLOCKED: ${report.failures.length} reconciliation check(s) failed.`);
 else lines.push('SAFE TO PROCEED: all reference reconciliation and roster completeness checks passed.');
 return lines.join('\n');
}
