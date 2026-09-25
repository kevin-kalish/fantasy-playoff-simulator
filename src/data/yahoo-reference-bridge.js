import {auditYahooReference} from '../model/yahoo-reference-audit.js';

const FLEX=new Set(['RB/WR/TE','W/R/T']);
const inactive=new Set(['BN','IR','IL','NA']);
const canonSlot=slot=>{const s=String(slot||'').toUpperCase().replace(/\s+/g,'');if(FLEX.has(s))return'W/R/T';if(s==='D/ST')return'DEF';return s};

export function rosterShapeFromYahooSnapshot(snapshot){
 const shape={};
 for(const raw of snapshot.lineupSlots||[]){const slot=canonSlot(raw);if(!slot||inactive.has(slot))continue;shape[slot]=(shape[slot]||0)+1}
 const sample=snapshot.teams?.find(t=>Array.isArray(t.roster)&&t.roster.length)?.roster||[];
 for(const p of sample){const slot=canonSlot(p.lineupSlot);if(!inactive.has(slot))continue;shape[slot]=(shape[slot]||0)+1}
 return shape;
}

export function referenceTeamFromYahooSnapshot(snapshot,referenceTeamName){
 const wanted=String(referenceTeamName||'').toLowerCase();
 const team=(snapshot.teams||[]).find(t=>String(t.name||'').toLowerCase()===wanted);
 if(!team)return null;
 return {name:team.name,wins:team.wins,losses:team.losses,ties:team.ties,pointsFor:team.points,pointsAgainst:team.pointsAgainst,rank:team.rank,waiverPriority:team.waiverPriority,moves:team.moves};
}

export function yahooSnapshotAuditView(snapshot,reference){
 return {teamCount:snapshot.teams?.length||0,referenceTeam:referenceTeamFromYahooSnapshot(snapshot,reference.referenceTeam?.name)||{},roster:rosterShapeFromYahooSnapshot(snapshot),playoffs:{spots:snapshot.playoffSpots,weeks:snapshot.playoffWeeks,reseed:snapshot.reseed,tieBreaker:snapshot.playoffTiebreaker||snapshot.playoffTieBreaker||snapshot.tiebreaker}};
}

export function auditImportedYahooLeague(snapshot,reference){
 const actual=yahooSnapshotAuditView(snapshot,reference);
 return {...auditYahooReference(reference,actual),actual};
}
