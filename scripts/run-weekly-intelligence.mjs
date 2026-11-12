import {applyLineupManagementStress} from '../src/model/lineup-management-stress.js';
import {assessLongRangeJump} from '../src/model/long-range-jump-diagnostic.js';
import {simulateLeague} from '../src/simulator.js';
import {buildProvisionalReplacementScenario} from '../src/model/provisional-replacement-scenario.js';
import {assessPositionSourceCoverage} from '../src/data/position-source-coverage.js';
import {assessTeamProjectionQuality} from '../src/model/team-projection-quality.js';
import {assessProjectionFreshness} from '../src/data/projection-freshness.js';
import fs from 'node:fs';
import {captureCompletedWeekProbability,reconcileCompletedWeekResult} from '../src/data/weekly-playoff-history.js';
import {buildPrivatePreview} from './build-private-dashboard-preview.mjs';
import {buildPrivateProvisionalPreview} from './build-private-provisional-preview.mjs';
import path from 'node:path';
import {buildProjectionArchive,saveProjectionArchive} from '../src/data/projection-archive.js';
import {diagnoseStartSit} from '../src/model/start-sit-diagnostic.js';
import {validateIndependentSeeds} from '../src/model/independent-seed-validation.js';
import {prepareLeagueSimulation} from '../src/model/league-preparation.js';
import {assessSimulationReadiness} from '../src/model/simulation-readiness.js';
import {inventoryFutureRosterCandidates} from '../src/model/future-roster-candidate-inventory.js';
import {estimateFutureReplacementLevels,diagnoseFutureReplacementExclusions} from '../src/model/future-replacement-level.js';
import {auditWeeklyPositionCoverage} from '../src/data/weekly-position-coverage-audit.js';
import {futureReplacementProjectionWeeks,candidateTargetedProjectionWeeks} from '../src/model/future-replacement-projection-horizon.js';
import {compareLineupScenarios} from '../src/model/lineup-scenario-comparison.js';
import {buildLeagueIntelligenceReport} from '../src/model/league-intelligence-report.js';
import {formatWeeklyIntelligence} from '../src/model/weekly-intelligence-format.js';
import {simulationFingerprint} from '../src/model/simulation-fingerprint.js';
import {discoverTradeCandidates} from '../src/model/trade-candidate-source.js';
import {loadWeeklyProjectionHorizon} from '../src/data/weekly-projection-provider.js';
import {JerryGMClient,normalizeJerryGMSeasonProjections} from '../src/data/jerrygm.js';
import {assessSeasonBaselineSource} from '../src/data/season-baseline-quality.js';

