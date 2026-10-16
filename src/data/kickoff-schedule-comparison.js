import {parseKickoffScheduleCSV} from './projection-kickoff-enrichment.js';
const norm=v=>String(v??'').trim().toUpperCase();
const iso=v=>{const t=Date.parse(v??'');return Number.isFinite(t)?new Date(t).toISOString():null;};
export function compareKickoffSchedules(localCsv,referenceRows,{season,week}={}){
 const local=parseKickoffScheduleCSV(localCsv);
 const selected=rows=>rows.filter(r=>Number(r.season)===Number(season)&&Number(r.week)===Number(week));
 const games=rows=>new Map(selected(rows).map(r=>[[norm(r.home_team??r.homeTeam),norm(r.away_team??r.awayTeam)].join('|'),iso(r.kickoffAt??r.kickoff_utc??r.gameday_utc)]));
 const a=games(local),z=games(referenceRows),missing=[],unexpected=[],mismatched=[];
 for(const [game,kickoff] of z){if(!a.has(game))missing.push(game);else if(a.get(game)!==kickoff)mismatched.push({game,local:a.get(game),reference:kickoff});}
 for(const game of a.keys())if(!z.has(game))unexpected.push(game);
 return {season:Number(season),week:Number(week),localGames:a.size,referenceGames:z.size,missing,unexpected,mismatched,match:z.size>0&&!missing.length&&!unexpected.length&&!mismatched.length};
}
