import fs from 'node:fs';

const outputPath=process.argv[2]??'data/private/fightin-kali-capture.json';
const capture={
 capturedAt:'2026-09-29T17:45:00-04:00',
 currentWeek:4,
 teams:[
  {name:"James's Great Team",wins:3,losses:0,ties:0,points:409.22,pointsAgainst:328.80,rank:1,waiverPriority:2},
  {name:'Shambala',wins:2,losses:1,ties:0,points:395.24,pointsAgainst:326.40,rank:2,waiverPriority:9,moves:2},
  {name:'Captain Marrvelous',wins:2,losses:1,ties:0,points:394.64,pointsAgainst:309.80,rank:3,waiverPriority:5},
  {name:'The Desmond Diamonds',wins:2,losses:1,ties:0,points:321.50,pointsAgainst:376.20,rank:4,waiverPriority:6},
  {name:'THE KALISH KABANA!!!!',wins:2,losses:1,ties:0,points:320.04,pointsAgainst:326.48,rank:5,waiverPriority:8,moves:2},
  {name:'End zone Em-pire',wins:1,losses:2,ties:0,points:335.68,pointsAgainst:324.50,rank:6,waiverPriority:3,moves:3},
  {name:"AiLi’s Football Guys",wins:1,losses:2,ties:0,points:320.70,pointsAgainst:397.18,rank:7,waiverPriority:1},
  {name:"The Fightin' Kali",wins:1,losses:2,ties:0,points:316.60,pointsAgainst:344.62,rank:8,waiverPriority:10,moves:1,
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
   ]},
  {name:'AI Generated Slop',wins:1,losses:2,ties:0,points:306.48,pointsAgainst:339.52,rank:9,waiverPriority:4,moves:1},
  {name:'Bens Big Boys',wins:0,losses:3,ties:0,points:335.30,pointsAgainst:381.90,rank:10,waiverPriority:7,moves:1}
 ],
 schedule:[
  {week:1,matchups:[["The Fightin' Kali",'End zone Em-pire'],['Captain Marrvelous',"AiLi’s Football Guys"],['THE KALISH KABANA!!!!','Shambala'],['AI Generated Slop','The Desmond Diamonds'],['Bens Big Boys',"James's Great Team"]]},
  {week:2,matchups:[["The Fightin' Kali",'THE KALISH KABANA!!!!'],['End zone Em-pire',"James's Great Team"],['Captain Marrvelous','The Desmond Diamonds'],['AI Generated Slop','Bens Big Boys'],["AiLi’s Football Guys",'Shambala']]},
  {week:3,matchups:[["The Fightin' Kali","AiLi’s Football Guys"],['End zone Em-pire','THE KALISH KABANA!!!!'],['Captain Marrvelous','Bens Big Boys'],['AI Generated Slop',"James's Great Team"],['The Desmond Diamonds','Shambala']]},
  {week:4,matchups:[["The Fightin' Kali",'The Desmond Diamonds'],['End zone Em-pire',"AiLi’s Football Guys"],['Captain Marrvelous','AI Generated Slop'],['THE KALISH KABANA!!!!',"James's Great Team"],['Bens Big Boys','Shambala']]},
  {week:5,matchups:[["The Fightin' Kali",'Bens Big Boys'],['End zone Em-pire','The Desmond Diamonds'],['Captain Marrvelous',"James's Great Team"],['THE KALISH KABANA!!!!',"AiLi’s Football Guys"],['AI Generated Slop','Shambala']]},
  {week:6,matchups:[["The Fightin' Kali",'AI Generated Slop'],['End zone Em-pire','Bens Big Boys'],['Captain Marrvelous','Shambala'],['THE KALISH KABANA!!!!','The Desmond Diamonds'],["AiLi’s Football Guys","James's Great Team"]]},
  {week:7,matchups:[["The Fightin' Kali",'Captain Marrvelous'],['End zone Em-pire','AI Generated Slop'],['THE KALISH KABANA!!!!','Bens Big Boys'],["AiLi’s Football Guys",'The Desmond Diamonds'],["James's Great Team",'Shambala']]},
  {week:8,matchups:[["The Fightin' Kali",'Shambala'],['End zone Em-pire','Captain Marrvelous'],['THE KALISH KABANA!!!!','AI Generated Slop'],["AiLi’s Football Guys",'Bens Big Boys'],['The Desmond Diamonds',"James's Great Team"]]},
  {week:9,matchups:[["The Fightin' Kali", "James's Great Team"],['End zone Em-pire','Shambala'],['Captain Marrvelous','THE KALISH KABANA!!!!'],['AI Generated Slop',"AiLi’s Football Guys"],['Bens Big Boys','The Desmond Diamonds']]},
  {week:10,matchups:[["The Fightin' Kali",'End zone Em-pire'],['Captain Marrvelous',"AiLi’s Football Guys"],['THE KALISH KABANA!!!!','Shambala'],['AI Generated Slop','The Desmond Diamonds'],['Bens Big Boys',"James's Great Team"]]},
  {week:11,matchups:[["The Fightin' Kali",'THE KALISH KABANA!!!!'],['End zone Em-pire',"James's Great Team"],['Captain Marrvelous','The Desmond Diamonds'],['AI Generated Slop','Bens Big Boys'],["AiLi’s Football Guys",'Shambala']]},
  {week:12,matchups:[["The Fightin' Kali", "AiLi’s Football Guys"],['End zone Em-pire','THE KALISH KABANA!!!!'],['Captain Marrvelous','Bens Big Boys'],['AI Generated Slop',"James's Great Team"],['The Desmond Diamonds','Shambala']]},
  {week:13,matchups:[["The Fightin' Kali",'The Desmond Diamonds'],['End zone Em-pire',"AiLi’s Football Guys"],['Captain Marrvelous','AI Generated Slop'],['THE KALISH KABANA!!!!',"James's Great Team"],['Bens Big Boys','Shambala']]},
  {week:14,matchups:[["The Fightin' Kali",'Bens Big Boys'],['End zone Em-pire','The Desmond Diamonds'],['Captain Marrvelous',"James's Great Team"],['THE KALISH KABANA!!!!',"AiLi’s Football Guys"],['AI Generated Slop','Shambala']]}
 ]
};
fs.mkdirSync('data/private',{recursive:true});
fs.writeFileSync(outputPath,JSON.stringify(capture,null,2)+'\n');
const matchupCount=capture.schedule.reduce((sum,row)=>sum+row.matchups.length,0);
console.log(`CAPTURE TEMPLATE: READY | ${capture.teams.length} teams | ${capture.schedule.length} weeks | ${matchupCount} matchups | current week ${capture.currentWeek}`);
console.log(`Wrote: ${outputPath}`);
console.log('NOTE: Post-Week-3 standings captured manually from Yahoo; no rivalry-week semantics are modeled.');
