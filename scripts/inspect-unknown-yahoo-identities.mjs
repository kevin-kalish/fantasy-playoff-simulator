import fs from 'node:fs';
const input='data/private/yahoo-zero-coverage-diagnostics.json';
const report=JSON.parse(fs.readFileSync(input,'utf8'));
if(!Array.isArray(report.details))throw new Error('Missing details in '+input);
const unknown=report.details.filter(r=>r.category==='no-name-position-identity-in-nflverse');
const byPlayer=new Map();
for(const r of unknown){
 const key=[String(r.yahooPlayerId),String(r.name),String(r.position)].join('|');
 if(!byPlayer.has(key))byPlayer.set(key,{name:r.name,position:r.position,yahooPlayerId:r.yahooPlayerId,weeks:[],teams:new Set()});
 const p=byPlayer.get(key);p.weeks.push(Number(r.week));p.teams.add(r.yahooTeam);
}
const result=[...byPlayer.values()].map(p=>({...p,weeks:p.weeks.sort((a,b)=>a-b),teams:[...p.teams]})).sort((a,b)=>a.name.localeCompare(b.name));
console.log('UNKNOWN IDENTITIES: '+unknown.length+' observations; '+result.length+' unique Yahoo players');
for(const r of result)console.log(JSON.stringify(r));
