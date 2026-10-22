import fs from 'node:fs';
const read=p=>{const x=JSON.parse(fs.readFileSync(p,'utf8'));if(!Array.isArray(x.rows))throw new Error('Missing rows: '+p);return x.rows;};
const nfl=read('data/private/historical-actuals.json');
const yahoo=read('data/private/yahoo-player-actuals.json');
const targets=['470.p.42655','470.p.34207','470.p.31856'];
const normalize=s=>String(s??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9 ]/g,'').trim();
for(const id of targets){
 const yr=yahoo.filter(r=>String(r.playerId)===id);
 if(!yr.length){console.log(JSON.stringify({id,error:'not-found-in-yahoo'}));continue;}
 const y=yr[0],last=normalize(y.name).split(/\s+/).at(-1);
 const candidates=nfl.filter(n=>String(n.position).toUpperCase()===String(y.position).toUpperCase()&&(normalize(n.name).split(/\s+/).includes(last)||String(n.nflTeam).toUpperCase()===String(y.nflTeam).toUpperCase()));
 const grouped=new Map();
 for(const n of candidates){
  const k=String(n.playerId);
  if(!grouped.has(k))grouped.set(k,{playerId:k,name:n.name,position:n.position,team:n.nflTeam,weeks:[],actuals:[]});
  const v=grouped.get(k);v.weeks.push(n.week);v.actuals.push(n.actual);
 }
 const surname=[...grouped.values()].filter(r=>normalize(r.name).split(/\s+/).includes(last));
 const sameTeam=[...grouped.values()].filter(r=>String(r.team).toUpperCase()===String(y.nflTeam).toUpperCase());
 console.log(JSON.stringify({yahoo:{id,name:y.name,position:y.position,team:y.nflTeam,weeks:yr.map(r=>({week:r.week,actual:r.actual}))},surnameCandidates:surname,sameTeamPlayerCount:sameTeam.length,sameTeamPlayerNames:sameTeam.map(r=>r.name)}));
}
