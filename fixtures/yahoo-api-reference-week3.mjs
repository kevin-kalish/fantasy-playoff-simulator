const prop=(key,value)=>({[key]:value});
const collection=(key,rows)=>Object.fromEntries([...rows.map((row,i)=>[String(i),{[key]:Array.isArray(row)?row:Object.entries(row).map(([k,v])=>prop(k,v))}]),['count',rows.length]]);
const team=(id,name,{wins,losses,ties=0,points,pointsAgainst,rank,waiverPriority,moves})=>({team_key:id,team_id:id.split('.').at(-1),name,waiver_priority:String(waiverPriority),number_of_moves:String(moves),team_standings:{rank:String(rank),points_against:String(pointsAgainst),outcome_totals:{wins:String(wins),losses:String(losses),ties:String(ties)}},team_points:{total:String(points)}});
const player=(id,name,pos,nflTeam,lineupSlot)=>[prop('player_key',id),prop('name',{full:name}),prop('editorial_team_abbr',nflTeam),prop('display_position',pos),prop('selected_position',{position:lineupSlot})];
const rosterPayload=players=>({fantasy_content:{team:[{}, {roster:{players:collection('player',players)}}]}});
const matchup=(week,a,b)=>({week:String(week),teams:collection('team',[{team_key:a},{team_key:b}])});

export const leagueKey='461.l.244897';
export const currentWeek=3;
export const settings={playoff_start_week:'15',num_playoff_teams:'8',uses_playoff_reseeding:'1',playoff_tiebreaker:'higher-seed',roster_positions:{0:{roster_position:{position:'QB',count:'1'}},1:{roster_position:{position:'RB',count:'2'}},2:{roster_position:{position:'WR',count:'2'}},3:{roster_position:{position:'TE',count:'1'}},4:{roster_position:{position:'W/R/T',count:'1'}},5:{roster_position:{position:'K',count:'1'}},6:{roster_position:{position:'DEF',count:'1'}},7:{roster_position:{position:'BN',count:'6'}},8:{roster_position:{position:'IR',count:'2'}},count:9}};
export const teams=[
 team(`${leagueKey}.t.1`,'The Fightin’ Kali',{wins:0,losses:2,points:177.54,pointsAgainst:237.20,rank:10,waiverPriority:10,moves:1}),
 ...Array.from({length:9},(_,i)=>team(`${leagueKey}.t.${i+2}`,`Reference Team ${i+2}`,{wins:i<2?2:1,losses:i<2?0:1,points:200+i*3,pointsAgainst:190+i*2,rank:i+1,waiverPriority:i+1,moves:i%3}))
];
const active=[['QB','Drake Maye','QB','NE'],['RB1','Bijan Robinson','RB','ATL'],['RB2','RB Two','RB','BUF'],['WR1','WR One','WR','MIN'],['WR2','WR Two','WR','DET'],['TE','TE One','TE','KC'],['FLEX','Flex One','WR','PHI'],['K','Kicker','K','BAL'],['DEF','Defense','DEF','SF']];
const roster=active.map(([s,n,p,t],i)=>player(`${leagueKey}.p.${i+1}`,n,p,t,s==='FLEX'?'W/R/T':s.replace(/\d/g,'')));
for(let i=0;i<6;i++)roster.push(player(`${leagueKey}.p.${20+i}`,`Bench ${i+1}`,'RB','NE','BN'));
for(let i=0;i<2;i++)roster.push(player(`${leagueKey}.p.${30+i}`,`IR ${i+1}`,'WR','NYJ','IR'));
const genericRoster=idx=>[player(`${leagueKey}.p.${100+idx}`,'QB','QB','BUF','QB'),player(`${leagueKey}.p.${200+idx}`,'RB','RB','PHI','RB')];
export const rosters=Object.fromEntries(teams.map((t,i)=>[t.team_key,i===0?roster:genericRoster(i)]));
export function scoreboard(week){const ids=teams.map(t=>t.team_key),matchups=[];for(let i=0;i<ids.length;i+=2)matchups.push(matchup(week,ids[i],ids[i+1]));return {fantasy_content:{league:[{}, {scoreboard:{matchups:collection('matchup',matchups)}}]}}}
export async function get(path){
 if(path===`league/${leagueKey}/settings`)return {fantasy_content:{league:[{league_key:leagueKey},{season:'2026'},{settings}]}};
 if(path===`league/${leagueKey}/teams`)return {fantasy_content:{league:[{}, {teams:collection('team',teams)}]}};
 const sm=path.match(/scoreboard;week=(\d+)/);if(sm)return scoreboard(Number(sm[1]));
 const rm=path.match(/^team\/(.+)\/roster;week=(\d+)$/);if(rm)return rosterPayload(rosters[rm[1]]);
 throw new Error(`Unexpected fixture request: ${path}`);
}
