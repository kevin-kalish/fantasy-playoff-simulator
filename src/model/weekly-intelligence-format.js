const pct=value=>`${(100*Number(value??0)).toFixed(1)}%`;
const n=value=>Number.isFinite(Number(value))?Number(value):0;

export function formatWeeklyIntelligence(report,{maxActions=5}={}){
 const lines=[];
 const record=report.team.record;
 lines.push(`WEEKLY INTELLIGENCE: ${report.team.name} — Week ${report.matchup.week}`);
 lines.push(`Record ${record.wins}-${record.losses}${record.ties?`-${record.ties}`:''} | Seed #${report.team.currentSeed} | Playoffs ${pct(report.outlook.playoffProbability)} | Title ${pct(report.outlook.championshipProbability)}`);
 lines.push(`Matchup vs ${report.matchup.opponentName}: win ${pct(report.matchup.simulated.winProbability)} | ${report.leverage.posture} posture | ${report.leverage.urgency} urgency`);
 const p=report.trust.projections;
 const coverage=p.coverage?.matchRate;
 lines.push(`Data: ${p.provider??'unknown'}${p.degraded?' [FALLBACK]':''}${Number.isFinite(Number(coverage))?` | projection coverage ${pct(coverage)}`:''} | trust ${report.trust.trusted?'PASS':'REVIEW'}`);
 if(report.recommendations.items?.length){
  lines.push('Actions:');
  for(const item of report.recommendations.items.slice(0,maxActions)) lines.push(`  ${item.rank}. [${item.type}] ${item.summary}`);
 } else lines.push('Actions: none identified.');
 const starters=report.roster.starters||[];
 const projected=starters.reduce((sum,p)=>sum+n(p.projection),0);
 lines.push(`Starting lineup: ${starters.length} players | ${projected.toFixed(1)} projected points`);
 return lines.join('\n');
}