const [snapshotPath,specPath]=process.argv.slice(2);
if(!snapshotPath||!specPath){console.error('Usage: npm run intelligence:weekly -- <league-snapshot.json> <weekly-spec.json>');process.exit(1)}
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const snapshot=read(snapshotPath),spec=read(specPath);
const season=Number(spec.season??snapshot.source?.season),week=Number(spec.week);
if(!season||!week||!spec.teamId){console.error('weekly-spec.json requires teamId and week; season must be supplied or present in snapshot.source.season.');process.exit(2)}
const weeks=spec.weeks?.length?spec.weeks:[week];
const rosterNames=(snapshot.teams??[]).flatMap(team=>team.roster??team.lineup??[]).map(player=>String(player?.name??'').trim()).filter(Boolean);
const waiverNames=(spec.waivers?.candidates??[]).map(player=>String(player?.name??'').trim()).filter(Boolean);
const projectionNames=[...new Set([...rosterNames,...waiverNames])],projectionCachePath=process.env.PROJECTION_CACHE_PATH??'data/private/projection-cache.json',seasonCachePath=process.env.JERRYGM_SEASON_CACHE_PATH??`data/private/jerrygm-season-${season}.json`,forceProjectionRefresh=process.env.PROJECTION_REFRESH==='true';
let loaded;
try{loaded=await loadWeeklyProjectionHorizon({season,weeks,scoring:spec.scoring??'HALF',minimumRows:Number(spec.minimumProjectionRows??1),projectionNames,fixturePath:spec.projectionFixturePath??process.env.PROJECTION_FIXTURE_PATH??null});}
catch(error){console.error(`PROJECTIONS: FAIL; ${error.message}`);process.exit(2)}
let seasonProjectionRows=[];let seasonBaselineSourceQuality=null;
if(process.env.JERRYGM_API_KEY&&spec.useJerryGMSeasonBaseline!==false){
 try{
  let payload,seasonSource='jerrygm';if(!forceProjectionRefresh&&fs.existsSync(seasonCachePath)){payload=JSON.parse(fs.readFileSync(seasonCachePath,'utf8'));seasonSource='cache';}else{payload=await new JerryGMClient({apiKey:process.env.JERRYGM_API_KEY}).seasonProjections({season,scoring:spec.scoring??'HALF'});fs.mkdirSync('data/private',{recursive:true});fs.writeFileSync(seasonCachePath,JSON.stringify(payload,null,2)+'\n');}
  seasonProjectionRows=normalizeJerryGMSeasonProjections(payload,{season});
  seasonBaselineSourceQuality=assessSeasonBaselineSource(payload,seasonProjectionRows);
  const q=seasonBaselineSourceQuality;
  console.error(`SEASON SOURCE QUALITY: ${q.status}; returned ${q.returned}/${q.total??'unknown'}; ${(q.sourceFraction===null?'unknown':(100*q.sourceFraction).toFixed(1)+'%')} of reported provider pool; generated ${q.generatedAt??'unknown'}; data through week ${q.dataThroughWeek??'unknown'}.`);
  console.error(`SEASON SOURCE POSITIONS: ${Object.entries(q.byPosition).sort((a,b)=>a[0].localeCompare(b[0])).map(([p,n])=>p+'='+n).join(' | ')}`);
  if(q.truncated)console.error('SEASON SOURCE WARNING: provider response truncated; roster baseline misses cannot be attributed to identifier matching alone.');
  console.error(`SEASON BASELINE: ${seasonSource}; ${seasonProjectionRows.length} projections.`);
 }catch(error){console.error(`SEASON BASELINE: unavailable; ${error.message}; continuing with horizon-only long-range model.`);}
}
const calibrationPath=spec.calibrationPath??'data/private/ffpros-research-calibration.json';
const calibrationReport=calibrationPath&&fs.existsSync(calibrationPath)?read(calibrationPath):null;
const minimumProjectionMatchRate=Number(spec.minimumProjectionMatchRate??process.env.MIN_PROJECTION_MATCH_RATE??.9);
const simulations=Number(spec.simulations??process.env.SIMULATIONS??50000);
const scenarioSimulations=Number(spec.scenarioSimulations??process.env.SCENARIO_SIMULATIONS??250);
const confirmationSimulations=Number(spec.confirmationSimulations??process.env.CONFIRMATION_SIMULATIONS??20000);
const matchupImpactSimulations=Number(spec.matchupImpactSimulations??process.env.MATCHUP_IMPACT_SIMULATIONS??1000);
const longRangeSeasonWeight=Number(spec.longRangeSeasonWeight??process.env.LONG_RANGE_SEASON_WEIGHT??.65);
// Archive only live Yahoo-audited runs. Fixtures and unaudited imports are excluded.
if(spec.sourceAudit?.passed===true&&process.env.PROJECTION_ARCHIVE!=='false'){
 try{
  const providerByWeek=Object.fromEntries(loaded.trust.weekResults.map(r=>[r.week,r.provider]));
  const observedAtByWeek=Object.fromEntries(loaded.trust.weekResults.filter(r=>r.observedAt).map(r=>[r.week,r.observedAt]));
  const archive=buildProjectionArchive(loaded.rows,{scoring:spec.scoring??'HALF',provider:loaded.provider,providerByWeek,observedAtByWeek,leagueKey:spec.sourceAudit.leagueKey,refreshRequested:forceProjectionRefresh});
  const file=saveProjectionArchive('data/private/projection-archives',archive);
  console.error(`PROJECTION ARCHIVE: saved ${archive.rows.length} timestamped rows to ${file}; kickoff and realized scores require separate verification.`);
 }catch(error){console.error(`PROJECTION ARCHIVE: FAIL; ${error.message}; simulation continues, but no historical archive is claimed.`);}
}
const prepared=prepareLeagueSimulation(snapshot,loaded.rows,{calibrationReport,simulations,seed:Number(spec.seed??process.env.SEED??20260923),modelVariant:spec.modelVariant??process.env.MODEL_VARIANT??'correlated',minimumProjectionMatchRate,weeks,season,seasonProjectionRows,longRangeSeasonWeight});
const teamProjectionQuality=assessTeamProjectionQuality(prepared.league,{directWeeks:prepared.diagnostics.directProjectionWeeks??weeks,derivedWeeks:prepared.diagnostics.longRangeProjectionWeeks??prepared.league.longRangeProjectionWeeks??[],playoffWeeks:prepared.input.playoffWeeks??[]});
console.error('TEAM PROJECTION QUALITY (diagnostic; no model impact):');
for(const t of teamProjectionQuality)console.error('  '+t.teamName+': season '+t.baseline.matched+'/'+t.baseline.eligible+' ('+(t.baseline.coverage===null?'n/a':(100*t.baseline.coverage).toFixed(0)+'%')+'); derived '+t.derived.withSeason+'/'+t.derived.samples+' season-backed, '+t.derived.horizonOnly+' horizon-only; confidence '+(t.derived.meanConfidence===null?'n/a':(100*t.derived.meanConfidence).toFixed(0)+'%')+'.');
console.error('TEAM PROJECTED SCORING (diagnostic; submitted current week, modeled future lineups):');
for(const t of teamProjectionQuality)console.error('  '+t.teamName+': direct mean '+(t.scoring.directMean===null?'n/a':t.scoring.directMean.toFixed(1))+'; derived mean '+(t.scoring.derivedMean===null?'n/a':t.scoring.derivedMean.toFixed(1))+' over '+t.scoring.derivedWeekCount+' weeks.');
if(process.env.LONG_RANGE_JUMP_DIAGNOSTIC==='true'){
 console.error('LONG RANGE JUMP DECOMPOSITION (diagnostic; no model impact):');
 const jump=assessLongRangeJump(prepared.league,{directWeeks:prepared.diagnostics.directProjectionWeeks,derivedWeeks:prepared.diagnostics.longRangeProjectionWeeks,slots:prepared.diagnostics.lineupSlots});
 const fmt=n=>n===null?'n/a':n.toFixed(1);
 for(const t of jump){
  console.error('  '+t.teamName+': submitted direct '+fmt(t.directSubmittedMean)+' | optimized direct '+fmt(t.directOptimizedMean)+' | derived '+fmt(t.derivedMean)+' | optimization gap '+fmt(t.optimizationGap)+' | post-optimization gap '+fmt(t.postOptimizationGap));
  if(/aili|fightin|captain|james/i.test(t.teamName))for(const p of t.topContributors)console.error('    '+p.name+' ('+p.position+'): player delta '+fmt(p.playerDelta)+' | starts direct '+p.directStarts+', derived '+p.derivedStarts+' | '+p.source+' | baseline '+(p.seasonBaseline??'missing'));
 }
}
console.error('PLAYOFF SCORING (diagnostic; modeled lineup means):');
for(const t of teamProjectionQuality)console.error('  '+t.teamName+': derived regular '+(t.scoring.regularDerivedMean===null?'n/a':t.scoring.regularDerivedMean.toFixed(1))+'; playoffs '+(t.scoring.playoffMean===null?'n/a':t.scoring.playoffMean.toFixed(1))+'; delta '+(t.scoring.playoffVsRegularDelta===null?'n/a':t.scoring.playoffVsRegularDelta.toFixed(1))+'; playoff weeks '+t.scoring.playoffWeekCount+'.');
console.error('POSITION SOURCE ATTRIBUTION: '+assessPositionSourceCoverage(prepared.diagnostics.seasonProjectionCoverage,{sourceQuality:seasonBaselineSourceQuality}).map(p=>p.position+'='+p.unmatched+' unmatched ('+p.attribution+')').join(' | '));


