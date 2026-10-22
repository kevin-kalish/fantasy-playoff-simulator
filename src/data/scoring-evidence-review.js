import {compareYahooScoringToModel} from './yahoo-scoring-comparison.js';
export function reviewScoringEvidence({settings,crossProvider,bonusConfirmed=false}={}){
 const comparison=settings?compareYahooScoringToModel(settings):null;
 const issues=[];
 if(!comparison)issues.push('missing-yahoo-settings');
 else if(comparison.errors.length||comparison.mismatches.length||comparison.unknown.length||comparison.missing.length)issues.push('modifier-comparison-incomplete');
 if(!bonusConfirmed)issues.push('yardage-bonus-not-confirmed');
 if(!crossProvider)issues.push('missing-independent-actuals-audit');
 const summary=crossProvider?.summary??{};
 const coverage=crossProvider?.participationCoverage??{};
 if(crossProvider){
  if(!Number.isInteger(summary.totalMatched)||summary.totalMatched<=0)issues.push('no-matched-player-actuals');
  if(crossProvider.pass!==true)issues.push('cross-provider-audit-not-passing');
  if(coverage.scoringParityPass!==true)issues.push('scoring-parity-not-passing');
  if(coverage.participationCoverageComplete!==true)issues.push('participation-coverage-incomplete');
  if(Number(summary.excludedDefenses??0)>0)issues.push('defense-scoring-excluded');
 }
 // An independent Yahoo player-score audit cannot, by itself, validate every
 // scoring event or prove that projection and scoring pipelines are identical.
 issues.push('model-scoring-path-not-independently-verified');
 return {schemaVersion:1,modifierComparison:comparison?{checked:comparison.checked,matching:comparison.matching,errors:comparison.errors,mismatches:comparison.mismatches,missing:comparison.missing,unknown:comparison.unknown}:null,bonusConfirmed,actuals:crossProvider?{totalMatched:summary.totalMatched??null,excludedDefenses:summary.excludedDefenses??null,scoringParityPass:coverage.scoringParityPass===true,participationCoverageComplete:coverage.participationCoverageComplete===true}:null,issues,verified:false,captureGateEligible:false,note:'Evidence review only. Never use this report to unlock prospective capture or calibration without independent model-path and DST validation.'};
}
