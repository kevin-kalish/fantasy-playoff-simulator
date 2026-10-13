import {parseCSV} from './csv.js';
export const NFL_SCHEDULE_URL='https://raw.githubusercontent.com/nflverse/nfldata/master/data/games.csv';
const formatter=new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
const nyParts=ms=>Object.fromEntries(formatter.formatToParts(new Date(ms)).filter(p=>p.type!=='literal').map(p=>[p.type,Number(p.value)]));
export function easternKickoffToISO(date,clock){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(String(date))||!/^\d{1,2}:\d{2}$/.test(String(clock)))return null;
 const [year,month,day]=date.split('-').map(Number),[hour,minute]=clock.split(':').map(Number);
 if(hour>23||minute>59)return null;
 const desired=Date.UTC(year,month-1,day,hour,minute);
 if(!Number.isFinite(desired)||new Date(desired).toISOString().slice(0,10)!==date)return null;
 let candidate=desired+5*3600000;
 for(let i=0;i<3;i++){const p=nyParts(candidate);const represented=Date.UTC(p.year,p.month-1,p.day,p.hour,p.minute);candidate+=desired-represented;}
 const p=nyParts(candidate);
 if(p.year!==year||p.month!==month||p.day!==day||p.hour!==hour||p.minute!==minute)return null;
 return new Date(candidate).toISOString();
}
export function normalizeNflverseSchedule(csv,{season}={}){
 const rows=parseCSV(csv),out=[],rejected=[];
 for(const [i,row] of rows.entries()){
  if(Number(row.season)!==Number(season)||String(row.game_type).toUpperCase()!=='REG')continue;
  const kickoffAt=easternKickoffToISO(row.gameday,row.gametime);
  if(!kickoffAt||!row.home_team||!row.away_team||!Number.isInteger(Number(row.week))){rejected.push({row:i+2,reason:'invalid-game-time-or-teams'});continue;}
  out.push({season:Number(row.season),week:Number(row.week),home_team:row.home_team,away_team:row.away_team,kickoffAt,gameId:row.game_id});
 }
 return {rows:out,rejected};
}
export async function fetchNflverseSchedule(season,{fetchImpl=fetch,url=NFL_SCHEDULE_URL}={}){
 const response=await fetchImpl(url);
 if(!response.ok)throw new Error('NFL schedule download failed HTTP '+response.status);
 const result=normalizeNflverseSchedule(await response.text(),{season});
 if(result.rows.length<200)throw new Error('Incomplete NFL regular-season schedule: '+result.rows.length+' games (expected at least 200)');
 if(result.rejected.length)throw new Error('Unparseable NFL kickoff records: '+result.rejected.length);
 return {...result,source:url};
}
