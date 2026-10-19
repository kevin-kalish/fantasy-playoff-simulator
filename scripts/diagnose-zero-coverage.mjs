import fs from 'node:fs';
import {auditYahooScoresWithOverrides} from '../src/data/yahoo-scoring-with-overrides.js';
const load=p=>{const v=JSON.parse(fs.readFileSync(p,'utf8'));if(!Array.isArray(v.rows))throw new Error('Missing rows: '+p);return v.rows;};
const nfl=load('data/private/historical-actuals.json');
const yahoo=load('data/private/yahoo-player-actuals.json');
const overridePath='data/private/yahoo-identity-overrides.json';
const overrides=fs.existsSync(overridePath)?JSON.parse(fs.readFileSync(overridePath,'utf8')):[];
const report=auditYahooScoresWithOverrides(nfl,yahoo,{overrides});
const key=r=>[Number(r.season),Number(r.week),String(r.yahooPlayerId??r.playerId)].join('|');
const matched=new Set([...report.compared,...report.exceptionAudit.reviewedMatches].map(key));
const individual=yahoo.filter(r=>String(r.position).toUpperCase()!=='DEF');
const remaining=individual.filter(r=>!matched.has(key(r)));
const nflPlayerIds=new Set(nfl.map(r=>String(r.playerId)));
const normalize=s=>String(s??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim().replace(/(?:[\s.,]+)(?:jr|sr|ii|iii|iv|v)\.?$/i,'').replace(/[^a-z0-9]/g,'');
const playerNamePos=r=>normalize(r.name)+'|'+String(r.position).toUpperCase();
const nflByNamePos=new Map();
for(const r of nfl){const k=playerNamePos(r);if(!nflByNamePos.has(k))nflByNamePos.set(k,new Set());nflByNamePos.get(k).add(String(r.playerId));}
const details=remaining.map(y=>{
 const candidates=[...(nflByNamePos.get(playerNamePos(y))??[])];
 const sameWeek=nfl.filter(n=>Number(n.season)===Number(y.season)&&Number(n.week)===Number(y.week)&&playerNamePos(n)===playerNamePos(y));
 return {season:y.season,week:y.week,name:y.name,position:y.position,yahooPlayerId:y.playerId,yahooActual:Number(y.actual),yahooTeam:y.nflTeam,category:sameWeek.length?'same-week-name-position-team-disagreement':candidates.length?'known-player-no-same-week-record':'no-name-position-identity-in-nflverse',candidatePlayerIds:candidates,sameWeekTeams:sameWeek.map(n=>n.nflTeam)};
});
const counts={};for(const d of details)counts[d.category]=(counts[d.category]??0)+1;
const result={schemaVersion:1,summary:{totalIndividuals:individual.length,matched:matched.size,remaining:details.length,nonzeroRemaining:details.filter(r=>r.yahooActual!==0).length,categories:counts},details,note:'Coverage classifications are diagnostic only. No zero scores are automatically validated or matched.'};
const output='data/private/yahoo-zero-coverage-diagnostics.json';
fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n');
console.log('ZERO COVERAGE: '+JSON.stringify(result.summary));
console.log('ZERO COVERAGE: '+output);
if(result.summary.nonzeroRemaining)process.exitCode=2;
