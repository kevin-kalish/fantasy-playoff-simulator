import {scoreOffense} from '../scoring.js';
import {normalizeNFLVersePlayerWeek,filterFantasyPositions} from './nflverse-adapter.js';
export function buildHistoricalActuals(rawRows=[]){return filterFantasyPositions(rawRows).map(raw=>{const r=normalizeNFLVersePlayerWeek(raw);return {...r,actual:scoreOffense(r.stats)}}).filter(r=>r.seasonType==='REG'&&r.playerId&&Number.isFinite(r.actual))}
export function actualsIndex(rows=[]){return new Map(rows.map(r=>[`${r.season}:${r.week}:${r.playerId}`,r]))}
export function joinProjectionsToActuals(projections=[],actualRows=[]){const idx=actualsIndex(actualRows),joined=[],unmatched=[];for(const p of projections){const key=`${p.season}:${p.week}:${p.playerId}`,a=idx.get(key);if(!a){unmatched.push(p);continue}joined.push({...p,actual:a.actual,nflTeam:p.nflTeam||a.nflTeam,opponent:p.opponent||a.opponent})}return{joined,unmatched,matchRate:projections.length?joined.length/projections.length:0}}
