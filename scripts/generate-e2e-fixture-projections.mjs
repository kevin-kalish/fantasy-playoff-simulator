import fs from 'node:fs';
const positions=['QB','RB','WR','TE','K'],teams=['T1','T2','T3','T4'],nflTeams=['BUF','PHI','KC','MIN','BAL'];
const rows=[];
for(const week of [11,12,13])for(let t=0;t<teams.length;t++)for(let p=0;p<positions.length;p++)rows.push({season:2025,week,playerId:`${teams[t]}-${positions[p]}`,name:`${['Alpha','Bravo','Charlie','Delta'][t]} ${positions[p]}`,position:positions[p],nflTeam:nflTeams[p],projection:Number((22-t*1.25-p*1.8+(week-11)*.2).toFixed(1))});
fs.mkdirSync('data/private',{recursive:true});fs.writeFileSync('data/private/e2e-projections.json',JSON.stringify(rows,null,2));console.log(`wrote ${rows.length} projection rows to data/private/e2e-projections.json`);
