import {parseCSV} from '../src/data/csv.js';
import {fetchNflverseCSV} from '../src/data/nflverse-source.js';
import {aggregateNflversePbpDST} from '../src/data/nflverse-pbp-dst.js';

const season=Number(process.argv[2]||2025);
const pbpDl=await fetchNflverseCSV('pbp',season);
const teamDl=await fetchNflverseCSV('team',season);
const pbp=parseCSV(pbpDl.text), team=parseCSV(teamDl.text);
const dst=aggregateNflversePbpDST(pbp,{teamStats:team});
const key=(w,t)=>`${Number(w)}:${String(t||'').trim()}`;
const refs=new Map(team.filter(r=>String(r.season_type||'REG').toUpperCase()==='REG').map(r=>[key(r.week,r.team),r]));
const has=f=>team.some(r=>Object.hasOwn(r,f));
const aliases={sacks:['def_sacks'],interceptions:['def_interceptions'],fumbleRecoveries:['def_fumbles','def_fumble_recoveries','fumble_recovery_opp'],touchdowns:['def_tds'],safeties:['def_safeties'],returnTD:['special_teams_tds']};
const comparable=[];for(const [ours,fields] of Object.entries(aliases)){const field=fields.find(has);if(field)comparable.push({ours,fields:[field]});}
const blockFields=['def_punt_blocks','def_pat_blocks','def_fg_blocks'].filter(has);if(blockFields.length)comparable.push({ours:'blockedKicks',fields:blockFields});
const num=v=>Number(v||0), expected=(r,fields)=>fields.reduce((s,f)=>s+num(r[f]),0);
const mismatches=[],missing=[];let checked=0;
for(const row of dst){const ref=refs.get(key(row.week,row.team));if(!ref){missing.push({week:row.week,team:row.team});continue;}for(const c of comparable){checked++;const exp=expected(ref,c.fields),actual=num(row[c.ours]);if(Math.abs(actual-exp)>1e-9)mismatches.push({week:row.week,team:row.team,component:c.ours,referenceFields:c.fields,expected:exp,actual,delta:actual-exp,source:row.componentSource?.[c.ours]});}}
const byComponent=Object.fromEntries(comparable.map(c=>{const mm=mismatches.filter(x=>x.component===c.ours),n=dst.length-missing.length;return[c.ours,{referenceFields:c.fields,checked:n,exact:n-mm.length,accuracy:n?((n-mm.length)/n):null,mismatches:mm.length}]}));
const sourceCounts={};for(const row of dst)for(const [component,source] of Object.entries(row.componentSource||{})){sourceCounts[component]??={};sourceCounts[component][source]=(sourceCounts[component][source]||0)+1;}
const rare=dst.filter(x=>x.touchdowns||x.safeties||x.blockedKicks||x.returnTD||x.extraPointReturned).map(x=>({week:x.week,team:x.team,touchdowns:x.touchdowns,safeties:x.safeties,blockedKicks:x.blockedKicks,returnTD:x.returnTD,extraPointReturned:x.extraPointReturned,actual:x.actual}));
console.log(JSON.stringify({season,architecture:'Official nflverse weekly-team stats are authoritative where available; PBP supplies Yahoo components not exposed by the official weekly schema.',sources:{pbp:pbpDl.url,weeklyTeam:teamDl.url},teamWeeks:dst.length,referenceRows:refs.size,comparableComponents:comparable.map(c=>({component:c.ours,fields:c.fields})),checked,exact:checked-mismatches.length,accuracy:checked?((checked-mismatches.length)/checked):null,missingReferenceRows:missing.length,byComponent,sourceCounts,mismatchCount:mismatches.length,mismatchExamples:mismatches.slice(0,50),rareEventTeamWeeks:rare.length,rareEventSample:rare.slice(0,20),remainingUnvalidated:['extraPointReturned when no official weekly field is published','Yahoo-specific points-allowed treatment; current PBP layer uses opponent final scoreboard points'],notes:['nflfastR documents that exact official stats cannot always be reconstructed from tidy PBP because unusual plays can contain multiple possession changes/laterals. The hybrid design therefore uses official weekly team stats for official components and PBP only for missing Yahoo inputs.']},null,2));
if(missing.length||mismatches.length)process.exitCode=2;
