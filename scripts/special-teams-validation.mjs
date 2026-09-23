import {parseCSV} from '../src/data/csv.js';
import {fetchNflverseCSV} from '../src/data/nflverse-source.js';
import {nflverseFantasyPoints} from '../src/data/nflverse.js';
import {nflverseDSTFantasyPoints} from '../src/data/nflverse-dst.js';
import {scoreKicker,scoreDefense} from '../src/scoring.js';
const season=Number(process.argv[2]||2025),n=v=>Number(v||0),reg=r=>!r.season_type||String(r.season_type).toUpperCase()==='REG';
const [playerDL,teamDL]=await Promise.all([fetchNflverseCSV('player',season),fetchNflverseCSV('team',season)]),players=parseCSV(playerDL.text).filter(reg),teams=parseCSV(teamDL.text).filter(reg);
const kickers=players.filter(r=>String(r.position).toUpperCase()==='K');
const kChecked=kickers.map(r=>{const expected=scoreKicker({fg0_19:n(r.fg_made_0_19),fg20_29:n(r.fg_made_20_29),fg30_39:n(r.fg_made_30_39),fg40_49:n(r.fg_made_40_49),fg50plus:n(r.fg_made_50_59)+n(r.fg_made_60_),xpMade:n(r.pat_made)}),actual=nflverseFantasyPoints(r);return{r,expected,actual,delta:actual-expected}}),kBad=kChecked.filter(x=>Math.abs(x.delta)>1e-9);
const dstFields=['sacks','def_sacks','interceptions','def_interceptions','fumble_recoveries','def_fumble_recoveries','defensive_tds','def_tds','touchdowns','safeties','def_safeties','blocked_kicks','def_blocked_kicks','kick_return_tds','punt_return_tds','special_teams_tds','extra_point_returns','extra_point_returned','points_allowed','opponent_points','points_against'];
const available=dstFields.filter(k=>teams.some(r=>r[k]!==undefined)),missing=dstFields.filter(k=>!available.includes(k));
const dst=teams.map(r=>({team:r.team,week:n(r.week),score:nflverseDSTFantasyPoints(r)}));
// Deterministic rule boundary checks protect Yahoo scoring independently of provider schema.
const dstCases=[
 [{pointsAllowed:0},10],[{pointsAllowed:1},7],[{pointsAllowed:6},7],[{pointsAllowed:7},4],[{pointsAllowed:13},4],[{pointsAllowed:14},1],[{pointsAllowed:20},1],[{pointsAllowed:21},0],[{pointsAllowed:27},0],[{pointsAllowed:28},-1],[{pointsAllowed:34},-1],[{pointsAllowed:35},-4],
 [{sacks:3,interceptions:2,fumbleRecoveries:1,touchdowns:1,safeties:1,blockedKicks:1,returnTD:1,extraPointReturned:1,pointsAllowed:21},27]
];
const dstRuleBad=dstCases.map(([input,expected])=>({input,expected,actual:scoreDefense(input)})).filter(x=>x.actual!==x.expected);
console.log(JSON.stringify({season,kicker:{rows:kChecked.length,exact:kChecked.length-kBad.length,accuracy:kChecked.length?(kChecked.length-kBad.length)/kChecked.length:null,mismatches:kBad.length,examples:kBad.slice(0,10).map(x=>({week:x.r.week,name:x.r.player_display_name,expected:x.expected,actual:x.actual,delta:x.delta,fg50_59:n(x.r.fg_made_50_59),fg60:n(x.r.fg_made_60_),pat:n(x.r.pat_made)}))},dst:{rows:dst.length,ruleCases:dstCases.length,ruleMismatches:dstRuleBad,teamSchemaAvailable:available,teamSchemaMissing:missing,fullySourceValidated:missing.length===0,note:missing.length?'Yahoo DST rule engine is validated at scoring boundaries, but nflverse team weekly schema does not expose every required DST component; PBP aggregation is required for full source validation.':'All required team-stat fields detected.'}},null,2));
if(kBad.length||dstRuleBad.length)process.exitCode=2;
