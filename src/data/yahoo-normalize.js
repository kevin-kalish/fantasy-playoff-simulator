import {normalizeLeagueSnapshot} from './league-snapshot.js';

const list=v=>Array.isArray(v)?v:[];
const value=v=>v==null?'':typeof v==='object'&&'value' in v?v.value:v;
const flattenSingletonArrays=node=>{let out=node;while(Array.isArray(out)&&out.length===1&&Array.isArray(out[0]))out=out[0];return out};
const merge=a=>Object.assign({},...list(flattenSingletonArrays(a)).filter(x=>x&&typeof x==='object'&&!Array.isArray(x)));
const optionalNumber=v=>{const x=value(v);if(x==null||x==='')return undefined;const n=Number(x);return Number.isFinite(n)?n:undefined};
const properties=node=>{node=flattenSingletonArrays(node);if(Array.isArray(node))return merge(node.map(x=>{if(x?.player!=null)return properties(x.player);return x}));if(node?.player!=null)return properties(node.player);return node&&typeof node==='object'?node:{}};
const selectedPosition=node=>{const raw=properties(node);const selected=raw.selected_position;if(Array.isArray(selected))return properties(selected);return selected&&typeof selected==='object'?selected:{}};

export function yahooProperties(node){return properties(node)}
export function yahooValue(node){return value(node)}
export function yahooCollection(collection,key){const out=[];for(const [index,item] of Object.entries(collection||{})){if(index==='count')continue;let rows=item?.[key];if(rows==null)continue;rows=flattenSingletonArrays(rows);if(Array.isArray(rows))out.push(rows);else if(rows&&typeof rows==='object')out.push(rows)}return out}
export function yahooPlayer(player){const p=properties(player),name=properties(p.name),selected=selectedPosition(p);return{id:String(value(p.player_key)||value(p.player_id)),name:String(value(name.full)||''),position:String(value(p.display_position)||value(p.primary_position)||'').split(',')[0].toUpperCase(),nflTeam:String(value(p.editorial_team_abbr)||'').toUpperCase(),projection:0,status:String(value(p.status)||'').toUpperCase(),lineupSlot:String(value(selected.position)||value(selected)||'').toUpperCase()}}
export function yahooStanding(team){const t=properties(team),s=t.team_standings||{},o=s.outcome_totals||{},pointsAgainst=optionalNumber(s.points_against??t.points_against),rank=optionalNumber(s.rank??t.rank),waiverPriority=optionalNumber(t.waiver_priority),moves=optionalNumber(t.number_of_moves);return{wins:Number(value(o.wins)||0),losses:Number(value(o.losses)||0),ties:Number(value(o.ties)||0),points:Number(value(t.team_points?.total)||0),...(pointsAgainst!==undefined?{pointsAgainst}:{}),...(rank!==undefined?{rank}:{}),...(waiverPriority!==undefined?{waiverPriority}:{}),...(moves!==undefined?{moves}:{})}}
export function buildYahooSnapshot(raw){return normalizeLeagueSnapshot({...raw,source:{provider:'yahoo',...(raw.source||{})}})}
