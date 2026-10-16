import {parseCSV} from './csv.js';
const aliases={JAC:'JAX',WSH:'WAS',OAK:'LV',SD:'LAC',STL:'LA',LAR:'LA'};
const team=t=>aliases[String(t??'').trim().toUpperCase()]??String(t??'').trim().toUpperCase();
const time=v=>typeof v==='string'&&v.trim()&&Number.isFinite(Date.parse(v))?new Date(v).toISOString():null;
export function parseKickoffScheduleCSV(csv){return parseCSV(csv);}
export function enrichProjectionArchiveWithKickoffs(archive,scheduleRows){
 if(archive?.immutableArchive!==true||!Array.isArray(archive.rows))throw new Error('Only immutable projection archives are accepted');
 const games=new Map(),conflicts=new Set();
 for(const r of scheduleRows){
  const season=Number(r.season),week=Number(r.week),kickoff=time(r.kickoffAt??r.gameday_utc??r.kickoff_utc);
  if(!Number.isInteger(season)||!Number.isInteger(week)||!kickoff)continue;
  for(const t of [r.home_team??r.homeTeam,r.away_team??r.awayTeam]){
   const key=[season,week,team(t)].join('|');
   if(!team(t))continue;
   if(games.has(key)&&games.get(key)!==kickoff)conflicts.add(key);
   games.set(key,kickoff);
  }
 }
 const stats={rows:archive.rows.length,matched:0,missing:0,conflicted:0,postKickoff:0,eligiblePregame:0};
 const rows=archive.rows.map(r=>{
  const key=[Number(r.season),Number(r.week),team(r.nflTeam)].join('|');
  if(conflicts.has(key)){stats.conflicted++;return {...r,kickoffAt:undefined};}
  const kickoff=games.get(key);
  if(!kickoff){stats.missing++;return {...r,kickoffAt:undefined};}
  stats.matched++;
  if(Date.parse(r.projectedAt??archive.capturedAt)>=Date.parse(kickoff))stats.postKickoff++;
  else stats.eligiblePregame++;
  return {...r,kickoffAt:kickoff};
 });
 return {archive:{...archive,rows,kickoffEnrichment:{source:'user-supplied-schedule',generatedAt:new Date().toISOString(),stats}},stats};
}
