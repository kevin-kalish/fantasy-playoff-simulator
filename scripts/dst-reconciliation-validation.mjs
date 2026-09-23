import {parseCSV} from '../src/data/csv.js';
import {fetchNflverseCSV} from '../src/data/nflverse-source.js';
import {aggregateNflversePbpDST} from '../src/data/nflverse-pbp-dst.js';

const season=Number(process.argv[2]||2025);
const pbpDl=await fetchNflverseCSV('pbp',season);
const teamDl=await fetchNflverseCSV('team',season);
const pbp=parseCSV(pbpDl.text), team=parseCSV(teamDl.text);
const dst=aggregateNflversePbpDST(pbp);
const key=(w,t)=>`${Number(w)}:${String(t||'').trim()}`;
const refs=new Map(team.filter(r=>String(r.season_type||'REG').toUpperCase()==='REG').map(r=>[key(r.week,r.team),r]));
const aliases={sacks:['def_sacks'],interceptions:['def_interceptions'],touchdowns:['def_tds'],safeties:['def_safeties'],returnTD:['special_teams_tds']};
const num=v=>Number(v||0);
const comparable=[];for(const [ours,fields] of Object.entries(aliases)){const field=fields.find(f=>team.some(r=>Object.hasOwn(r,f)));if(field)comparable.push([ours,field]);}
const mismatches=[],missing=[];let checked=0;
for(const row of dst){const ref=refs.get(key(row.week,row.team));if(!ref){missing.push({week:row.week,team:row.team});continue;}for(const [ours,field] of comparable){checked++;const expected=num(ref[field]),actual=num(row[ours]);if(Math.abs(actual-expected)>1e-9)mismatches.push({week:row.week,team:row.team,component:ours,referenceField:field,expected,actual,delta:actual-expected});}}
const byComponent=Object.fromEntries(comparable.map(([ours,field])=>{const mm=mismatches.filter(x=>x.component===ours);const n=dst.length-missing.length;return[ours,{referenceField:field,checked:n,exact:n-mm.length,accuracy:n?((n-mm.length)/n):null,mismatches:mm.length}]}));
const rare=dst.filter(x=>x.touchdowns||x.safeties||x.blockedKicks||x.returnTD||x.extraPointReturned).map(x=>({week:x.week,team:x.team,touchdowns:x.touchdowns,safeties:x.safeties,blockedKicks:x.blockedKicks,returnTD:x.returnTD,extraPointReturned:x.extraPointReturned,actual:x.actual}));
console.log(JSON.stringify({season,sources:{pbp:pbpDl.url,weeklyTeam:teamDl.url},teamWeeks:dst.length,referenceRows:refs.size,comparableComponents:comparable.map(([component,field])=>({component,field})),checked,exact:checked-mismatches.length,accuracy:checked?((checked-mismatches.length)/checked):null,missingReferenceRows:missing.length,byComponent,mismatchCount:mismatches.length,mismatchExamples:mismatches.slice(0,50),rareEventTeamWeeks:rare.length,rareEventSample:rare.slice(0,50),limitations:['Weekly nflverse team stats do not expose every Yahoo DST component, so fumble recoveries, blocked kicks, extra-point returns, and Yahoo points-allowed scoring still require a second independent reference before claiming 100% source validation.','This validator deliberately compares PBP-derived components only to independently published weekly-team fields; it does not compare the PBP output to itself.']},null,2));
if(missing.length||mismatches.length)process.exitCode=2;
