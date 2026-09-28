import {captureToPatch} from './current-state-capture.js';
import {prepareFightinKaliSnapshot} from './fightin-kali-snapshot.js';

const slug=s=>String(s??'').normalize('NFKD').replace(/[^a-zA-Z0-9]+/g,'-').replace(/^-|-$/g,'').toLowerCase();
const clone=v=>JSON.parse(JSON.stringify(v));

export function bootstrapCurrentState(capture,config={}){
 const patch=captureToPatch(capture);
 if(!patch.teams?.length) throw new Error('Bootstrap capture requires standings/team rows.');
 const aliases=new Set([config.teamName,...(config.teamAliases??[])].filter(Boolean));
 const teams=patch.teams.map((team,index)=>({
  id:team.id??slug(team.name)??`team-${index+1}`,
  ...clone(team),
  lineup:clone(team.lineup??[]),
  ...(team.roster?{roster:clone(team.roster)}:{})
 }));
 const configured=teams.find(t=>aliases.has(t.name));
 if(!configured) throw new Error(`Configured team not found: ${config.teamName??'unknown'}`);
 const nameToId=new Map(teams.map(t=>[t.name,t.id]));
 const schedule=(patch.schedule??[]).map(w=>({
  ...w,
  matchups:(w.matchups??[]).map(([a,b])=>[nameToId.get(a)??a,nameToId.get(b)??b])
 }));
 const raw={
  source:{provider:patch.provider??'manual-capture',leagueId:config.leagueId,season:config.season,capturedAt:patch.capturedAt},
  teams,
  schedule,
  nflGames:clone(patch.nflGames??[]),
  playoffSpots:config.playoffs?.spots,
  playoffWeeks:config.playoffs?.weeks,
  reseed:config.playoffs?.reseed,
  playoffTiebreaker:config.playoffs?.tieBreaker,
  lineupSlots:Object.entries(config.lineup??{}).flatMap(([slot,count])=>Array(Number(count)||0).fill(slot)),
  simulations:config.defaults?.simulations,
  seed:config.defaults?.seed
 };
 return prepareFightinKaliSnapshot(raw,config);
}
