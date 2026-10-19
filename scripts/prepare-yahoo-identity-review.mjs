import fs from 'node:fs';
import path from 'node:path';
import {reconcileYahooNflverseScores} from '../src/data/yahoo-nflverse-score-audit.js';
const nfl=JSON.parse(fs.readFileSync('data/private/historical-actuals.json','utf8')).rows;
const yahoo=JSON.parse(fs.readFileSync('data/private/yahoo-player-actuals.json','utf8')).rows;
const normalize=s=>String(s??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
const base=reconcileYahooNflverseScores(nfl,yahoo.filter(r=>String(r.position).toUpperCase()!=='DEF'));
const usedYahoo=new Set(base.compared.map(r=>[r.season,r.week,r.yahooPlayerId].join('|')));
const usedNfl=new Set(base.compared.map(r=>[r.season,r.week,r.nflversePlayerId].join('|')));
const candidates=[];
for(const y of yahoo){
 if(String(y.position).toUpperCase()==='DEF'||usedYahoo.has([y.season,y.week,y.playerId].join('|')))continue;
 const matches=nfl.filter(n=>Number(n.season)===Number(y.season)&&Number(n.week)===Number(y.week)&&normalize(n.name)===normalize(y.name)&&String(n.position).toUpperCase()===String(y.position).toUpperCase());
 if(matches.length!==1)continue;
 const n=matches[0],k=[n.season,n.week,n.playerId].join('|');
 if(usedNfl.has(k))continue;
 candidates.push({season:y.season,week:y.week,name:y.name,yahooPlayerId:y.playerId,nflversePlayerId:n.playerId,yahooTeam:y.nflTeam,nflverseTeam:n.nflTeam,yahooActual:y.actual,nflverseActual:n.actual,scoreDifference:Number(n.actual)-Number(y.actual),reason:'unique-name-position-week-team-difference',reviewed:false});
}
const output='data/private/yahoo-identity-review-candidates.json';
fs.mkdirSync(path.dirname(output),{recursive:true});
fs.writeFileSync(output,JSON.stringify({schemaVersion:1,candidateCount:candidates.length,candidates,note:'Candidates only, NOT approved overrides. Verify player IDs and transaction timing independently. Never auto-apply.'},null,2)+'\n');
console.log('IDENTITY REVIEW: '+candidates.length+' candidates (not applied).');
console.log('IDENTITY REVIEW: '+JSON.stringify(candidates.slice(0,12).map(({name,week,yahooTeam,nflverseTeam,scoreDifference})=>({name,week,yahooTeam,nflverseTeam,scoreDifference}))));
console.log('IDENTITY REVIEW: private report '+output);
