import fs from 'node:fs';

const outputPath=process.argv[2]??'data/private/fightin-kali-capture.json';
const capture={
 capturedAt:'2026-09-28T12:05:00-04:00',
 teams:[
  {name:'Shambala',wins:2,losses:0,ties:0,points:299.48,pointsAgainst:191.26,rank:1,waiverPriority:9,moves:2},
  {name:"James's Great Team",wins:2,losses:0,ties:0,points:273.04,pointsAgainst:241.66,rank:2,waiverPriority:2},
  {name:'Captain Marrvelous',wins:1,losses:1,ties:0,points:258.78,pointsAgainst:195.82,rank:3,waiverPriority:5},
  {name:'End zone Em-pire',wins:1,losses:1,ties:0,points:235.98,pointsAgainst:216.80,rank:4,waiverPriority:3,moves:3},
  {name:'AI Generated Slop',wins:1,losses:1,ties:0,points:219.34,pointsAgainst:203.34,rank:5,waiverPriority:4,moves:1},
  {name:"AiLi’s Football Guys",wins:1,losses:1,ties:0,points:213.28,pointsAgainst:258.12,rank:6,waiverPriority:1},
  {name:'THE KALISH KABANA!!!!',wins:1,losses:1,ties:0,points:212.34,pointsAgainst:226.78,rank:7,waiverPriority:8,moves:2},
  {name:'The Desmond Diamonds',wins:1,losses:1,ties:0,points:186.36,pointsAgainst:280.44,rank:8,waiverPriority:6},
  {name:'Bens Big Boys',wins:0,losses:2,ties:0,points:221.32,pointsAgainst:246.04,rank:9,waiverPriority:7,moves:1},
  {name:"The Fightin' Kali",wins:0,losses:2,ties:0,points:177.54,pointsAgainst:237.20,rank:10,waiverPriority:10,moves:1,
   roster:[
    {name:'Drake Maye',position:'QB',nflTeam:'NE',lineupSlot:'QB'},
    {name:'Bijan Robinson',position:'RB',nflTeam:'ATL',lineupSlot:'RB'},
    {name:'David Montgomery',position:'RB',nflTeam:'HOU',lineupSlot:'RB'},
    {name:'George Pickens',position:'WR',nflTeam:'DAL',lineupSlot:'WR'},
    {name:'Matthew Golden',position:'WR',nflTeam:'GB',lineupSlot:'WR'},
    {name:'Brock Bowers',position:'TE',nflTeam:'LV',lineupSlot:'TE'},
    {name:'TreVeyon Henderson',position:'RB',nflTeam:'NE',lineupSlot:'W/R/T'},
    {name:'Emeka Egbuka',position:'WR',nflTeam:'TB',lineupSlot:'BN'},
    {name:'Jake Ferguson',position:'TE',nflTeam:'DAL',lineupSlot:'BN'},
    {name:'Stefon Diggs',position:'WR',nflTeam:'WAS',lineupSlot:'BN'},
    {name:'J.K. Dobbins',position:'RB',nflTeam:'DEN',lineupSlot:'BN'},
    {name:'Baker Mayfield',position:'QB',nflTeam:'TB',lineupSlot:'BN'},
    {name:'Kaelon Black',position:'RB',nflTeam:'SF',lineupSlot:'BN'},
    {name:'Isiah Pacheco',position:'RB',nflTeam:'DET',lineupSlot:'IR',status:'IR'},
    {name:'Brandon Aubrey',position:'K',nflTeam:'DAL',lineupSlot:'K'},
    {name:'Texans',position:'DEF',nflTeam:'HOU',lineupSlot:'DEF'}
   ]}
 ],
 schedule:[
  {week:3,matchups:[["The Fightin' Kali","AiLi’s Football Guys"]]},
  {week:4,matchups:[["The Fightin' Kali",'The Desmond Diamonds']]},
  {week:5,matchups:[["The Fightin' Kali",'Bens Big Boys']]},
  {week:6,matchups:[["The Fightin' Kali",'AI Generated Slop']]},
  {week:7,matchups:[["The Fightin' Kali",'Captain Marrvelous']]},
  {week:8,matchups:[["The Fightin' Kali",'Shambala']]},
  {week:9,matchups:[["The Fightin' Kali","James's Great Team"]]},
  {week:10,matchups:[["The Fightin' Kali",'End zone Em-pire']]},
  {week:11,matchups:[["The Fightin' Kali",'THE KALISH KABANA!!!!']]},
  {week:12,matchups:[["The Fightin' Kali","AiLi’s Football Guys"]]},
  {week:13,matchups:[["The Fightin' Kali",'The Desmond Diamonds']]},
  {week:14,matchups:[["The Fightin' Kali",'Bens Big Boys']]}
 ]
};
fs.mkdirSync('data/private',{recursive:true});
fs.writeFileSync(outputPath,JSON.stringify(capture,null,2)+'\n');
console.log(`CAPTURE TEMPLATE: READY | ${capture.teams.length} teams | ${capture.schedule.length} Fightin' Kali schedule rows`);
console.log(`Wrote: ${outputPath}`);
console.log('NOTE: Opponent-vs-opponent matchups are not yet captured; bootstrap will require a complete league schedule before simulation.');