prepared.input.metadata={...prepared.input.metadata,projectionProvider:loaded.trust};
const fingerprint=simulationFingerprint(prepared.input);
prepared.input.metadata.simulationFingerprint=fingerprint;
const readiness=assessSimulationReadiness(prepared,{minimumProjectionMatchRate});
if(process.env.LONG_RANGE_SENSITIVITY==='true'){
 const weights=[.35,.65,.85],n=Math.max(1000,Math.min(50000,Number(process.env.LONG_RANGE_SENSITIVITY_SIMULATIONS??5000)));
 if(!seasonProjectionRows.length)console.error('LONG RANGE SENSITIVITY: SKIPPED; no season baselines available.');
 else if(!readiness.ready)console.error('LONG RANGE SENSITIVITY: SKIPPED; baseline readiness failed.');
 else{
  console.error('LONG RANGE SENSITIVITY: diagnostic only; weights '+weights.join(', ')+'; '+n+' simulations each; common seed '+(spec.seed??process.env.SEED??20260923)+'.');
  for(const weight of weights){
   const candidate=prepareLeagueSimulation(snapshot,loaded.rows,{calibrationReport,simulations:n,seed:Number(spec.seed??process.env.SEED??20260923),modelVariant:spec.modelVariant??process.env.MODEL_VARIANT??'correlated',minimumProjectionMatchRate,weeks,season,seasonProjectionRows,longRangeSeasonWeight:weight});
   const check=assessSimulationReadiness(candidate,{minimumProjectionMatchRate});
   if(!check.ready){console.error('  weight '+weight.toFixed(2)+': SKIPPED (readiness failed)');continue;}
   const result=simulateLeague(candidate.input);
   console.error('  weight '+weight.toFixed(2)+': '+result.map(t=>t.name+' '+(100*t.championshipProbability).toFixed(1)+'% title / '+(100*t.playoffProbability).toFixed(1)+'% playoffs').join(' | '));
  }
  console.error('LONG RANGE SENSITIVITY WARNING: scenario odds are provisional, Monte Carlo estimates; changes may reflect projected lineups as well as blend values. This is not historical calibration.');
 }
}

