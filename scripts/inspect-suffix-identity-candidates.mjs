import fs from 'node:fs';
const nfl=JSON.parse(fs.readFileSync('data/private/historical-actuals.json','utf8')).rows;
const yahoo=JSON.parse(fs.readFileSync('data/private/yahoo-player-actuals.json','utf8')).rows;
const names=['James Cook III','Travis Etienne Jr.','KC Concepcion Jr.','Michael Pittman Jr.','Kyle Pitts Sr.','Aaron Jones Sr.','Marvin Harrison Jr.'];
const normalize=s=>String(s??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim().replace(/(?:[\s.,]+)(?:jr|sr|ii|iii|iv|v)\.?$/i,'').replace(/[^a-z0-9]/g,'');
for(const name of names){
 const ys=yahoo.filter(r=>r.name===name);
 const results=ys.map(y=>{
  const matches=nfl.filter(n=>Number(n.season)===Number(y.season)&&Number(n.week)===Number(y.week)&&String(n.position).toUpperCase()===String(y.position).toUpperCase()&&normalize(n.name)===normalize(y.name));
  return {week:y.week,yahooTeam:y.nflTeam,yahooActual:y.actual,candidates:matches.map(n=>({name:n.name,team:n.nflTeam,id:n.playerId,actual:n.actual}))};
 });
 console.log(JSON.stringify({name,results}));
}
