const num=v=>{const n=Number(v);return Number.isFinite(n)?n:undefined};
const clean=s=>String(s??'').trim();

export function parseStandingsText(text){
 const teams=[];
 for(const raw of String(text??'').split(/\r?\n/)){
  const line=raw.trim(); if(!line||line.startsWith('#')) continue;
  const parts=line.split('|').map(clean);
  if(parts.length<2) throw new Error(`Invalid standings line: ${line}`);
  const record=parts[1].match(/^(\d+)-(\d+)(?:-(\d+))?$/);
  if(!record) throw new Error(`Invalid record in standings line: ${line}`);
  const team={name:parts[0],wins:Number(record[1]),losses:Number(record[2]),ties:Number(record[3]??0)};
  if(parts[2]) team.points=num(parts[2]);
  if(parts[3]) team.pointsAgainst=num(parts[3]);
  if(parts[4]) team.rank=num(parts[4]);
  teams.push(team);
 }
 return teams;
}

export function parseScheduleText(text){
 const weeks=new Map();
 for(const raw of String(text??'').split(/\r?\n/)){
  const line=raw.trim(); if(!line||line.startsWith('#')) continue;
  const m=line.match(/^(?:week\s*)?(\d+)\s*\|\s*(.+?)\s*(?:vs\.?|@)\s*(.+)$/i);
  if(!m) throw new Error(`Invalid schedule line: ${line}`);
  const week=Number(m[1]); if(!weeks.has(week)) weeks.set(week,[]);
  weeks.get(week).push([clean(m[2]),clean(m[3])]);
 }
 return [...weeks].sort((a,b)=>a[0]-b[0]).map(([week,matchups])=>({week,matchups}));
}

export function captureToPatch(capture={}){
 const teams=Array.isArray(capture.teams)?capture.teams:parseStandingsText(capture.standings??'');
 const schedule=Array.isArray(capture.schedule)?capture.schedule:(capture.scheduleText?parseScheduleText(capture.scheduleText):undefined);
 return {provider:'manual-capture',capturedAt:capture.capturedAt??new Date().toISOString(),teams,...(schedule?{schedule}:{}),...(capture.nflGames?{nflGames:capture.nflGames}:{})};
}

export const CAPTURE_HELP=`Standings format (one team per line):\nTeam Name | W-L[-T] | points | pointsAgainst | rank\n\nSchedule format:\nWeek | Team A vs Team B\nExample: 4 | The Fightin' Kali vs Team Two`;