if(process.env.LINEUP_MANAGEMENT_STRESS==='true'){
 if(!readiness.ready)console.error('LINEUP MANAGEMENT STRESS: SKIPPED; readiness failed.');
 else{
  const n=Math.max(1000,Math.min(50000,Number(process.env.LINEUP_MANAGEMENT_STRESS_SIMULATIONS??10000)));
  const base={...prepared.input,simulations:n};
  const control=simulateLeague(base);
  console.error('LINEUP MANAGEMENT STRESS: diagnostic only; '+n+' simulations per case; shared seed; same assumptions for all managers.');
  for(const rate of [.25,.5,.75]){
   const scenario=applyLineupManagementStress(base,prepared.league,{missRate:rate,seed:base.seed});
   const results=simulateLeague(scenario.input);
   console.error('  miss rate '+rate+': '+scenario.diagnostics.swaps+'/'+scenario.diagnostics.opportunities+' downgraded team-weeks; mean downgrade '+scenario.diagnostics.averageLoss.toFixed(1)+' pts.');
   for(const t of results){
    const baseline=control.find(x=>String(x.id)===String(t.id));
    console.error('    '+t.name+': title '+(100*t.championshipProbability).toFixed(1)+'% (delta '+(100*(t.championshipProbability-baseline.championshipProbability)).toFixed(1)+' pp); playoffs '+(100*t.playoffProbability).toFixed(1)+'% (delta '+(100*(t.playoffProbability-baseline.playoffProbability)).toFixed(1)+' pp)');
   }
  }
  console.error('LINEUP MANAGEMENT STRESS WARNING: synthetic uniform missed-upgrade assumptions, not observed manager behavior or calibrated probabilities; production unchanged.');
 }
}
console.error(`PROJECTIONS: ${loaded.provider}; ${loaded.rows.length} rows across weeks ${loaded.weeks.join(',')}; ${loaded.trust.degraded?'DEGRADED/FALLBACK':'PRIMARY'}.`);console.error(`PROJECTION SOURCE: ${loaded.provider}; ${loaded.trust.weekResults.map(x=>`W${x.week}=${x.provider}`).join(', ')}${forceProjectionRefresh?' [REFRESH REQUESTED]':''}.`);
const weeklyCacheUpdatedAt=fs.existsSync(projectionCachePath)?(()=>{try{return JSON.parse(fs.readFileSync(projectionCachePath,'utf8')).updatedAt??null}catch{return null}})():null;
const freshness=assessProjectionFreshness({weekResults:loaded.trust.weekResults,seasonSource:seasonBaselineSourceQuality,weeklyCacheUpdatedAt});
console.error('PROJECTION FRESHNESS: '+freshness.weeks.map(w=>'W'+w.week+'='+w.provenance+(w.ageHours===null?' (age unknown)':' ('+w.ageHours+'h old)')).join(' | ')+'.');
if(freshness.unknownAgeWeeks.length)console.error('PROJECTION FRESHNESS WARNING: original provider observation time unverified for weeks '+freshness.unknownAgeWeeks.join(', ')+'; cache updatedAt is not projection age.');
if(freshness.seasonBaseline)console.error('SEASON FRESHNESS: baseline generated '+(freshness.seasonBaseline.generatedAt??'unknown')+'; age '+(freshness.seasonBaseline.ageHours??'unknown')+'h; source data through W'+(freshness.seasonBaseline.dataThroughWeek??'?')+'.');
if(seasonProjectionRows.length){const c=prepared.diagnostics.seasonProjectionCoverage;console.error(`LONG RANGE: ${prepared.diagnostics.longRangeProjectionMethod}; season weight ${(100*prepared.diagnostics.longRangeSeasonWeight).toFixed(0)}%; season coverage ${(100*c.matchRate).toFixed(1)}%.`);if(c.byPosition)console.error(`SEASON BASELINE BY POSITION: ${Object.entries(c.byPosition).sort((a,b)=>a[0].localeCompare(b[0])).map(([position,v])=>`${position}=${v.matched}/${v.eligible} (${(100*v.matchRate).toFixed(0)}%)`).join(' | ')}`);if(c.missing?.length)console.error(`SEASON BASELINE MISSES (${c.missing.length}): ${c.missing.slice(0,30).map(x=>x.name??x.playerName??x.id).join(', ')}${c.missing.length>30?' ...':''}`);}
const confidence=prepared.diagnostics.longRangeConfidence;
if(confidence){const derived=prepared.diagnostics.longRangeProjectionWeeks??[];if(derived.length){const first=derived[0],last=derived.at(-1);console.error(`HORIZON CONFIDENCE: W${first} ${(100*confidence.byWeek[first]).toFixed(0)}% -> W${last} ${(100*confidence.byWeek[last]).toFixed(0)}% (${confidence.method}; diagnostic only).`);}}
console.error(`SIMULATION INPUT: ${fingerprint}; seed ${prepared.input.seed}; variant ${prepared.input.modelVariant}.`);
console.error(`READY CHECK: ${readiness.ready?'PASS':'FAIL'}; projections ${(100*readiness.projectionCoverage.matchRate).toFixed(1)}% usable; incomplete lineups ${readiness.incompleteLineups.length}.`);
let provisionalOdds=null;
if(!readiness.ready){
 if(process.env.PROVISIONAL_ODDS==='true'){
  const otherErrors=readiness.errors.filter(error=>!error.includes('optimized team-week lineup(s) are incomplete'));
  if(spec.sourceAudit?.passed!==true||loaded.trust?.degraded||otherErrors.length){
   console.error('PROVISIONAL ODDS: BLOCKED; Yahoo source audit, projection trust, or unrelated readiness checks failed.');
  }else{
   const n=Math.min(20000,Math.max(1000,Number(process.env.PROVISIONAL_SIMULATIONS??5000)||5000));
   const results=simulateLeague({...prepared.input,simulations:n});
   provisionalOdds={scenario:'no-replacement',simulations:n,incompleteTeamWeeks:readiness.incompleteLineups.length,teams:results.map(t=>({id:String(t.id),playoffProbability:t.playoffProbability,championshipProbability:t.championshipProbability,averageWins:t.averageWins}))};
   console.error(`PROVISIONAL ODDS: NO-REPLACEMENT SCENARIO ONLY; ${n} simulations; ${readiness.incompleteLineups.length} incomplete team-weeks; empty positions contribute no replacement points. NOT trusted, NOT archival, NOT calibrated live accuracy.`);
   for(const team of results.sort((a,b)=>b.playoffProbability-a.playoffProbability))console.error(`PROVISIONAL TEAM: ${team.name}: playoffs ${(100*team.playoffProbability).toFixed(1)}%; title ${(100*team.championshipProbability).toFixed(1)}%; average wins ${team.averageWins.toFixed(2)}.`);
   console.error('PROVISIONAL ODDS: No report, dashboard, history, or recommendations written.');
  }
 }
 console.error(`LINEUP BLOCKERS: ${readiness.blockingLineupGaps?.length??0} current-week or unresolved team-weeks; ${readiness.futureRosterGaps?.length??0} future roster-management team-weeks. No replacement projections assumed; trusted simulation remains blocked.`);
 const waiverPool=spec.waivers?.replacementCandidates??spec.waivers?.candidates??[];
 const diagnosticPool=process.env.FUTURE_REPLACEMENT_DIAGNOSTIC==='true'&&process.env.FUTURE_BALANCED_WAIVERS==='true'&&Array.isArray(spec.futureReplacementDiagnosticCandidates)?spec.futureReplacementDiagnosticCandidates:waiverPool;
 let replacementDiagnosticRows=loaded.rows;
 if(process.env.FUTURE_TARGETED_PROJECTION_FETCH==='true'&&process.env.FUTURE_REPLACEMENT_DIAGNOSTIC==='true'&&spec.sourceAudit?.passed===true&&!loaded.trust?.degraded){
  const targetWeeks=candidateTargetedProjectionWeeks({currentWeek:week,loadedWeeks:loaded.weeks,gapWeeks:readiness.futureRosterGaps.map(g=>g.week),playoffWeeks:prepared.input.playoffWeeks,maxWeeks:1});
  const names=[...new Set(diagnosticPool.map(p=>String(p.name??'').trim()).filter(Boolean))];
  if(!targetWeeks.length||!names.length)console.error('FUTURE TARGETED PROJECTION FETCH: SKIPPED; no eligible loaded gap week or candidate names.');
  else if(!process.env.FANTASYPROS_API_KEY&&!process.env.JERRYGM_API_KEY)console.error('FUTURE TARGETED PROJECTION FETCH: SKIPPED; no live projection API configured.');
  else{
   try{
    const targeted=await loadWeeklyProjectionHorizon({season,weeks:targetWeeks,scoring:spec.scoring??'HALF',minimumRows:1,projectionNames:names,cachePath:null,fixturePath:null,preferCache:false});
    if(targeted.trust?.degraded||!targeted.trust?.ready||!['fantasypros','jerrygm'].includes(targeted.provider))throw new Error('Targeted provider trust unavailable or degraded');
    // Replace only diagnostic rows for the refreshed week: avoid duplicate
    // provider rows being misclassified as ambiguous. Trusted rows are untouched.
    const targetedWeeks=new Set(targetWeeks);
    replacementDiagnosticRows=[...replacementDiagnosticRows.filter(r=>!targetedWeeks.has(Number(r.week))),...targeted.rows];
    console.error('FUTURE TARGETED PROJECTION FETCH: diagnostic-only W'+targetWeeks.join(',W')+'; '+targeted.rows.length+' rows; provider '+targeted.provider+'; original provider observation provenance unverified; trusted projections unchanged.');
    for(const c of auditWeeklyPositionCoverage(targeted.rows,{season,weeks:targetWeeks,weekResults:targeted.trust.weekResults}))console.error('FUTURE TARGETED PROJECTION COVERAGE: W'+c.week+' '+c.position+' '+c.rows+' rows / '+c.uniquePlayerIds+' distinct IDs.');
   }catch(error){console.error('FUTURE TARGETED PROJECTION FETCH: unavailable; '+error.message+'; trusted projections unchanged.');}
  }
 }

 if(process.env.FUTURE_REPLACEMENT_FETCH==='true'&&spec.sourceAudit?.passed===true&&!loaded.trust?.degraded){
  const extraWeeks=futureReplacementProjectionWeeks({currentWeek:week,loadedWeeks:loaded.weeks,gapWeeks:readiness.futureRosterGaps.map(g=>g.week),playoffWeeks:prepared.input.playoffWeeks,maxExtraWeeks:2});
  if(!extraWeeks.length)console.error('FUTURE REPLACEMENT FETCH: SKIPPED; no eligible uncovered regular-season gap weeks.');
  else if(!process.env.FANTASYPROS_API_KEY&&!process.env.JERRYGM_API_KEY)console.error('FUTURE REPLACEMENT FETCH: SKIPPED; no live projection API configured (cache/fixture not accepted).');
  else{
   try{
    const extra=await loadWeeklyProjectionHorizon({season,weeks:extraWeeks,scoring:spec.scoring??'HALF',minimumRows:1,projectionNames:[...new Set([...projectionNames,...diagnosticPool.map(p=>String(p.name??'').trim()).filter(Boolean)])],cachePath:null,fixturePath:null,preferCache:false});
    replacementDiagnosticRows=[...replacementDiagnosticRows,...extra.rows];
    console.error('FUTURE REPLACEMENT FETCH: diagnostic-only W'+extraWeeks.join(',W')+'; '+extra.rows.length+' rows; provider '+extra.provider+'; freshness and completeness unverified; no simulation or cache changes.');
    for(const c of auditWeeklyPositionCoverage(extra.rows,{season,weeks:extraWeeks,weekResults:extra.trust.weekResults}))console.error('FUTURE PROJECTION COVERAGE: W'+c.week+' '+c.position+' '+c.rows+' rows / '+c.uniquePlayerIds+' distinct IDs; provider '+c.provider+'; observation '+(c.observedAt??'unverified')+'; source provenance unverified.');
   }catch(error){console.error('FUTURE REPLACEMENT FETCH: unavailable; '+error.message+'; simulation unchanged.');}
  }
 }
 const inventory=inventoryFutureRosterCandidates(readiness.futureRosterGaps,waiverPool,loaded.rows);
 if(process.env.FUTURE_REPLACEMENT_DIAGNOSTIC==='true'){
  const coverage=auditWeeklyPositionCoverage(loaded.rows,{season,weeks:loaded.weeks,weekResults:loaded.trust.weekResults});
  for(const c of coverage)console.error('FUTURE PROJECTION COVERAGE: W'+c.week+' '+c.position+' '+c.rows+' rows / '+c.uniquePlayerIds+' distinct IDs; provider '+c.provider+'; original observation '+(c.observedAt??'unverified')+'; provider provenance unverified.');

  const estimates=estimateFutureReplacementLevels(readiness.futureRosterGaps,diagnosticPool,replacementDiagnosticRows,{season,currentWeek:week});
  for(const d of diagnoseFutureReplacementExclusions(readiness.futureRosterGaps,diagnosticPool,replacementDiagnosticRows,{season,currentWeek:week}))console.error('FUTURE REPLACEMENT EXCLUSIONS: W'+d.week+' '+d.slot+' position candidates '+d.positionCandidates+'; missing identity '+d.missingIdentity+'; missing bye '+d.missingBye+'; on bye '+d.onBye+'; current unavailable '+d.currentUnavailable+'; no weekly projection '+d.noWeeklyProjection+' (no position rows '+d.noPositionProjectionRows+', identity mismatch '+d.identityMismatch+'); ambiguous identity '+d.ambiguousWeeklyProjection+'; unique projection '+d.uniqueWeeklyProjection+'; current status and future availability unverified.');

  let replacementOdds=null;
  if(provisionalOdds&&process.env.PROVISIONAL_REPLACEMENT_ODDS==='true'){
   try{
    const scenario=buildProvisionalReplacementScenario(prepared.input,estimates,{currentWeek:week});
    const results=simulateLeague({...scenario,simulations:provisionalOdds.simulations});
    replacementOdds={scenario:'aggregate-replacement-sensitivity',simulations:provisionalOdds.simulations,incompleteTeamWeeks:provisionalOdds.incompleteTeamWeeks,teams:results.map(t=>({id:String(t.id),playoffProbability:t.playoffProbability,championshipProbability:t.championshipProbability,averageWins:t.averageWins}))};
    console.error('PROVISIONAL REPLACEMENT ODDS: aggregate scoring sensitivity computed; '+estimates.length+' hypothetical slots; no candidate allocation or future availability verified; NOT official.');
   }catch(error){console.error('PROVISIONAL REPLACEMENT ODDS: BLOCKED; '+error.message);}
  }
  if(process.env.FUTURE_PROVISIONAL_PREVIEW==='true'){
   if(spec.sourceAudit?.passed!==true||spec.sourceAudit?.week!==week||!spec.sourceAudit?.leagueKey||loaded.trust?.degraded){
    console.error('FUTURE PROVISIONAL PREVIEW: BLOCKED; source audit or projection trust failed.');
   }else{
    try{
     const previewRoot=path.resolve('data/private');
     fs.mkdirSync(previewRoot,{recursive:true});
     const standings=(snapshot.teams??[]).map(t=>({id:String(t.id),name:String(t.name),wins:t.wins,losses:t.losses,ties:t.ties,points:t.points,rank:t.rank}));
     const html=buildPrivateProvisionalPreview({estimates,standings,provisionalOdds,replacementOdds,week,season,provider:'Diagnostic-only; '+String(loaded.provider??'unverified')});
     const previewPath=path.join(previewRoot,'future-provisional-preview.html');
     fs.writeFileSync(previewPath,html,{mode:0o600,flag:'w'});
     console.error('FUTURE PROVISIONAL PREVIEW: private offline HTML at '+previewPath+'; '+(provisionalOdds?'no-replacement provisional odds included':'odds unavailable')+'; no recommendations.');
    }catch(error){console.error('FUTURE PROVISIONAL PREVIEW: unavailable; '+error.message);}
   }
  }
  const covered=estimates.filter(x=>x.points!=null);
  console.error('FUTURE REPLACEMENT DIAGNOSTIC: '+covered.length+'/'+estimates.length+' slots estimated from target-week rows; hypothetical only, no transactions, no odds impact.');
  for(const estimate of estimates)console.error('FUTURE REPLACEMENT ESTIMATE: W'+estimate.week+' '+estimate.slot+' '+(estimate.points===null?'unavailable':estimate.points.toFixed(1)+' pts')+' ('+estimate.method+'); provisional, future availability unverified.');
 }

 console.error(`FUTURE ROSTER CANDIDATES: ${inventory.length} future team-weeks; ${waiverPool.length} Yahoo candidate records from focus-team waiver scan; position matches only, no verified weekly projection evidence, no transactions assumed.`);
 for(const row of inventory)for(const slot of row.slots)console.error(`FUTURE ROSTER GAP: ${row.teamName} W${row.week} ${slot.slot}: ${slot.positionMatches} candidate position matches; known bye ${slot.knownByeWeek}, on bye ${slot.onBye}, off bye ${slot.offBye}, unknown bye ${slot.unknownByeWeek}; current unavailable ${slot.currentStatusUnavailable}/${slot.currentStatusKnown} known statuses, unknown status ${slot.currentStatusUnknown}; exact-ID weekly projection overlap ${slot.exactIdWeekProjectionCandidates}; unique name-position-team weekly overlap ${slot.uniqueNamePositionTeamWeekCandidates} (identity unverified); future availability and weekly projections unverified; provisional only.`);
 for(const row of readiness.blockingLineupGaps??[])console.error(`UNRESOLVED LINEUP: ${row.teamName??row.teamId} W${row.week}; ${row.slots.map(slot=>`${slot.slot}=${slot.reason}`).join(', ')||'details unavailable'}.`);
 for(const row of readiness.incompleteLineupDetails??[])for(const slot of row.slots)console.error(`INCOMPLETE LINEUP: ${row.teamName??row.teamId} W${row.week} ${slot.slot}: ${slot.reason} (eligible ${slot.eligibleRosterCount}; bye ${slot.byeCount}; unavailable ${slot.unavailableCount}; missing projections ${slot.missingProjectionCount}).`);
 if(spec.sourceAudit?.passed===true&&readiness.incompleteLineups.length&&process.env.LINEUP_SCENARIO_COMPARE!=='false'){
  try{
   const hypothetical=prepareLeagueSimulation(snapshot,loaded.rows,{calibrationReport,simulations,seed:Number(spec.seed??process.env.SEED??20260923),modelVariant:spec.modelVariant??process.env.MODEL_VARIANT??'correlated',minimumProjectionMatchRate,weeks,season,seasonProjectionRows,longRangeSeasonWeight,lineupPolicy:'optimized-hypothetical'});
   const comparison=compareLineupScenarios(prepared,hypothetical,{teamId:spec.teamId,week,minimumProjectionMatchRate,simulations:Math.min(2000,Math.max(100,scenarioSimulations))});
   if(comparison.status==='compared'){
    fs.mkdirSync('data/private',{recursive:true});
    const comparisonPath=`data/private/lineup-scenario-week-${week}.json`;
    fs.writeFileSync(comparisonPath,JSON.stringify(comparison,null,2)+'\n',{mode:0o600});
    console.error(`LINEUP SCENARIOS: compared actual submitted lineup with optimized hypothetical; private report ${comparisonPath}; main readiness remains FAIL.`);
   }else console.error(`LINEUP SCENARIOS: ${comparison.status}; ${comparison.reason}`);
  }catch(error){console.error(`LINEUP SCENARIOS: unavailable; ${error.message}`);}
 }
 for(const error of readiness.errors)console.error(`ERROR: ${error}`);console.log(JSON.stringify({readiness,projectionHealth:loaded.trust,metadata:prepared.input.metadata,report:null},null,2));process.exitCode=2;}
