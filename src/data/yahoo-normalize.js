import {normalizeLeagueSnapshot} from './league-snapshot.js';

const list=v=>Array.isArray(v)?v:[];
const value=v=>v==null?'':typeof v==='object'&&'value' in v?v.value:v;
const merge=a=>Object.assign({},...list(a).filter(x=>x&&typeof x==='object'&&!Array.isArray(x)));

export function yahooProperties(node){return merge(node)}
export function yahooValue(node){return value(node)}
export function yahooCollection(collection,key){const out=[];for(const [index,item] of Object.entries(collection||{})){if(index==='count')continue;const rows=item?.[key];if(rows)out.push(merge(rows))}return out}
export function yahooPlayer(player){const p=merge(player),name=p.name||{};return{id:String(value(p.player_key)||value(p.player_id)),name:String(value(name.full)||''),position:String(value(p.display_position)||value(p.primary_position)||'').split(',')[0].toUpperCase(),nflTeam:String(value(p.editorial_team_abbr)||'').toUpperCase(),projection:0,status:String(value(p.status)||'').toUpperCase()}}
export function yahooStanding(team){const s=team.team_standings||{},o=s.outcome_totals||{};return{wins:Number(value(o.wins)||0),losses:Number(value(o.losses)||0),ties:Number(value(o.ties)||0),points:Number(value(team.team_points?.total)||0)}}
export function buildYahooSnapshot(raw){return normalizeLeagueSnapshot({...raw,source:{provider:'yahoo',...(raw.source||{})}})}