else{
 const tradeDiscovery=spec.tradeDiscovery;
 if(tradeDiscovery?.enabled&&!(spec.trades?.length)){
  try{
   const discovered=discoverTradeCandidates(prepared.input,{teamId:spec.teamId,projectionRows:loaded.rows,weeks,freeAgents:spec.waivers?.replacementCandidates??spec.waivers?.candidates??[],maxPartners:Number(tradeDiscovery.maxPartners??9),maxPlayersPerTeam:Number(tradeDiscovery.maxPlayersPerTeam??7),maxScenarios:Number(tradeDiscovery.maxScenarios??36),valueTolerance:Number(tradeDiscovery.valueTolerance??.35)});
   spec.trades=discovered.scenarios;
   spec.scanAvailability={...spec.scanAvailability,trades:{status:'available',source:'projection-value-screen',scenarioCount:discovered.scenarios.length,diagnostics:discovered.diagnostics}};
   console.error(`TRADES: VORP roster-fit discovery; ${discovered.diagnostics.partnerCount} partners / ${discovered.diagnostics.generatedScenarioCount} generated / ${discovered.scenarios.length} evaluated scenarios; ${discovered.diagnostics.freeAgentCount} free agents informed replacement.`);for(const candidate of discovered.scenarios.slice(0,5)){const d=candidate.discovery??{};console.error(`TRADE CANDIDATE: ${candidate.label}; value ${Number(d.giveValue??0).toFixed(1)} -> ${Number(d.getValue??0).toFixed(1)}; gap ${(100*Number(d.valueGap??0)).toFixed(1)}%; fit ${Number(d.fitScore??0).toFixed(1)}; needs ${Number(d.needGain??0).toFixed(1)}/${Number(d.partnerNeedGain??0).toFixed(1)}; surplus ${Number(d.surplusCost??0).toFixed(1)}/${Number(d.partnerSurplusCost??0).toFixed(1)}.`);}console.error(`TRADE BASELINES: replacement ${Object.entries(discovered.diagnostics.replacementByPosition??{}).map(([p,v])=>`${p}=${Number(v).toFixed(1)}`).join(', ')}; need median ${Object.entries(discovered.diagnostics.needBenchmarkByPosition??{}).map(([p,v])=>`${p}=${Number(v).toFixed(1)}`).join(', ')}.`);
  }catch(error){spec.scanAvailability={...spec.scanAvailability,trades:{status:'unavailable',reason:error.message}};console.error(`TRADES: unavailable; ${error.message}; continuing without trade recommendations.`);}
 }
 const simulationTrust={requireProjectionCoverage:true,minimumProjectionMatchRate,...(spec.sourceAudit?{audit:spec.sourceAudit}:{})};
 if(spec.sourceAudit)console.error(`SOURCE AUDIT: ${spec.sourceAudit.passed?'PASS':'FAIL'}; ${spec.sourceAudit.checks?.length??0} checks; league ${spec.sourceAudit.leagueKey??'unknown'} week ${spec.sourceAudit.week??week}.`);
 console.error(`MONTE CARLO: running ${simulations.toLocaleString()} core simulations; scenario screening uses ${scenarioSimulations.toLocaleString()} each; promising actions confirm at ${confirmationSimulations.toLocaleString()}...`);
 const started=Date.now();
 const report=buildLeagueIntelligenceReport(prepared.input,{...spec,week,projectionRows:loaded.rows,providerHealth:loaded.trust,enrichedLeague:prepared.league,trust:simulationTrust,scenarioSimulations,confirmationSimulations,matchupImpactSimulations,replicateTopRecommendationSeeds:Number(spec.replicateTopRecommendationSeeds??process.env.GM_ACTION_REPLICATION_SEEDS??2)});
 console.error(`MONTE CARLO: complete in ${((Date.now()-started)/1000).toFixed(1)}s.`);
 const seedRuns=Number(spec.seedValidationRuns??process.env.SEED_VALIDATION_RUNS??0);
 let seedValidation=null;
 if(seedRuns){
  seedValidation=validateIndependentSeeds(prepared.input,{runs:seedRuns,simulations:Number(spec.seedValidationSimulations??process.env.SEED_VALIDATION_SIMULATIONS??simulations),focusTeamId:spec.teamId});
  const sample=seedValidation.teams[0];
  console.error(`SEED VALIDATION: ${seedRuns} independent runs x ${seedValidation.simulationsPerRun.toLocaleString()}; playoff ${(100*sample.playoff.min).toFixed(2)}%-${(100*sample.playoff.max).toFixed(2)}%; championship ${(100*sample.championship.min).toFixed(2)}%-${(100*sample.championship.max).toFixed(2)}%; sampling stability ${sample.stability.playoffWithinTolerance&&sample.stability.championshipWithinTolerance?'PASS':'REVIEW'}.`);
 }
 let startSitDiagnostic=null;
 if(process.env.START_SIT_DIAGNOSTIC==='true'){
  const action=(report.recommendations?.items??[]).find(x=>x.type==='start-sit'&&x.details?.startPlayerId&&x.details?.sitPlayerId);
  if(!action)console.error('START/SIT DIAGNOSTIC: no confirmed start/sit action available.');
  else{
   startSitDiagnostic=diagnoseStartSit(prepared.input,{teamId:spec.teamId,week,startPlayerId:action.details.startPlayerId,sitPlayerId:action.details.sitPlayerId,projectionRows:loaded.rows,runs:Number(process.env.START_SIT_DIAGNOSTIC_RUNS??5),simulations:Number(process.env.START_SIT_DIAGNOSTIC_SIMULATIONS??20000)});
   const d=startSitDiagnostic;
   console.error(`START/SIT DIAGNOSTIC: ${d.action.start} for ${d.action.sit}; ${d.runs.length} independent seeds x ${Number(process.env.START_SIT_DIAGNOSTIC_SIMULATIONS??20000).toLocaleString()}; point delta ${d.pointDelta.toFixed(2)}; playoff delta range ${(100*d.playoff.min).toFixed(2)} to ${(100*d.playoff.max).toFixed(2)} pp; mean ${(100*d.playoff.mean).toFixed(2)} pp; positive ${d.playoff.positiveRuns}/${d.runs.length}; future lineups unchanged ${d.scope.futureLineupsUnchanged}.`);
  }
 }
 const t=report.timing;console.error(`TIMING: core ${t.coreMonteCarloSeconds.toFixed(1)}s | scenario baseline ${t.scenarioBaselineSeconds.toFixed(1)}s | matchup ${t.matchupSeconds.toFixed(1)}s | recommendations ${t.recommendationsSeconds.toFixed(1)}s | total ${t.totalSeconds.toFixed(1)}s.`);
 const rt=report.recommendations?.diagnostics?.timing;if(rt){const ts=x=>Number(x??0).toFixed(1);console.error(`RECOMMENDATION TIMING: setup ${ts(rt.setupSeconds)}s | waivers ${ts(rt.waiverSeconds)}s (apply ${ts(rt.waiverApplySeconds)}s, simulate ${ts(rt.waiverSimulationSeconds)}s) | start/sit ${ts(rt.startSitSeconds)}s | trade screen ${ts(rt.tradeScreenSeconds)}s (apply ${ts(rt.tradeApplySeconds)}s, simulate ${ts(rt.tradeSimulationSeconds)}s) | confirmation ${ts(rt.confirmationSeconds)}s | finalize ${ts(rt.finalizeSeconds)}s.`);}
const c=report.recommendations?.confirmation;if(c){const staged=c.precheckCount?`${c.precheckPassedCount}/${c.precheckCount} trade candidates passed the ${c.precheckSimulations.toLocaleString()}-simulation precheck; `:'';console.error(`CONFIRMATION: ${staged}${c.evaluatedCount??c.confirmedCount}/${c.finalCandidateCount??c.candidateCount} finalists re-evaluated at ${c.simulations.toLocaleString()} simulations each; ${c.passedCount??0} passed the final recommendation gate.`);}
 console.log(formatWeeklyIntelligence(report,{maxActions:Number(spec.maxActions??5)}));
 if(spec.outputPath){fs.writeFileSync(spec.outputPath,JSON.stringify({readiness,report,...(seedValidation?{seedValidation}:{}),...(startSitDiagnostic?{startSitDiagnostic}:{})},null,2));console.error(`REPORT JSON: ${spec.outputPath}`);}
 if(spec.sourceAudit?.passed===true && spec.sourceAudit.week===week && spec.sourceAudit.leagueKey && spec.outputPath && process.env.PLAYOFF_HISTORY_CAPTURE!=='false'){
  try{
   const captured=captureCompletedWeekProbability({document:{readiness,report},currentWeek:week,season,leagueKey:spec.sourceAudit.leagueKey});
   console.error(`PLAYOFF HISTORY: ${captured.status}; ${captured.reason??('completed week '+captured.week)}`);
  }catch(error){console.error(`PLAYOFF HISTORY: FAIL; ${error.message}; report preserved; archive unchanged.`);}
 }
 if(spec.sourceAudit?.passed===true&&spec.sourceAudit.week===week&&spec.sourceAudit.leagueKey&&spec.completedYahooResult?.week===week-1){
  try{
   const outcome=reconcileCompletedWeekResult({week:week-1,result:spec.completedYahooResult.result,teamId:spec.teamId,season,leagueKey:spec.sourceAudit.leagueKey});
   console.error(`PLAYOFF RESULT: ${outcome.status}; ${outcome.reason??('completed week '+outcome.week+' '+outcome.result)}`);
  }catch(error){console.error(`PLAYOFF RESULT: unavailable; ${error.message}; archived forecast preserved.`);}
 }
 if(spec.sourceAudit?.passed===true && spec.sourceAudit.week===week && spec.sourceAudit.leagueKey && spec.outputPath && process.env.DASHBOARD_AUTO_PREVIEW!=='false'){
  try{
   const privateRoot=path.resolve('data/private');
   const outputFile=path.resolve(spec.outputPath);
   if(!outputFile.startsWith(privateRoot+path.sep))throw new Error('Refusing to generate preview from a report outside data/private');
   const dashboardReport={...report};
   const archivePath=path.join(privateRoot,'playoff-probability-history.json');
   if(fs.existsSync(archivePath)){
    const archive=JSON.parse(fs.readFileSync(archivePath,'utf8'));
    if(String(archive.teamId)!==String(report.team?.id)||Number(archive.season)!==Number(season)||String(archive.leagueKey)!==String(spec.sourceAudit.leagueKey))throw new Error('History archive league/season/team mismatch; preview withheld');
    dashboardReport.playoffHistory=archive.history;
   }
   const renderer=fs.readFileSync('src/ui/live-dashboard-v1.js','utf8');
   const html=buildPrivatePreview({readiness,report:dashboardReport},renderer);
   const previewPath=path.join(privateRoot,'live-dashboard-preview.html');
   fs.writeFileSync(previewPath,html,{mode:0o600});
   console.error('DASHBOARD PREVIEW: private offline HTML updated at '+previewPath);
  }catch(error){console.error('DASHBOARD PREVIEW: SKIPPED; '+error.message);}
 }
 if(spec.includeJson) console.log(JSON.stringify({readiness,report},null,2));
}